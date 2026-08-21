import base64
import json
import os
import queue
import threading
import time
import uuid

import cv2

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, get_db
from app.core.dependencies import MANAGEMENT_ROLES, require_roles
from app.crud.analytics import get_last_processed
from app.models.shelf import Shelf
from app.models.store import Store
from app.services.notifications import sync_store_notifications
from app.services.video_stream import VideoStreamError, start_video_stream


router = APIRouter(
    prefix="/api/camera",
    tags=["Camera"],
    # Running the pipeline is operational configuration, not an analytical
    # read, so it sits in the same tier as shelf management.
    dependencies=[Depends(require_roles(*MANAGEMENT_ROLES))],
)


# Videos must live inside this directory. A server-side source names a file
# relative to it, never a full path, so the endpoint cannot be used to open
# arbitrary files elsewhere on the server.
VIDEO_ROOT = os.path.abspath(
    os.getenv(
        "VIDEO_SOURCE_DIR",
        os.path.join("app", "static", "videos"),
    )
)

# Uploads land in their own subdirectory so they are easy to prune and are
# kept out of version control (see backend/.gitignore).
UPLOAD_ROOT = os.path.join(VIDEO_ROOT, "uploads")

# Containers OpenCV can open with the bundled FFMPEG backend.
ALLOWED_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm"}

# Guards against filling the disk with a single request.
MAX_UPLOAD_BYTES = 500 * 1024 * 1024

# Upper bound on a single run. A camera stream never ends on its own and the
# headless pipeline has no interactive stop key, so every request is bounded to
# keep it from hanging.
MAX_RUN_SECONDS = 120
DEFAULT_RUN_SECONDS = 30


def resolve_source(raw: str):
    """
    Turn a server-side source into something cv2.VideoCapture accepts.

    Digits become a camera index. Anything else is treated as a filename
    inside VIDEO_ROOT, with the resolved path checked to be under that root so
    "../../etc/passwd" style inputs are rejected.
    """

    candidate = (raw or "").strip()

    if not candidate:
        raise HTTPException(status_code=400, detail="No source supplied")

    if candidate.isdigit():
        return int(candidate)

    resolved = os.path.abspath(os.path.join(VIDEO_ROOT, candidate))

    if os.path.commonpath([resolved, VIDEO_ROOT]) != VIDEO_ROOT:
        raise HTTPException(
            status_code=400,
            detail="Source must be a file inside the configured video directory",
        )

    if not os.path.isfile(resolved):
        raise HTTPException(
            status_code=404,
            detail=f"Video not found: {candidate}",
        )

    return resolved


def save_upload(upload: UploadFile) -> str:
    """
    Persist an uploaded video and return its path.

    The client filename is never used on disk — only its extension, after
    checking it against the allowed set. The stored name is generated, so a
    crafted filename cannot traverse directories or overwrite anything.
    """

    extension = os.path.splitext(upload.filename or "")[1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported video format. Allowed: "
                + ", ".join(sorted(ALLOWED_EXTENSIONS))
            ),
        )

    os.makedirs(UPLOAD_ROOT, exist_ok=True)

    destination = os.path.join(UPLOAD_ROOT, f"{uuid.uuid4().hex}{extension}")

    size = 0

    try:
        with open(destination, "wb") as target:
            while True:
                chunk = upload.file.read(1024 * 1024)

                if not chunk:
                    break

                size += len(chunk)

                if size > MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail=(
                            "Video exceeds the "
                            f"{MAX_UPLOAD_BYTES // (1024 * 1024)} MB upload limit"
                        ),
                    )

                target.write(chunk)

    except HTTPException:
        # Don't leave a partial file behind when the upload is rejected.
        if os.path.exists(destination):
            os.remove(destination)
        raise

    except Exception as error:
        if os.path.exists(destination):
            os.remove(destination)
        raise HTTPException(
            status_code=400,
            detail=f"Could not save upload: {error}",
        )

    finally:
        upload.file.close()

    if size == 0:
        os.remove(destination)
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    return destination


def parse_shelf_map(raw: str | None):
    """
    Read the zone-to-shelf mapping sent alongside a multipart upload.

    It arrives as a JSON string because multipart form fields are flat.
    """

    if not raw or not raw.strip():
        return None

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400,
            detail="shelf_map must be valid JSON",
        )

    if not isinstance(parsed, dict):
        raise HTTPException(
            status_code=400,
            detail="shelf_map must be an object of region to shelf id",
        )

    try:
        return {str(region): int(shelf) for region, shelf in parsed.items()}
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="shelf_map values must be shelf ids",
        )


def prepare_run(db, store_id, shelf_map, source, max_seconds, file):
    """
    Validate a run request and stage its source, before any frame is read.

    Everything that can be rejected cheaply is rejected here — the run bound,
    the store, the shelf mapping, the upload — so a caller gets a real HTTP
    status rather than a failure buried halfway through a video. Shared by the
    batch endpoint and the streaming one so the two cannot drift apart in what
    they accept.

    Returns (resolved_source, source_label, uploaded_path, mapping).
    """

    if max_seconds < 1 or max_seconds > MAX_RUN_SECONDS:
        raise HTTPException(
            status_code=422,
            detail=f"max_seconds must be between 1 and {MAX_RUN_SECONDS}",
        )

    store = db.query(Store).filter(Store.id == store_id).first()

    if store is None:
        raise HTTPException(
            status_code=404,
            detail=f"Store not found: {store_id}",
        )

    mapping = parse_shelf_map(shelf_map)

    # Every declared shelf must exist and belong to the store being processed,
    # otherwise sessions would be filed against another store's shelf.
    if mapping:
        shelf_ids = set(mapping.values())

        owned = {
            shelf.id
            for shelf in db.query(Shelf)
            .filter(Shelf.id.in_(shelf_ids))
            .filter(Shelf.store_id == store_id)
            .all()
        }

        invalid = shelf_ids - owned

        if invalid:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Shelves do not exist or belong to another store: "
                    + ", ".join(str(i) for i in sorted(invalid))
                ),
            )

    uploaded_path = None

    if file is not None and file.filename:
        uploaded_path = save_upload(file)
        resolved_source = uploaded_path
        source_label = file.filename
    else:
        resolved_source = resolve_source(source or "0")
        source_label = source or "0"

    return resolved_source, source_label, uploaded_path, mapping


def record_notifications(db, store_id):
    """
    Note any alert this run's analytics raised.

    Analytics just changed, which is the only moment the alert state for this
    store can change. Recording findings here keeps it out of the read paths,
    so simply opening a dashboard never writes notifications.
    """

    try:
        return len(sync_store_notifications(db, store_id))
    except Exception as error:
        # A processed video is the valuable outcome; failing to note an alert
        # must not turn a successful run into an error.
        print(f"Could not record notifications for store {store_id}: {error}")
        return 0


@router.post("/process")
def process_video(
    db: Session = Depends(get_db),
    # Which store this footage belongs to. Required: without it the sessions
    # would be written unattributed and pool with every other store's data,
    # which is the bug this parameter exists to prevent.
    store_id: int = Form(...),
    # JSON object mapping a frame region to a Shelf id, e.g.
    # {"Left Display": 7}. The pipeline never infers this — a region is frame
    # geometry, not a shelf record — so shelf_id is only set for regions the
    # caller explicitly declares.
    shelf_map: str | None = Form(None),
    # Server-side filename inside VIDEO_SOURCE_DIR, or "0"/"1" for a locally
    # attached camera index. Ignored when a file is uploaded.
    source: str | None = Form(None),
    max_seconds: int = Form(DEFAULT_RUN_SECONDS),
    # An uploaded video. This is the normal path from the dashboard.
    file: UploadFile | None = File(None),
):
    """
    Process one video and refresh this store's analytics.

    On-demand batch processing, not a live stream: the source is processed to
    completion, shopper sessions are written against the given store, the
    heatmap is regenerated and segmentation re-runs for that store.

    Accepts either an uploaded file (multipart) or the name of a video already
    sitting in the configured video directory.
    """

    resolved_source, source_label, uploaded_path, mapping = prepare_run(
        db,
        store_id=store_id,
        shelf_map=shelf_map,
        source=source,
        max_seconds=max_seconds,
        file=file,
    )

    try:
        summary = start_video_stream(
            resolved_source,
            display=False,
            max_seconds=max_seconds,
            store_id=store_id,
            shelf_map=mapping,
        )

    except VideoStreamError as error:
        # The source could not be opened, so nothing ran and nothing was
        # written. Existing analytics are untouched.
        _discard(uploaded_path)
        raise HTTPException(status_code=400, detail=str(error))

    except Exception as error:
        # An unexpected mid-run failure. Sessions committed before the failure
        # remain valid; the client is told the run did not complete.
        _discard(uploaded_path)
        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {error}",
        )

    notifications_created = record_notifications(db, store_id)

    return {
        "status": "completed",
        "source": source_label,
        "store_id": store_id,
        "notifications_created": notifications_created,
        "uploaded": uploaded_path is not None,
        "frames_processed": summary["frames_processed"],
        "sessions_written": summary["sessions_written"],
        "session_write_failures": summary["session_write_failures"],
        "heatmap_generated": summary["heatmap_generated"],
        "segmentation_ran": summary["segmentation_ran"],
        "duration_seconds": summary["duration_seconds"],
        "stopped_at_limit": summary["stopped_at_limit"],
        "last_processed": get_last_processed(db, store_id=store_id),
    }


def _discard(path: str | None):
    """Remove an upload whose run never produced anything."""

    if path and os.path.exists(path):
        try:
            os.remove(path)
        except OSError:
            # Cleanup is best effort; a stale upload is not worth failing on.
            pass


# ---------------------------------------------------------------------------
# Live progress stream
# ---------------------------------------------------------------------------
# The same run as /process, reported as it happens instead of only at the end.
#
# Nothing about the pipeline changes here. start_video_stream already draws
# every overlay onto its working frame — YOLO boxes, ByteTrack ids, the
# MediaPipe face mesh, the shelf region rectangles and the frame/FPS/time
# readout — because that is what its interactive preview window shows. This
# endpoint subscribes to those finished frames through the observer hook and
# forwards them; it does not detect, track, annotate or measure anything of
# its own.

# Streamed frames are for viewing, not archiving, so they are scaled down and
# JPEG-compressed. The frame the pipeline reasons about is untouched — only the
# copy handed to the browser is resized.
PREVIEW_MAX_WIDTH = 860
PREVIEW_JPEG_QUALITY = 72

# Ceiling on how many frames per second reach the browser. The pipeline is
# normally slower than this, so in practice every frame is sent; the cap only
# stops a fast run from flooding the connection.
PREVIEW_MAX_FPS = 15

# Frames buffered between the pipeline thread and the response. When the buffer
# is full the oldest preview frame is dropped rather than blocking the
# pipeline: a slow client must never slow down the analytics being written.
FRAME_BUFFER = 8

# How long the reader waits before sending a keep-alive comment. A single frame
# can take longer than a proxy idle timeout on a cold model load.
HEARTBEAT_SECONDS = 10.0


def encode_preview(frame):
    """
    Turn one annotated frame into a data URI the browser can render.

    Returns None if the frame cannot be encoded, which is reported as a dropped
    frame rather than failing the run.
    """

    height, width = frame.shape[:2]

    if width > PREVIEW_MAX_WIDTH:
        scale = PREVIEW_MAX_WIDTH / float(width)

        frame = cv2.resize(
            frame,
            (PREVIEW_MAX_WIDTH, max(1, int(height * scale))),
            interpolation=cv2.INTER_AREA,
        )

    ok, buffer = cv2.imencode(
        ".jpg",
        frame,
        [int(cv2.IMWRITE_JPEG_QUALITY), PREVIEW_JPEG_QUALITY],
    )

    if not ok:
        return None

    return "data:image/jpeg;base64," + base64.b64encode(buffer).decode("ascii")


def sse(kind, payload):
    """One Server-Sent Event."""

    return f"event: {kind}\ndata: {json.dumps(payload)}\n\n"


@router.post("/process/stream")
def process_video_stream(
    db: Session = Depends(get_db),
    store_id: int = Form(...),
    shelf_map: str | None = Form(None),
    source: str | None = Form(None),
    max_seconds: int = Form(DEFAULT_RUN_SECONDS),
    file: UploadFile | None = File(None),
):
    """
    Process one video and report every frame as it is processed.

    Identical to /process in what it runs and what it writes — same pipeline,
    same store attribution, same shelf mapping, same notification sync — and it
    ends by emitting the same summary object /process returns. The difference
    is only that the client sees the run happening.

    Responds with a Server-Sent Event stream:

      start    source geometry and the frame budget
      stage    a pipeline stage entering "running" / "complete" / "failed"
      frame    an annotated frame plus that frame's live counters
      finish   the completed run summary
      failed   the run could not be completed, with the reason

    Validation happens before the stream opens, so a bad store id or an
    unsupported file still comes back as a normal HTTP error.
    """

    resolved_source, source_label, uploaded_path, mapping = prepare_run(
        db,
        store_id=store_id,
        shelf_map=shelf_map,
        source=source,
        max_seconds=max_seconds,
        file=file,
    )

    # The pipeline is blocking OpenCV work, so it runs on its own thread and
    # posts events into this queue; the response body drains the queue.
    events = queue.Queue(maxsize=FRAME_BUFFER + 16)

    # Sentinel telling the reader the producer is finished.
    done = object()

    state = {"last_frame_at": 0.0, "dropped": 0}

    def observe(kind, payload):
        if kind == "frame":
            now = time.time()

            # Rate limit and back-pressure, applied to the preview only. Both
            # simply skip sending a frame; neither can stall the pipeline.
            if now - state["last_frame_at"] < 1.0 / PREVIEW_MAX_FPS:
                return

            if events.qsize() >= FRAME_BUFFER:
                state["dropped"] += 1
                return

            image = encode_preview(payload.pop("frame"))

            if image is None:
                state["dropped"] += 1
                return

            state["last_frame_at"] = now

            payload["image"] = image
            payload["dropped_frames"] = state["dropped"]

        events.put((kind, payload))

    def run():
        try:
            start_video_stream(
                resolved_source,
                display=False,
                max_seconds=max_seconds,
                store_id=store_id,
                shelf_map=mapping,
                on_event=observe,
            )

        except VideoStreamError as error:
            # The source could not be opened, so nothing ran and nothing was
            # written. Existing analytics are untouched.
            _discard(uploaded_path)
            events.put(("failed", {"detail": str(error)}))

        except Exception as error:
            # An unexpected mid-run failure. Sessions committed before the
            # failure remain valid; the client is told the run did not finish.
            _discard(uploaded_path)
            events.put(("failed", {"detail": f"Processing failed: {error}"}))

        finally:
            events.put((done, None))

    worker = threading.Thread(target=run, name="camera-process-stream")
    worker.daemon = True
    worker.start()

    def body():
        summary = None

        while True:
            try:
                kind, payload = events.get(timeout=HEARTBEAT_SECONDS)
            except queue.Empty:
                # A comment line: keeps the connection warm without the client
                # seeing an event.
                yield ": keep-alive\n\n"
                continue

            if kind is done:
                break

            if kind == "finish":
                # Held back until the notification sync below has run, so the
                # client only sees "finished" once the run is fully settled.
                summary = payload
                continue

            yield sse(kind, payload)

        worker.join(timeout=5)

        if summary is None:
            # Either the run failed — the reason was already streamed — or the
            # thread died without reporting. Either way there is no summary to
            # send and no analytics to settle.
            return

        # Same post-run bookkeeping /process does. A fresh session is opened
        # rather than reusing the request session: this runs while the response
        # body is being produced, after the handler itself has returned.
        notifications_db = SessionLocal()

        try:
            notifications_created = record_notifications(
                notifications_db, store_id
            )
            last_processed = get_last_processed(
                notifications_db, store_id=store_id
            )
        finally:
            notifications_db.close()

        yield sse(
            "finish",
            {
                "status": "completed",
                "source": source_label,
                "store_id": store_id,
                "notifications_created": notifications_created,
                "uploaded": uploaded_path is not None,
                "last_processed": (
                    last_processed.isoformat()
                    if hasattr(last_processed, "isoformat")
                    else last_processed
                ),
                **summary,
            },
        )

    return StreamingResponse(
        body(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            # Tells nginx and friends not to buffer the stream into chunks.
            "X-Accel-Buffering": "no",
        },
    )
