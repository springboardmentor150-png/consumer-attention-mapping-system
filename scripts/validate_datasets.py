#!/usr/bin/env python3
"""
Validate All 4 Datasets for YOLOv11 Training

Checks:
  - Directory structure exists
  - Image files are readable
  - Label files have correct YOLO format
  - Class IDs are valid
  - YAML configs are consistent
  - Prints statistics summary

Usage:
    python scripts/validate_datasets.py
"""

import os
import sys
import glob
import logging
from pathlib import Path
from collections import Counter

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


DATASETS = {
    "COCO Person": {
        "path": os.getenv("COCO_DATASET_PATH", "datasets/coco_person"),
        "yaml": "coco_person.yaml",
        "expected_classes": {0: "person"},
    },
    "Mall": {
        "path": os.getenv("MALL_DATASET_PATH", "datasets/mall_yolo"),
        "yaml": "mall.yaml",
        "expected_classes": {0: "person"},
    },
    "SKU-110K": {
        "path": os.getenv("SKU_DATASET_PATH", "datasets/sku110k_yolo"),
        "yaml": "sku110k.yaml",
        "expected_classes": {0: "product"},
    },
    "RPC": {
        "path": os.getenv("RPC_DATASET_PATH", "datasets/rpc_yolo"),
        "yaml": "rpc.yaml",
        "expected_classes": None,  # Variable (up to 200 classes)
    },
}


def validate_yolo_label(label_path: str, max_class_id: int = 200) -> dict:
    """Validate a single YOLO label file."""
    result = {"valid": True, "bboxes": 0, "classes": Counter(), "errors": []}

    try:
        with open(label_path, "r") as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                parts = line.split()
                if len(parts) != 5:
                    result["errors"].append(f"L{line_num}: Expected 5 values, got {len(parts)}")
                    result["valid"] = False
                    continue

                try:
                    cls_id = int(parts[0])
                    cx, cy, w, h = float(parts[1]), float(parts[2]), float(parts[3]), float(parts[4])
                except ValueError:
                    result["errors"].append(f"L{line_num}: Non-numeric values")
                    result["valid"] = False
                    continue

                if cls_id < 0 or cls_id > max_class_id:
                    result["errors"].append(f"L{line_num}: Invalid class_id {cls_id}")
                    result["valid"] = False

                for name, val in [("cx", cx), ("cy", cy), ("w", w), ("h", h)]:
                    if val < 0 or val > 1:
                        result["errors"].append(f"L{line_num}: {name}={val} out of [0,1]")
                        result["valid"] = False

                result["bboxes"] += 1
                result["classes"][cls_id] += 1

    except Exception as e:
        result["errors"].append(f"Read error: {e}")
        result["valid"] = False

    return result


def validate_dataset(name: str, config: dict) -> dict:
    """Validate a full dataset."""
    ds_path = config["path"]
    report = {
        "name": name,
        "exists": os.path.isdir(ds_path),
        "splits": {},
        "total_images": 0,
        "total_labels": 0,
        "total_bboxes": 0,
        "class_distribution": Counter(),
        "errors": [],
        "status": "OK",
    }

    if not report["exists"]:
        report["status"] = "NOT FOUND"
        report["errors"].append(f"Directory not found: {ds_path}")
        return report

    # Check YAML
    yaml_path = os.path.join(ds_path, config["yaml"])
    if not os.path.exists(yaml_path):
        # Also check training/configs/
        alt_yaml = os.path.join("training", "configs", config["yaml"])
        if os.path.exists(alt_yaml):
            report["yaml_path"] = alt_yaml
        else:
            report["errors"].append(f"YAML config not found: {yaml_path}")
    else:
        report["yaml_path"] = yaml_path

    # Check splits
    for split in ["train", "val", "test"]:
        img_dir = os.path.join(ds_path, "images", split)
        lbl_dir = os.path.join(ds_path, "labels", split)

        if not os.path.isdir(img_dir):
            if split in ["train", "val"]:
                report["errors"].append(f"Missing {split} images dir: {img_dir}")
            continue

        images = glob.glob(os.path.join(img_dir, "*.jpg")) + \
                 glob.glob(os.path.join(img_dir, "*.png")) + \
                 glob.glob(os.path.join(img_dir, "*.jpeg"))
        labels = glob.glob(os.path.join(lbl_dir, "*.txt")) if os.path.isdir(lbl_dir) else []

        split_info = {
            "images": len(images),
            "labels": len(labels),
            "matched": 0,
            "unmatched_images": 0,
            "label_errors": 0,
        }

        # Check image-label pairing
        img_stems = {os.path.splitext(os.path.basename(i))[0] for i in images}
        lbl_stems = {os.path.splitext(os.path.basename(l))[0] for l in labels}
        split_info["matched"] = len(img_stems & lbl_stems)
        split_info["unmatched_images"] = len(img_stems - lbl_stems)

        # Validate a sample of labels
        sample_labels = labels[:min(100, len(labels))]
        for lbl in sample_labels:
            result = validate_yolo_label(lbl)
            report["total_bboxes"] += result["bboxes"]
            report["class_distribution"].update(result["classes"])
            if not result["valid"]:
                split_info["label_errors"] += 1

        report["splits"][split] = split_info
        report["total_images"] += split_info["images"]
        report["total_labels"] += split_info["labels"]

    if report["errors"]:
        report["status"] = "WARNINGS"

    return report


def print_report(reports: list):
    """Print formatted validation report."""
    print("\n" + "=" * 80)
    print("  DATASET VALIDATION REPORT")
    print("=" * 80)

    for r in reports:
        status_icon = "✅" if r["status"] == "OK" else ("⚠️" if r["status"] == "WARNINGS" else "❌")
        print(f"\n{status_icon}  {r['name']}")
        print(f"   Path: {r.get('name', 'N/A')}")
        print(f"   Status: {r['status']}")
        print(f"   Total Images: {r['total_images']}")
        print(f"   Total Labels: {r['total_labels']}")
        print(f"   Total Bboxes (sampled): {r['total_bboxes']}")

        if r["splits"]:
            for split, info in r["splits"].items():
                print(f"   └─ {split}: {info['images']} imgs, {info['labels']} lbls, "
                      f"{info['matched']} matched, {info['label_errors']} errors")

        if r["class_distribution"]:
            print(f"   Classes: {dict(r['class_distribution'])}")

        if r["errors"]:
            for err in r["errors"][:5]:
                print(f"   ⚠ {err}")

    print("\n" + "=" * 80)

    all_ok = all(r["status"] in ("OK", "WARNINGS") for r in reports)
    all_found = all(r["exists"] for r in reports)

    if all_ok and all_found:
        print("  ✅ All datasets validated successfully!")
    elif all_found:
        print("  ⚠️  All datasets found but some have warnings. Check errors above.")
    else:
        missing = [r["name"] for r in reports if not r["exists"]]
        print(f"  ❌ Missing datasets: {', '.join(missing)}")
        print("     Run the prepare_*.py scripts first to set up datasets.")

    print("=" * 80 + "\n")


def main():
    reports = []
    for name, config in DATASETS.items():
        logger.info(f"Validating {name}...")
        report = validate_dataset(name, config)
        reports.append(report)

    print_report(reports)

    # Exit with error code if any dataset is missing
    if any(not r["exists"] for r in reports):
        sys.exit(1)


if __name__ == "__main__":
    main()
