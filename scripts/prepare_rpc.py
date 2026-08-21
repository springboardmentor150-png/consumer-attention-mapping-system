#!/usr/bin/env python3
"""
Prepare RPC (Retail Product Checkout) Dataset for Product Classification (YOLOv11)

Converts RPC annotations to YOLO format for product recognition/classification.
Dataset source: https://www.kaggle.com/datasets/diyer22/retail-product-checkout-dataset

Usage:
    python scripts/prepare_rpc.py --input datasets/rpc --output datasets/rpc_yolo
"""

import os
import sys
import json
import glob
import shutil
import argparse
import logging
from pathlib import Path
from collections import defaultdict

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def parse_args():
    parser = argparse.ArgumentParser(description="Convert RPC to YOLO format")
    parser.add_argument("--input", type=str, default=os.getenv("RPC_DATASET_PATH", "datasets/rpc"),
                        help="Path to RPC dataset root")
    parser.add_argument("--output", type=str, default="datasets/rpc_yolo",
                        help="Output directory")
    return parser.parse_args()


def find_annotations(rpc_dir: str) -> list:
    """Find RPC annotation files (JSON/XML)."""
    found = []
    for pattern in ["*.json", "instances_*.json", "annotations.json"]:
        found.extend(glob.glob(os.path.join(rpc_dir, "**", pattern), recursive=True))
    return sorted(set(found))


def parse_rpc_json(json_path: str) -> tuple:
    """Parse RPC COCO-format annotation file. Returns (annotations_dict, category_names)."""
    with open(json_path, "r") as f:
        data = json.load(f)

    # Build category mapping
    categories = {}
    category_names = []
    if "categories" in data:
        for cat in sorted(data["categories"], key=lambda c: c["id"]):
            categories[cat["id"]] = len(category_names)
            category_names.append(cat["name"])

    # Build image info
    images = {}
    if "images" in data:
        for img in data["images"]:
            images[img["id"]] = img

    # Group annotations by image
    annotations = defaultdict(list)
    if "annotations" in data:
        for ann in data["annotations"]:
            img_id = ann["image_id"]
            cat_id = ann["category_id"]
            bbox = ann["bbox"]  # COCO format: [x, y, w, h]
            yolo_class = categories.get(cat_id, 0)
            img_info = images.get(img_id, {})

            annotations[img_id].append({
                "class_id": yolo_class,
                "bbox": bbox,
                "img_w": img_info.get("width"),
                "img_h": img_info.get("height"),
                "filename": img_info.get("file_name", ""),
            })

    logger.info(f"Parsed {len(categories)} categories, {sum(len(v) for v in annotations.values())} annotations")
    return dict(annotations), category_names, images


def convert_to_yolo(annotations: dict, images: dict, rpc_dir: str, output_dir: str) -> dict:
    """Convert RPC to YOLO format."""
    # Determine splits from directory structure or annotations
    splits_data = {"train": [], "val": [], "test": []}

    for img_id, anns in annotations.items():
        if not anns:
            continue
        filename = anns[0].get("filename", "")
        # Try to determine split from filename or path
        if "train" in filename.lower():
            splits_data["train"].append((img_id, anns))
        elif "val" in filename.lower():
            splits_data["val"].append((img_id, anns))
        elif "test" in filename.lower():
            splits_data["test"].append((img_id, anns))
        else:
            splits_data["train"].append((img_id, anns))

    # If no split detected, split manually
    if not splits_data["val"]:
        all_items = splits_data["train"]
        n_val = int(len(all_items) * 0.15)
        splits_data["val"] = all_items[-n_val:]
        splits_data["train"] = all_items[:-n_val]

    stats = {}
    for split_name, items in splits_data.items():
        if not items:
            continue

        img_out = os.path.join(output_dir, "images", split_name)
        lbl_out = os.path.join(output_dir, "labels", split_name)
        os.makedirs(img_out, exist_ok=True)
        os.makedirs(lbl_out, exist_ok=True)

        total_bboxes = 0
        processed = 0

        for img_id, anns in items:
            filename = anns[0].get("filename", f"{img_id}.jpg")
            img_w = anns[0].get("img_w")
            img_h = anns[0].get("img_h")

            if not img_w or not img_h:
                continue

            # Find source image
            src_path = None
            for search_dir in [rpc_dir, os.path.join(rpc_dir, "images")]:
                candidate = os.path.join(search_dir, filename)
                if os.path.exists(candidate):
                    src_path = candidate
                    break
                # Search recursively
                found = glob.glob(os.path.join(search_dir, "**", os.path.basename(filename)), recursive=True)
                if found:
                    src_path = found[0]
                    break

            if not src_path:
                continue

            yolo_lines = []
            for ann in anns:
                x, y, w, h = ann["bbox"]
                cx = (x + w / 2) / img_w
                cy = (y + h / 2) / img_h
                nw = w / img_w
                nh = h / img_h
                cx = max(0, min(1, cx))
                cy = max(0, min(1, cy))
                nw = max(0.001, min(1, nw))
                nh = max(0.001, min(1, nh))
                yolo_lines.append(f"{ann['class_id']} {cx:.6f} {cy:.6f} {nw:.6f} {nh:.6f}")
                total_bboxes += 1

            basename = os.path.basename(filename)
            dst_img = os.path.join(img_out, basename)
            if not os.path.exists(dst_img):
                shutil.copy2(src_path, dst_img)

            label_name = os.path.splitext(basename)[0] + ".txt"
            with open(os.path.join(lbl_out, label_name), "w") as f:
                f.write("\n".join(yolo_lines) + "\n")

            processed += 1

        stats[split_name] = {"images": processed, "bboxes": total_bboxes}
        logger.info(f"  {split_name}: {processed} images, {total_bboxes} bboxes")

    return stats


def generate_yaml(output_dir: str, category_names: list):
    """Generate YOLO dataset YAML with full category list."""
    names_yaml = "\n".join(f"  - {name}" for name in category_names) if category_names else "  - product"
    nc = len(category_names) if category_names else 1

    yaml_content = f"""# RPC — Retail Product Checkout Detection/Classification
# Source: https://www.kaggle.com/datasets/diyer22/retail-product-checkout-dataset
# {nc} product categories
# Auto-generated by scripts/prepare_rpc.py

path: {os.path.abspath(output_dir)}
train: images/train
val: images/val
test: images/test

nc: {nc}
names:
{names_yaml}

# Training recommended:
#   yolo train model=yolo11s.pt data=rpc.yaml epochs=100 imgsz=640 batch=8
"""
    yaml_path = os.path.join(output_dir, "rpc.yaml")
    with open(yaml_path, "w") as f:
        f.write(yaml_content)
    logger.info(f"YAML config written to {yaml_path} ({nc} classes)")
    return yaml_path


def main():
    args = parse_args()
    logger.info(f"RPC input: {args.input}")

    ann_files = find_annotations(args.input)
    if not ann_files:
        logger.error(f"No annotation files found in {args.input}")
        sys.exit(1)

    logger.info(f"Found {len(ann_files)} annotation files")

    all_annotations = {}
    all_categories = []
    all_images = {}

    for ann_file in ann_files:
        try:
            anns, cats, imgs = parse_rpc_json(ann_file)
            all_annotations.update(anns)
            if len(cats) > len(all_categories):
                all_categories = cats
            all_images.update(imgs)
        except Exception as e:
            logger.warning(f"Failed to parse {ann_file}: {e}")

    if not all_annotations:
        logger.error("No annotations parsed. Check dataset structure.")
        sys.exit(1)

    stats = convert_to_yolo(all_annotations, all_images, args.input, args.output)
    yaml_path = generate_yaml(args.output, all_categories)

    logger.info("=" * 60)
    logger.info("RPC Dataset Preparation Complete")
    for split, st in stats.items():
        logger.info(f"  {split}: {st['images']} images, {st['bboxes']} bboxes")
    logger.info(f"  Categories: {len(all_categories)}")
    logger.info(f"  YAML: {yaml_path}")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
