#!/usr/bin/env python3
"""
Prepare COCO 2017 Dataset for Person Detection (YOLOv11)

Downloads person-class annotations from COCO 2017 and converts to YOLO format.
Only extracts 'person' class (class_id=0 in COCO).

Dataset source: https://www.kaggle.com/datasets/awsaf49/coco-2017-dataset

Usage:
    python scripts/prepare_coco.py --input datasets/coco --output datasets/coco_person
"""

import os
import sys
import json
import shutil
import argparse
import logging
from pathlib import Path
from typing import Dict, List, Set

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

COCO_PERSON_CLASS_ID = 1  # COCO uses 1 for person
YOLO_PERSON_CLASS_ID = 0  # YOLO uses 0


def parse_args():
    parser = argparse.ArgumentParser(description="Convert COCO 2017 person annotations to YOLO format")
    parser.add_argument("--input", type=str, default=os.getenv("COCO_DATASET_PATH", "datasets/coco"),
                        help="Path to extracted COCO 2017 dataset")
    parser.add_argument("--output", type=str, default="datasets/coco_person",
                        help="Output directory for YOLO-formatted dataset")
    parser.add_argument("--max-images", type=int, default=None,
                        help="Max images to process (None = all)")
    parser.add_argument("--min-bbox-area", type=float, default=100.0,
                        help="Minimum bounding box area in pixels to include")
    return parser.parse_args()


def find_annotation_file(coco_dir: str, split: str) -> str:
    """Find COCO annotation JSON file for a split."""
    candidates = [
        os.path.join(coco_dir, "annotations", f"instances_{split}2017.json"),
        os.path.join(coco_dir, f"annotations/instances_{split}2017.json"),
        os.path.join(coco_dir, "coco2017", "annotations", f"instances_{split}2017.json"),
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    raise FileNotFoundError(
        f"COCO annotation file not found for split '{split}'. "
        f"Searched: {candidates}\n"
        f"Please download from: https://www.kaggle.com/datasets/awsaf49/coco-2017-dataset"
    )


def find_images_dir(coco_dir: str, split: str) -> str:
    """Find COCO images directory for a split."""
    candidates = [
        os.path.join(coco_dir, f"{split}2017"),
        os.path.join(coco_dir, "images", f"{split}2017"),
        os.path.join(coco_dir, "coco2017", f"{split}2017"),
    ]
    for c in candidates:
        if os.path.isdir(c):
            return c
    raise FileNotFoundError(
        f"COCO images directory not found for split '{split}'. Searched: {candidates}"
    )


def convert_coco_to_yolo(
    annotation_path: str,
    images_dir: str,
    output_dir: str,
    split: str,
    max_images: int = None,
    min_bbox_area: float = 100.0,
) -> dict:
    """Convert COCO person annotations to YOLO format."""
    logger.info(f"Loading annotations from {annotation_path}...")
    with open(annotation_path, "r") as f:
        coco = json.load(f)

    # Build image id -> info mapping
    images_info: Dict[int, dict] = {}
    for img in coco["images"]:
        images_info[img["id"]] = img

    # Filter person annotations
    person_annotations: Dict[int, List] = {}  # image_id -> list of bboxes
    for ann in coco["annotations"]:
        if ann["category_id"] != COCO_PERSON_CLASS_ID:
            continue
        if ann.get("iscrowd", 0):
            continue
        bbox = ann["bbox"]  # [x, y, width, height] in pixels
        area = bbox[2] * bbox[3]
        if area < min_bbox_area:
            continue
        img_id = ann["image_id"]
        if img_id not in person_annotations:
            person_annotations[img_id] = []
        person_annotations[img_id].append(bbox)

    # Create output directories
    img_out = os.path.join(output_dir, "images", split)
    lbl_out = os.path.join(output_dir, "labels", split)
    os.makedirs(img_out, exist_ok=True)
    os.makedirs(lbl_out, exist_ok=True)

    processed = 0
    total_bboxes = 0
    image_ids = list(person_annotations.keys())
    if max_images:
        image_ids = image_ids[:max_images]

    for img_id in image_ids:
        img_info = images_info.get(img_id)
        if not img_info:
            continue

        filename = img_info["file_name"]
        src_path = os.path.join(images_dir, filename)
        if not os.path.exists(src_path):
            continue

        img_w = img_info["width"]
        img_h = img_info["height"]

        # Convert bboxes to YOLO format (class cx cy w h — normalized)
        yolo_lines = []
        for bbox in person_annotations[img_id]:
            x, y, bw, bh = bbox
            cx = (x + bw / 2) / img_w
            cy = (y + bh / 2) / img_h
            nw = bw / img_w
            nh = bh / img_h
            # Clamp to [0, 1]
            cx = max(0, min(1, cx))
            cy = max(0, min(1, cy))
            nw = max(0, min(1, nw))
            nh = max(0, min(1, nh))
            yolo_lines.append(f"{YOLO_PERSON_CLASS_ID} {cx:.6f} {cy:.6f} {nw:.6f} {nh:.6f}")
            total_bboxes += 1

        # Copy image
        dst_img = os.path.join(img_out, filename)
        if not os.path.exists(dst_img):
            shutil.copy2(src_path, dst_img)

        # Write label file
        label_name = os.path.splitext(filename)[0] + ".txt"
        label_path = os.path.join(lbl_out, label_name)
        with open(label_path, "w") as f:
            f.write("\n".join(yolo_lines) + "\n")

        processed += 1
        if processed % 1000 == 0:
            logger.info(f"  Processed {processed}/{len(image_ids)} images...")

    return {"images": processed, "bboxes": total_bboxes}


def generate_yaml(output_dir: str):
    """Generate YOLO dataset YAML config."""
    yaml_content = f"""# COCO 2017 — Person Detection for Retail
# Source: https://www.kaggle.com/datasets/awsaf49/coco-2017-dataset
# Auto-generated by scripts/prepare_coco.py

path: {os.path.abspath(output_dir)}
train: images/train
val: images/val

nc: 1
names:
  - person

# Training recommended:
#   yolo train model=yolo11n.pt data=coco_person.yaml epochs=50 imgsz=640
"""
    yaml_path = os.path.join(output_dir, "coco_person.yaml")
    with open(yaml_path, "w") as f:
        f.write(yaml_content)
    logger.info(f"YAML config written to {yaml_path}")
    return yaml_path


def main():
    args = parse_args()
    coco_dir = args.input
    output_dir = args.output

    logger.info(f"COCO input directory: {coco_dir}")
    logger.info(f"Output directory: {output_dir}")

    stats = {}
    for split in ["train", "val"]:
        try:
            ann_file = find_annotation_file(coco_dir, split)
            img_dir = find_images_dir(coco_dir, split)
            logger.info(f"Processing {split} split...")
            result = convert_coco_to_yolo(
                ann_file, img_dir, output_dir, split,
                max_images=args.max_images,
                min_bbox_area=args.min_bbox_area,
            )
            stats[split] = result
            logger.info(f"  {split}: {result['images']} images, {result['bboxes']} person bboxes")
        except FileNotFoundError as e:
            logger.warning(f"Skipping {split}: {e}")

    yaml_path = generate_yaml(output_dir)

    logger.info("=" * 60)
    logger.info("COCO Person Dataset Preparation Complete")
    for split, st in stats.items():
        logger.info(f"  {split}: {st['images']} images, {st['bboxes']} bboxes")
    logger.info(f"  YAML config: {yaml_path}")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
