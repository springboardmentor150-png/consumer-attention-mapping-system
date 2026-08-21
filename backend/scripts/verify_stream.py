import argparse
import sys
import time
from pathlib import Path

# Add backend root to PYTHONPATH
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.append(str(backend_dir))

import cv2
from loguru import logger
from app.services.vision.stream_processor import StreamProcessor

def main() -> None:
    parser = argparse.ArgumentParser(description="CAMS Video Stream Verification Script")
    parser.add_argument(
        "--source",
        type=str,
        default="0",
        help="Video source index (e.g. 0), RTSP URL (e.g. rtsp://...), or mp4 file path."
    )
    args = parser.parse_args()

    processor = StreamProcessor()
    success = processor.open_stream(args.source)
    if not success:
        logger.error(f"Could not open stream for source: {args.source}")
        sys.exit(1)

    logger.info("Starting stream processing loop. Press Ctrl+C to terminate.")

    gui_enabled = True
    start_time = time.time()

    try:
        while True:
            ret, frame = processor.read_frame()
            if not ret:
                logger.info("End of stream or unable to read frame. Exiting loop.")
                break

            # Process frame
            resized_frame = processor.resize_frame(frame, 640, 480)
            metadata = processor.get_frame_metadata()

            logger.info(
                f"Frame: {metadata['frame_count']} | "
                f"Timestamp: {metadata['timestamp']:.3f} | "
                f"Resolution: {metadata['resolution']} | "
                f"Est. FPS: {metadata['fps']:.2f}"
            )

            # Display GUI window if supported by OpenCV build
            if gui_enabled:
                try:
                    cv2.imshow("CAMS Stream Verification", resized_frame)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        logger.info("Quit key 'q' pressed. Terminating.")
                        break
                except cv2.error:
                    gui_enabled = False
                    logger.warning(
                        "GUI window display is not supported (running in a headless environment). "
                        "Continuing stream verification in headless mode."
                    )

            # Throttle slightly to simulate real frame-rate if reading files
            time.sleep(0.01)

    except KeyboardInterrupt:
        logger.info("Stream verification interrupted by keyboard.")
    finally:
        duration = time.time() - start_time
        total_frames = processor.frame_count
        avg_fps = total_frames / duration if duration > 0 else 0.0

        logger.info("=== Stream Verification Results ===")
        logger.info(f"Total frames processed: {total_frames}")
        logger.info(f"Total runtime: {duration:.2f}s")
        logger.info(f"Average FPS achieved: {avg_fps:.2f}")
        logger.info("===================================")

        processor.release()
        if gui_enabled:
            try:
                cv2.destroyAllWindows()
            except Exception:
                pass

if __name__ == "__main__":
    main()
