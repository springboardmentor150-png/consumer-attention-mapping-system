#!/usr/bin/env python3
"""
Prepare Mall Dataset for Shopper/Person Detection (YOLOv11)

Converts Mall Dataset ground truth to YOLO annotation format.
Dataset source: https://www.kaggle.com/datasets/chaozhuang/mall-dataset

The Mall Dataset contains:
  - Video frames from a shopping mall surveillance camera
  - Ground truth head/person annotations (x, y positions)

Usage:
    python scripts/prepare_mall.py --input datasets/mall --output datasets/mall_yolo
"""

import os
import sys
import csv
import glob
import shutil
import argparse
import logging
from pathlib import Path
from typing import List, Tuple

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Default bounding box size for head annotations (pixels)
DEFAULT_BBOX_WIDTH = 30
DEFAULT_BBOX_HEIGHT = 40
YOLO_PERSON_CLASS_ID = 0


def parse_args():
    parser = argparse.ArgumentParser(description="Convert Mall Dataset to YOLO format")
    parser.add_argument("--input", type=str, default=os.getenv("MALL_DATASET_PATH", "datasets/mall"),
                        help="Path to Mall Dataset root")
    parser.add_argument("--output", type=str, default="datasets/mall_yolo",
                        help="Output directory for YOLO-formatted dataset")
    parser.add_argument("--bbox-width", type=int, default=DEFAULT_BBOX_WIDTH,
                        help="Width of person bounding box around head point")
    parser.add_argument("--bbox-height", type=int, default=DEFAULT_BBOX_HEIGHT,
                        help="Height of person bounding box around head point")
    parser.add_argument("--val-split", type=float, default=0.2,
                        help="Fraction of data for validation")
    return parser.parse_args()


def find_ground_truth(mall_dir: str) -> str:
    """Find the ground truth file in Mall Dataset."""
    candidates = [
        os.path.join(mall_dir, "mall_gt.mat"),
        os.path.join(mall_dir, "mall_count.csv"),
        os.path.join(mall_dir, "labels.csv"),
        os.path.join(mall_dir, "ground_truth.csv"),
    ]
    # Also search for any .mat or .csv file
    for pattern in ["*.mat", "*.csv", "*.txt"]:
        found = glob.glob(os.path.join(mall_dir, "**", pattern), recursive=True)
        candidates.extend(found)

    for c in set(candidates):
        if os.path.exists(c):
            return c
    raise FileNotFoundError(
        f"Mall Dataset ground truth not found in {mall_dir}. "
        f"Download from: https://www.kaggle.com/datasets/chaozhuang/mall-dataset"
    )


def find_frames_dir(mall_dir: str) -> str:
    """Find the frames directory."""
    candidates = [
        os.path.join(mall_dir, "frames"),
        os.path.join(mall_dir, "images"),
        os.path.join(mall_dir, "mall_dataset", "frames"),
        mall_dir,  # frames might be directly in the root
    ]
    for c in candidates:
        if os.path.isdir(c):
            imgs = glob.glob(os.path.join(c, "*.jpg")) + glob.glob(os.path.join(c, "*.png"))
            if imgs:
                return c
    raise FileNotFoundError(f"Mall Dataset frames not found in {mall_dir}")


def parse_mat_annotations(mat_path: str) -> dict:
    """Parse Mall Dataset .mat ground truth file."""
    try:
        import scipy.io as sio
        data = sio.loadmat(mat_path)

        # Mall dataset .mat typically has 'frame' and 'count' fields
        # or 'gt' containing per-frame annotations
        annotations = {}

        if "frame" in data:
            frames = data["frame"]
            for i, frame_data in enumerate(frames.flat):
                frame_id = i + 1
                if hasattr(frame_data, "loc") and frame_data.loc.size > 0:
                    points = frame_data.loc[0, 0]
                    annotations[frame_id] = [(int(p[0]), int(p[1])) for p in points]
                elif hasattr(frame_data, "__len__") and len(frame_data) > 0:
                    try:
                        # Alternative format
                        locs = frame_data[0][0][0]
                        annotations[frame_id] = [(int(p[0]), int(p[1])) for p in locs]
                    except (IndexError, TypeError):
                        pass

        elif "gt" in data:
            gt = data["gt"]
            for i in range(gt.shape[1]):
                frame_id = i + 1
                frame_gt = gt[0, i]
                if frame_gt.size > 0:
                    points = frame_gt.reshape(-1, 2)
                    annotations[frame_id] = [(int(p[0]), int(p[1])) for p in points]

        logger.info(f"Parsed {len(annotations)} frames from .mat file")
        return annotations

    except ImportError:
        logger.warning("scipy not available for .mat parsing, trying CSV fallback")
        return {}


def parse_csv_annotations(csv_path: str) -> dict:
    """Parse CSV-format annotations."""
    annotations = {}
    with open(csv_path, "r") as f:
        reader = csv.reader(f)
        header = next(reader, None)
        for row in reader:
            try:
                if len(row) >= 3:
                    frame_id = int(row[0])
                    x, y = int(float(row[1])), int(float(row[2]))
                    if frame_id not in annotations:
                        annotations[frame_id] = []
                    annotations[frame_id].append((x, y))
            except (ValueError, IndexError):
                continue
    logger.info(f"Parsed {len(annotations)} frames from CSV file")
    return annotations


def get_image_dimensions(image_path: str) -> Tuple[int, int]:
    """Get image width and height."""
    try:
        from PIL import Image
        with Image.open(image_path) as img:
            return img.size  # (width, height)
    except ImportError:
        import cv2
        img = cv2.imread(image_path)
        if img is not None:
            h, w = img.shape[:2]
            return (w, h)
    return (640, 480)  # fallback


def convert_to_yolo(
    annotations: dict,
    frames_dir: str,
    output_dir: str,
    bbox_width: int,
    bbox_height: int,
    val_split: float,
) -> dict:
    """Convert point annotations to YOLO bounding box format."""
    frame_files = sorted(
        glob.glob(os.path.join(frames_dir, "*.jpg")) +
        glob.glob(os.path.join(frames_dir, "*.png"))
    )

    if not frame_files:
        raise FileNotFoundError(f"No image files found in {frames_dir}")

    # Get image dimensions from first frame
    img_w, img_h = get_image_dimensions(frame_files[0])
    logger.info(f"Image dimensions: {img_w}x{img_h}")

    # Split into train/val
    n_val = int(len(frame_files) * val_split)
    n_train = len(frame_files) - n_val

    splits = {"train": frame_files[:n_train], "val": frame_files[n_train:]}
    stats = {}

    for split_name, files in splits.items():
        img_out = os.path.join(output_dir, "images", split_name)
        lbl_out = os.path.join(output_dir, "labels", split_name)
        os.makedirs(img_out, exist_ok=True)
        os.makedirs(lbl_out, exist_ok=True)

        total_bboxes = 0
        processed = 0

        for frame_path in files:
            filename = os.path.basename(frame_path)
            # Try to extract frame number from filename
            name_no_ext = os.path.splitext(filename)[0]
            try:
                # Common patterns: seq_001234.jpg, frame_0001.jpg, 001.jpg
                frame_num = int("".join(filter(str.isdigit, name_no_ext))) if any(c.isdigit() for c in name_no_ext) else 0
            except ValueError:
                frame_num = 0

            # Get annotations for this frame
            points = annotations.get(frame_num, [])

            # Convert points to YOLO bounding boxes
            yolo_lines = []
            for (px, py) in points:
                # Create bbox centered on point
                x1 = max(0, px - bbox_width // 2)
                y1 = max(0, py - bbox_height // 2)
                x2 = min(img_w, px + bbox_width // 2)
                y2 = min(img_h, py + bbox_height // 2)

                cx = ((x1 + x2) / 2) / img_w
                cy = ((y1 + y2) / 2) / img_h
                nw = (x2 - x1) / img_w
                nh = (y2 - y1) / img_h

                cx = max(0, min(1, cx))
                cy = max(0, min(1, cy))
                nw = max(0, min(1, nw))
                nh = max(0, min(1, nh))

                yolo_lines.append(f"{YOLO_PERSON_CLASS_ID} {cx:.6f} {cy:.6f} {nw:.6f} {nh:.6f}")
                total_bboxes += 1

            # Copy image
            dst_img = os.path.join(img_out, filename)
            if not os.path.exists(dst_img):
                shutil.copy2(frame_path, dst_img)

            # Write label (even if empty — YOLO uses empty files for negative samples)
            label_name = os.path.splitext(filename)[0] + ".txt"
            label_path = os.path.join(lbl_out, label_name)
            with open(label_path, "w") as f:
                if yolo_lines:
                    f.write("\n".join(yolo_lines) + "\n")

            processed += 1

        stats[split_name] = {"images": processed, "bboxes": total_bboxes}
        logger.info(f"  {split_name}: {processed} images, {total_bboxes} person bboxes")

    return stats


def generate_yaml(output_dir: str):
    """Generate YOLO dataset YAML."""
    yaml_content = f"""# Mall Dataset — Person/Shopper Detection for Retail
# Source: https://www.kaggle.com/datasets/chaozhuang/mall-dataset
# NOTE: This dataset is used as the implementation dataset for shopper traffic analysis.
# Auto-generated by scripts/prepare_mall.py

path: {os.path.abspath(output_dir)}
train: images/train
val: images/val

nc: 1
names:
  - person

# Training recommended:
#   yolo train model=yolo11n.pt data=mall.yaml epochs=50 imgsz=640 batch=16
"""
    yaml_path = os.path.join(output_dir, "mall.yaml")
    with open(yaml_path, "w") as f:
        f.write(yaml_content)
    logger.info(f"YAML config written to {yaml_path}")
    return yaml_path


def main():
    args = parse_args()
    logger.info(f"Mall Dataset input: {args.input}")
    logger.info(f"Output directory: {args.output}")

    # Find ground truth
    gt_path = find_ground_truth(args.input)
    logger.info(f"Ground truth file: {gt_path}")

    # Parse annotations
    if gt_path.endswith(".mat"):
        annotations = parse_mat_annotations(gt_path)
    else:
        annotations = parse_csv_annotations(gt_path)

    if not annotations:
        logger.warning(
            "No annotations parsed. Creating label files based on frame filenames. "
            "Manual annotation review may be needed."
        )
        annotations = {}

    # Find frames
    frames_dir = find_frames_dir(args.input)
    logger.info(f"Frames directory: {frames_dir}")

    # Convert
    stats = convert_to_yolo(
        annotations, frames_dir, args.output,
        args.bbox_width, args.bbox_height, args.val_split
    )

    yaml_path = generate_yaml(args.output)

    logger.info("=" * 60)
    logger.info("Mall Dataset Preparation Complete")
    for split, st in stats.items():
        logger.info(f"  {split}: {st['images']} images, {st['bboxes']} bboxes")
    logger.info(f"  YAML config: {yaml_path}")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
