#!/usr/bin/env python3
"""
Prepare SKU-110K Dataset for Product Detection (YOLOv11)

Converts SKU-110K CSV annotations to YOLO format.
Single class: 'product' (dense retail shelf detection).

Dataset source: https://www.kaggle.com/datasets/ranabanerjee/sku110k-annotations

Usage:
    python scripts/prepare_sku110k.py --input datasets/sku110k --output datasets/sku110k_yolo
"""

import os
import csv
import glob
import shutil
import argparse
import logging
from pathlib import Path
from collections import defaultdict

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

YOLO_PRODUCT_CLASS_ID = 0


def parse_args():
    parser = argparse.ArgumentParser(description="Convert SKU-110K to YOLO format")
    parser.add_argument("--input", type=str, default=os.getenv("SKU_DATASET_PATH", "datasets/sku110k"),
                        help="Path to SKU-110K dataset root")
    parser.add_argument("--output", type=str, default="datasets/sku110k_yolo",
                        help="Output directory")
    parser.add_argument("--val-split", type=float, default=0.15,
                        help="Fraction for validation")
    parser.add_argument("--test-split", type=float, default=0.05,
                        help="Fraction for test")
    return parser.parse_args()


def find_annotation_files(sku_dir: str) -> list:
    """Find SKU-110K annotation CSV files."""
    candidates = []
    for pattern in ["*.csv", "annotations_*.csv", "SKU110K_*.csv"]:
        candidates.extend(glob.glob(os.path.join(sku_dir, "**", pattern), recursive=True))
    if not candidates:
        raise FileNotFoundError(
            f"No annotation CSV files found in {sku_dir}. "
            f"Download from: https://www.kaggle.com/datasets/ranabanerjee/sku110k-annotations"
        )
    return sorted(set(candidates))


def find_images(sku_dir: str) -> dict:
    """Find all images and return filename -> path mapping."""
    image_map = {}
    for ext in ["*.jpg", "*.jpeg", "*.png", "*.JPG"]:
        for img_path in glob.glob(os.path.join(sku_dir, "**", ext), recursive=True):
            image_map[os.path.basename(img_path)] = img_path
    return image_map


def parse_sku110k_csv(csv_path: str) -> dict:
    """
    Parse SKU-110K annotation CSV.
    Expected format: image_name, x1, y1, x2, y2, class, image_width, image_height
    """
    annotations = defaultdict(list)

    with open(csv_path, "r") as f:
        reader = csv.reader(f)
        header = next(reader, None)  # Skip header if present

        for row in reader:
            try:
                if len(row) >= 6:
                    img_name = row[0].strip()
                    x1 = float(row[1])
                    y1 = float(row[2])
                    x2 = float(row[3])
                    y2 = float(row[4])

                    # Image dimensions (if provided)
                    img_w = float(row[6]) if len(row) > 6 else None
                    img_h = float(row[7]) if len(row) > 7 else None

                    annotations[img_name].append({
                        "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                        "img_w": img_w, "img_h": img_h
                    })
            except (ValueError, IndexError) as e:
                continue

    logger.info(f"Parsed {sum(len(v) for v in annotations.values())} annotations "
                f"for {len(annotations)} images from {csv_path}")
    return dict(annotations)


def get_image_dim(image_path: str) -> tuple:
    """Get image width and height."""
    try:
        from PIL import Image
        with Image.open(image_path) as img:
            return img.size
    except Exception:
        pass
    try:
        import cv2
        img = cv2.imread(image_path)
        if img is not None:
            h, w = img.shape[:2]
            return (w, h)
    except Exception:
        pass
    return (None, None)


def convert_to_yolo(
    annotations: dict,
    image_map: dict,
    output_dir: str,
    val_split: float,
    test_split: float,
) -> dict:
    """Convert SKU-110K annotations to YOLO format with train/val/test split."""
    all_images = sorted(annotations.keys())
    n = len(all_images)
    n_test = int(n * test_split)
    n_val = int(n * val_split)

    splits = {
        "train": all_images[:n - n_val - n_test],
        "val": all_images[n - n_val - n_test:n - n_test],
        "test": all_images[n - n_test:] if n_test > 0 else [],
    }

    stats = {}
    for split_name, image_names in splits.items():
        if not image_names:
            continue

        img_out = os.path.join(output_dir, "images", split_name)
        lbl_out = os.path.join(output_dir, "labels", split_name)
        os.makedirs(img_out, exist_ok=True)
        os.makedirs(lbl_out, exist_ok=True)

        total_bboxes = 0
        processed = 0

        for img_name in image_names:
            src_path = image_map.get(img_name)
            if not src_path or not os.path.exists(src_path):
                continue

            bboxes = annotations[img_name]
            if not bboxes:
                continue

            # Get image dimensions
            img_w = bboxes[0].get("img_w")
            img_h = bboxes[0].get("img_h")
            if not img_w or not img_h:
                img_w, img_h = get_image_dim(src_path)
            if not img_w or not img_h:
                continue

            # Convert to YOLO format
            yolo_lines = []
            for bbox in bboxes:
                x1, y1, x2, y2 = bbox["x1"], bbox["y1"], bbox["x2"], bbox["y2"]
                cx = (x1 + x2) / 2 / img_w
                cy = (y1 + y2) / 2 / img_h
                nw = (x2 - x1) / img_w
                nh = (y2 - y1) / img_h
                cx = max(0, min(1, cx))
                cy = max(0, min(1, cy))
                nw = max(0.001, min(1, nw))
                nh = max(0.001, min(1, nh))
                yolo_lines.append(f"{YOLO_PRODUCT_CLASS_ID} {cx:.6f} {cy:.6f} {nw:.6f} {nh:.6f}")
                total_bboxes += 1

            # Copy image
            dst_img = os.path.join(img_out, img_name)
            if not os.path.exists(dst_img):
                shutil.copy2(src_path, dst_img)

            # Write label
            label_name = os.path.splitext(img_name)[0] + ".txt"
            with open(os.path.join(lbl_out, label_name), "w") as f:
                f.write("\n".join(yolo_lines) + "\n")

            processed += 1
            if processed % 500 == 0:
                logger.info(f"  [{split_name}] {processed} images processed...")

        stats[split_name] = {"images": processed, "bboxes": total_bboxes}
        logger.info(f"  {split_name}: {processed} images, {total_bboxes} product bboxes")

    return stats


def generate_yaml(output_dir: str):
    """Generate YOLO dataset YAML."""
    yaml_content = f"""# SKU-110K — Dense Retail Product Detection
# Source: https://www.kaggle.com/datasets/ranabanerjee/sku110k-annotations
# Single class: product (dense shelf detection)
# Auto-generated by scripts/prepare_sku110k.py

path: {os.path.abspath(output_dir)}
train: images/train
val: images/val
test: images/test

nc: 1
names:
  - product

# Training recommended:
#   yolo train model=yolo11n.pt data=sku110k.yaml epochs=80 imgsz=640 batch=8
#   NMS iou_threshold: 0.5 (products are densely packed)
"""
    yaml_path = os.path.join(output_dir, "sku110k.yaml")
    with open(yaml_path, "w") as f:
        f.write(yaml_content)
    logger.info(f"YAML config written to {yaml_path}")
    return yaml_path


def main():
    args = parse_args()
    logger.info(f"SKU-110K input: {args.input}")
    logger.info(f"Output: {args.output}")

    # Find annotation files
    csv_files = find_annotation_files(args.input)
    logger.info(f"Found {len(csv_files)} annotation files")

    # Parse all annotations
    all_annotations = {}
    for csv_file in csv_files:
        anns = parse_sku110k_csv(csv_file)
        all_annotations.update(anns)

    if not all_annotations:
        logger.error("No annotations parsed. Check dataset structure.")
        sys.exit(1)

    # Find images
    image_map = find_images(args.input)
    logger.info(f"Found {len(image_map)} images")

    # Convert
    stats = convert_to_yolo(all_annotations, image_map, args.output, args.val_split, args.test_split)
    yaml_path = generate_yaml(args.output)

    logger.info("=" * 60)
    logger.info("SKU-110K Dataset Preparation Complete")
    for split, st in stats.items():
        logger.info(f"  {split}: {st['images']} images, {st['bboxes']} bboxes")
    logger.info(f"  YAML: {yaml_path}")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
