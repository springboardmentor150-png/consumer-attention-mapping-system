import argparse
import cv2
import json
import os
import time
import psutil

from app.services.vision.tracker import PersonTracker
from app.services.vision.dwell import DwellTimeTracker
from app.services.vision.shelf_mapper import ShelfMapper, zone_label
from app.services.vision.gaze import GazeEstimator
from app.services.vision.attention import AttentionEngine
from datetime import datetime
from app.core.database import SessionLocal
from app.models.store import Store
from app.crud.analytics import create_session
from app.services.heatmap import generate_heatmap
from app.services.behavior.segmentation import run_segmentation


class VideoStreamError(RuntimeError):
    """Raised when a run cannot start or cannot be completed."""


def start_video_stream(
    source,
    store_id,
    display=True,
    max_seconds=None,
    shelf_map=None,
    on_event=None,
):
    """
    Process a video source end to end.

    display=True keeps the interactive OpenCV preview window used when this
    module is run from a terminal. The API passes display=False so the same
    pipeline runs headlessly on a server with no X display attached.

    Detection, tracking, gaze and dwell logic below are unchanged — only how
    the run is invoked, how database writes are guarded, and what the function
    reports back.

    max_seconds bounds the run. A file ends by itself at EOF, but a camera
    never does, and the interactive 'q' key is unavailable when display=False —
    without a bound a headless camera run would loop forever and never return.

    store_id is mandatory. It records which store the footage belongs to, and
    every session written carries it. It used to default to None, which meant
    a caller that simply forgot it wrote rows no per-store view could ever
    show — silently, because nothing failed. Requiring it makes an
    unattributable run impossible from any call site rather than merely
    discouraged.

    shelf_map optionally maps a frame region value ("Left Display" /
    "Right Display") to a Shelf id, for callers that know which shelf record
    each region corresponds to — the pipeline never guesses that itself.

    on_event is an optional observer, called as on_event(kind, payload) while
    the run proceeds. It is a reporting hook only: nothing below reads its
    return value and nothing branches on whether it was supplied, so detection,
    tracking, gaze, dwell, heatmap and segmentation behave identically with or
    without it. It exists so a caller can show the run as it happens instead of
    waiting for the summary at the end.

    Kinds emitted:
      "start"  - source geometry and the frame budget, once, before the loop
      "stage"  - a pipeline stage changing state ("running" / "complete")
      "frame"  - the fully annotated frame plus that frame's live counters
      "finish" - the same summary this function returns

    A failing observer is swallowed: a broken preview must never take down a
    run that is writing real analytics.

    Returns a summary dict; raises VideoStreamError if the source cannot be
    opened or if store_id is missing.
    """

    def emit(kind, payload):
        """Report progress to the observer, if there is one."""

        if on_event is None:
            return

        try:
            on_event(kind, payload)
        except Exception as error:
            print(f"Progress observer failed on {kind}: {error}")

    # Guards against an explicit None slipping through where the parameter is
    # required but the value came from somewhere optional.
    if store_id is None:
        raise VideoStreamError(
            "store_id is required: refusing to write analytics that no store "
            "could ever be attributed to."
        )

    cap = cv2.VideoCapture(source)

    tracker = PersonTracker()
    dwell_tracker = DwellTimeTracker()
    gaze_estimator = GazeEstimator()
    attention_engine = AttentionEngine()
    shelf_mapper = None
    heatmap_points = []
    base_frame = None

    if not cap.isOpened():
        cap.release()
        raise VideoStreamError(f"Could not open source: {source}")

    frame_count = 0
    stopped_early = False
    sessions_written = 0
    write_failures = 0
    start_time = time.time()
    prev_frame_time = start_time

    # Print terminal logs only once every second
    last_log_time = start_time

    print("\nStreaming started...")

    if display:
        print("Press 'q' to quit.\n")

    # Read once so an observer can show a real progress bar rather than an
    # indeterminate spinner. Both are advisory: a container can report a wrong
    # frame count and a camera reports none at all, so the loop below is still
    # bounded only by EOF and max_seconds, exactly as before.
    source_fps = cap.get(cv2.CAP_PROP_FPS) or 0.0
    source_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)

    expected_frames = source_frames if source_frames > 0 else 0

    if max_seconds is not None and source_fps > 0:
        budget = int(source_fps * max_seconds)

        expected_frames = min(expected_frames, budget) if expected_frames else budget

    emit(
        "start",
        {
            "width": int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 0),
            "height": int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0),
            "source_fps": round(source_fps, 2),
            "source_frames": source_frames,
            "expected_frames": expected_frames,
            "max_seconds": max_seconds,
            "store_id": store_id,
        },
    )

    # The three per-frame stages start together: every frame read below goes
    # through detection, tracking and pose estimation in one pass.
    for stage in ("yolo", "bytetrack", "pose"):
        emit("stage", {"stage": stage, "state": "running"})

    while True:

        success, frame = cap.read()

        if not success:
            print("\nVideo finished or stream ended.")
            break

        # A camera stream never reaches EOF and headless runs have no 'q' key,
        # so the time limit is what makes the request terminate.
        if (
            max_seconds is not None
            and (time.time() - start_time) >= max_seconds
        ):
            print(f"\nReached the {max_seconds}s limit for this run.")
            stopped_early = True
            break

        if base_frame is None:
            base_frame = frame.copy()

        if shelf_mapper is None:
            height, width = frame.shape[:2]

            shelf_mapper = ShelfMapper(
                frame_width=width,
                frame_height=height
            )

            print(f"\nFrame Resolution: {width} x {height}")

        frame_count += 1

        # --------------------------------------------------
        # Tracking
        # --------------------------------------------------

        results = tracker.track(frame)

        tracked_ids = []
        frame_regions = {}
        frame_focuses = {}
        frame_positions = {}

        for result in results:

            if result.boxes is None:
                continue

            for box in result.boxes:

                x1, y1, x2, y2 = map(int, box.xyxy[0])

                confidence = float(box.conf[0])

                if box.id is not None:
                    person_id = int(box.id[0])
                    tracked_ids.append(person_id)
                else:
                    person_id = -1

                # ----------------------------------------
                # Shelf Mapping
                # ----------------------------------------

                center_x = (x1 + x2) // 2
                bottom_y = y2

                shelf = shelf_mapper.get_shelf(center_x, bottom_y)

                # ----------------------------------------
                # Face Crop (Upper 40% of Person)
                # -------------------------------- --------

                person_crop = frame[
                    max(0, y1): max(0, y1 + int((y2 - y1) * 0.4)),
                    max(0, x1): min(frame.shape[1], x2)
                ]

                gaze = gaze_estimator.process(person_crop)

                if gaze["face_found"]:
                    attention = attention_engine.get_attention(
                        gaze["direction"]
                    )
                else:
                    attention = "Unknown"

                if person_id != -1:
                    frame_regions[person_id] = shelf

                    frame_focuses[person_id] = (
                        attention if gaze["face_found"] else None
                    )

                    frame_positions[person_id] = (
                        center_x,
                        (y1 + y2) // 2
                    )
                    
                    heatmap_points.append(
                        (center_x, bottom_y)
                    )
                # ----------------------------------------
                # Draw Face Mesh
                # ----------------------------------------

                if gaze["face_found"]:

                    gaze_estimator.draw_landmarks(
                        person_crop,
                        gaze["landmarks"]
                    )

                    gaze_estimator.draw_keypoints(
                        person_crop,
                        gaze["image_points"]
                    )

                    frame[
                        max(0, y1): max(0, y1 + int((y2 - y1) * 0.4)),
                        max(0, x1): min(frame.shape[1], x2)
                    ] = person_crop

                # ----------------------------------------
                # Label
                # ----------------------------------------
                label = f"ID {person_id}"

                # `shelf` stays the stored value; only the drawn text is
                # relabelled. A None shelf is the centre band, shown as the
                # walking aisle.
                label += f"\nRegion : {zone_label(shelf)}"

                if gaze["face_found"]:
                    label += f"\nLooking : {gaze['direction']}"
                    label += f"\nFocus : {zone_label(attention)}"

                # label += f"\nConf : {confidence:.2f}"
                                
                # ----------------------------------------
                # Draw Bounding Box
                # ----------------------------------------

                cv2.rectangle(
                    frame,
                    (x1, y1),
                    (x2, y2),
                    (0, 255, 0),
                    2,
                )

                lines = label.split("\n")

                for i, line in enumerate(lines):

                    cv2.putText(
                        frame,
                        line,
                        (x1, y1 - 10 - (20 * (len(lines) - i - 1))),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.55,
                        (0, 255, 0),
                        2,
                    )
        # --------------------------------------------------
        # Dwell Time
        # --------------------------------------------------

        completed_sessions = dwell_tracker.update(
            tracked_ids,
            regions=frame_regions,
            focuses=frame_focuses,
            positions=frame_positions,
        )

        if completed_sessions:

            # Each batch of finished sessions is written in its own session so
            # a failure mid-run rolls back only that batch. Rows already
            # committed by earlier batches stay valid and complete — there is
            # no partially-written row — and the run continues rather than
            # aborting the whole video.
            db = SessionLocal()

            print("\n" + "=" * 60)

            try:
                for session in completed_sessions:

                    print(
                        f"Shopper {session['person_id']} | "
                        f"Dwell: {session['dwell_time']}s | "
                        f"Path: {session['path_length']:.2f}px | "
                        f"Shelf Visits: {session['shelf_visits']} | "
                        f"Gaze Shifts: {session['gaze_shifts']}"
                    )

                    create_session(
                        db,
                        {
                            "shopper_id": session["person_id"],
                            "region": session["region"],
                            "focus": session["focus"],
                            "dwell_time": session["dwell_time"],
                            "path_length": session["path_length"],
                            "shelf_visits": session["shelf_visits"],
                            "gaze_shifts": session["gaze_shifts"],
                            "segment": None,
                            "store_id": store_id,
                            # Region is the frame zone the shopper was last in;
                            # it only becomes a shelf id when the caller has
                            # declared the mapping.
                            "shelf_id": (shelf_map or {}).get(
                                session["region"]
                            ),
                            "entry_time": datetime.fromtimestamp(session["entry_time"]),
                            "exit_time": datetime.fromtimestamp(session["exit_time"]),
                            "timestamp": datetime.now(),
                        },
                        commit=False,
                    )

                # One commit for the whole batch, so a failure above rolls the
                # entire batch back rather than leaving the rows before the
                # failure already committed.
                db.commit()
                sessions_written += len(completed_sessions)

            except Exception as error:
                db.rollback()
                write_failures += len(completed_sessions)
                print(f"Failed to persist shopper sessions: {error}")

            finally:
                db.close()

            print("=" * 60 + "\n")

        # --------------------------------------------------
        # Metrics
        # --------------------------------------------------

        current_time = time.time()

        elapsed = current_time - start_time

        fps = (
            1 / (current_time - prev_frame_time)
            if current_time != prev_frame_time
            else 0
        )

        prev_frame_time = current_time

        memory = (
            psutil.Process(os.getpid()).memory_info().rss
            / (1024 * 1024)
        )

        # --------------------------------------------------
        # Shelf Regions
        # --------------------------------------------------

        for shelf_name, (x1, y1, x2, y2) in shelf_mapper.get_regions().items():

            cv2.rectangle(
                frame,
                (x1, y1),
                (x2, y2),
                (255, 0, 0),
                2
            )

            cv2.putText(
                frame,
                zone_label(shelf_name),
                (x1 + 10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (255, 0, 0),
                2
            )

        # --------------------------------------------------
        # Overlay
        # --------------------------------------------------

        cv2.putText(
            frame,
            f"Frame: {frame_count}",
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 255, 0),
            2,
        )

        cv2.putText(
            frame,
            f"FPS: {fps:.2f}",
            (10, 65),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 0),
            2,
        )

        cv2.putText(
            frame,
            f"Time: {elapsed:.2f}s",
            (10, 100),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 165, 255),
            2,
        )

        # --------------------------------------------------
        # Terminal Logs (Once Per Second)
        # --------------------------------------------------

        if current_time - last_log_time >= 1:

            print(
                f"Frame={frame_count} | "
                f"FPS={fps:.2f} | "
                f"People={len(tracked_ids)} | "
                f"Memory={memory:.2f} MB"
            )

            last_log_time = current_time

        # --------------------------------------------------
        # Progress Observer
        # --------------------------------------------------
        # `frame` at this point is the finished annotated frame: bounding
        # boxes, track ids, the gaze mesh, the shelf region rectangles and the
        # frame/FPS/time overlay have all already been drawn onto it above.
        # Reporting it here means an observer sees exactly what the OpenCV
        # preview window shows, with no second rendering path to drift from it.

        emit(
            "frame",
            {
                "frame": frame,
                "frame_index": frame_count,
                "fps": round(fps, 2),
                "elapsed": round(elapsed, 2),
                "memory_mb": round(memory, 2),
                "people": len(tracked_ids),
                "track_ids": sorted(tracked_ids),
                # Stored zone values, labelled by the caller. None is the
                # centre band, i.e. the walking aisle.
                "regions": {
                    str(person): zone_label(region)
                    for person, region in frame_regions.items()
                },
                "focuses": {
                    str(person): zone_label(focus)
                    for person, focus in frame_focuses.items()
                    if focus is not None
                },
                "faces_found": sum(
                    1 for focus in frame_focuses.values() if focus is not None
                ),
                "sessions_written": sessions_written,
                "heatmap_points": len(heatmap_points),
            },
        )

        # The preview window is the only part of the loop that needs a display,
        # so it is skipped entirely when running headlessly from the API.
        if display:

            display_frame = cv2.resize(frame, (960, 540))

            cv2.imshow("Consumer Attention Mapping", display_frame)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                print("\nStopped by user.")
                break

    heatmap_generated = False
    segmentation_ran = False

    # Every frame has now been read, so the per-frame stages are done.
    for stage in ("yolo", "bytetrack", "pose"):
        emit("stage", {"stage": stage, "state": "complete"})

    if base_frame is not None and heatmap_points:

        emit("stage", {"stage": "heatmap", "state": "running"})

        try:
            generate_heatmap(
                points=heatmap_points,
                base_frame=base_frame,
                output_path="app/static/heatmaps/store_heatmap.jpg"
            )

            heatmap_generated = True

        except Exception as error:
            # A failed heatmap must not discard the analytics rows already
            # committed above, so this is reported rather than raised.
            print(f"Heatmap generation failed: {error}")

        emit(
            "stage",
            {
                "stage": "heatmap",
                "state": "complete" if heatmap_generated else "failed",
            },
        )

        print("\nRunning behavioral segmentation...")

        emit("stage", {"stage": "analytics", "state": "running"})

        db = SessionLocal()

        try:
            run_segmentation(db, store_id=store_id)
            segmentation_ran = True

        except Exception as error:
            db.rollback()
            print(f"Behavioral segmentation failed: {error}")

        finally:
            db.close()

        print("Behavioral segmentation completed.")

        emit(
            "stage",
            {
                "stage": "analytics",
                "state": "complete" if segmentation_ran else "failed",
            },
        )

    cap.release()

    if display:
        cv2.destroyAllWindows()

    print("\nResources released successfully.")
    print("Video stream closed.")

    summary = {
        "frames_processed": frame_count,
        "sessions_written": sessions_written,
        "session_write_failures": write_failures,
        "heatmap_generated": heatmap_generated,
        "segmentation_ran": segmentation_ran,
        "duration_seconds": round(time.time() - start_time, 2),
        "stopped_at_limit": stopped_early,
    }

    emit("finish", dict(summary))

    return summary




def _resolve_cli_store(store_id):
    """
    Check the store exists before any frames are read.

    Failing here costs nothing; failing after processing a whole video would
    waste the run and leave the operator guessing.
    """

    db = SessionLocal()

    try:
        store = db.query(Store).filter(Store.id == store_id).first()

        if store is None:
            known = db.query(Store).order_by(Store.id).all()

            available = (
                ", ".join(f"{s.id} ({s.name})" for s in known)
                if known
                else "none - create a store first"
            )

            raise SystemExit(
                f"\nStore not found: {store_id}"
                f"\nAvailable stores: {available}\n"
            )

        return store

    finally:
        db.close()


def _parse_cli_shelf_map(raw):
    """Read the optional --shelf-map JSON, matching the API's semantics."""

    if not raw:
        return None

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        raise SystemExit("\n--shelf-map must be valid JSON.\n")

    if not isinstance(parsed, dict):
        raise SystemExit(
            '\n--shelf-map must be an object, e.g. {"Left Display": 7}\n'
        )

    try:
        return {str(region): int(shelf) for region, shelf in parsed.items()}
    except (TypeError, ValueError):
        raise SystemExit("\n--shelf-map values must be shelf ids.\n")


def _run_from_cli(source, store_id, shelf_map=None, max_seconds=None):
    """Keep the terminal workflow usable, errors included."""

    try:
        summary = start_video_stream(
            source,
            store_id=store_id,
            display=True,
            max_seconds=max_seconds,
            shelf_map=shelf_map,
        )
        print(f"\nRun summary: {summary}")

    except VideoStreamError as error:
        print(f"\n{error}")


def _cli():
    parser = argparse.ArgumentParser(
        prog="python -m app.services.video_stream",
        description=(
            "Process a video and write shopper analytics for one store. "
            "Runs to the end of the clip; this is not a live stream."
        ),
    )

    parser.add_argument(
        "source",
        help="Video file path, a camera index such as 0, or an RTSP URL.",
    )

    parser.add_argument(
        "--store-id",
        type=int,
        required=True,
        help=(
            "Store the footage belongs to. Required - without it the "
            "analytics would be unattributable and invisible to every "
            "per-store view."
        ),
    )

    parser.add_argument(
        "--shelf-map",
        default=None,
        help=(
            'Optional JSON mapping frame regions to shelf ids, e.g. '
            '{"Left Display": 7, "Right Display": 8}'
        ),
    )

    parser.add_argument(
        "--max-seconds",
        type=int,
        default=None,
        help=(
            "Stop after this many seconds. Recommended for a camera index, "
            "which otherwise runs until you press q."
        ),
    )

    args = parser.parse_args()

    store = _resolve_cli_store(args.store_id)
    shelf_map = _parse_cli_shelf_map(args.shelf_map)

    source = int(args.source) if args.source.isdigit() else args.source

    if isinstance(source, str) and not source.lower().startswith("rtsp://"):
        if not os.path.exists(source):
            raise SystemExit(f"\nFile not found: {source}\n")

    print("\n========= Consumer Attention Mapping =========")
    print(f"Store  : {store.id} ({store.name})")
    print(f"Source : {args.source}")
    print(f"Shelves: {shelf_map if shelf_map else 'not mapped'}")

    _run_from_cli(
        source,
        store_id=store.id,
        shelf_map=shelf_map,
        max_seconds=args.max_seconds,
    )


if __name__ == "__main__":
    _cli()
