#!/usr/bin/env python3
"""
Train YOLOv11 Product Detector on SKU-110K and RPC Datasets

Two training modes:
  1. Dense product detection (SKU-110K) — single class 'product'
  2. Product classification (RPC) — multi-class product recognition

Usage:
    python scripts/train_product_detector.py --data datasets/sku110k_yolo/sku110k.yaml --name product_sku110k
    python scripts/train_product_detector.py --data datasets/rpc_yolo/rpc.yaml --name product_rpc --model yolo11s.pt
"""

import os
import argparse
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def parse_args():
    parser = argparse.ArgumentParser(description="Train YOLOv11 product detector")
    parser.add_argument("--data", type=str, required=True,
                        help="Path to dataset YAML (sku110k.yaml or rpc.yaml)")
    parser.add_argument("--model", type=str, default="yolo11n.pt",
                        help="Pretrained model weights")
    parser.add_argument("--epochs", type=int, default=int(os.getenv("TRAIN_EPOCHS", "80")),
                        help="Training epochs")
    parser.add_argument("--batch", type=int, default=int(os.getenv("TRAIN_BATCH_SIZE", "8")),
                        help="Batch size (lower for high-res images)")
    parser.add_argument("--imgsz", type=int, default=int(os.getenv("TRAIN_IMGSZ", "640")),
                        help="Input image size")
    parser.add_argument("--device", type=str, default=os.getenv("TRAIN_DEVICE", "cpu"),
                        help="Training device")
    parser.add_argument("--lr", type=float, default=float(os.getenv("TRAIN_LR", "0.001")),
                        help="Learning rate")
    parser.add_argument("--project", type=str, default="training/runs",
                        help="Output project directory")
    parser.add_argument("--name", type=str, default="product_detector",
                        help="Experiment name")
    parser.add_argument("--resume", action="store_true",
                        help="Resume from last checkpoint")
    parser.add_argument("--patience", type=int, default=25,
                        help="Early stopping patience")
    parser.add_argument("--nms-iou", type=float, default=0.5,
                        help="NMS IoU threshold (lower for dense detection)")
    return parser.parse_args()


def validate_environment():
    """Check required packages."""
    try:
        from ultralytics import YOLO
        logger.info(f"Ultralytics version: {__import__('ultralytics').__version__}")
    except ImportError:
        logger.error("ultralytics not installed. Run: pip install ultralytics>=8.3.40")
        raise SystemExit(1)


def train(args):
    """Run YOLOv11 product detection training."""
    from ultralytics import YOLO

    if not os.path.exists(args.data):
        logger.error(f"Dataset YAML not found: {args.data}")
        logger.info("Run one of these first:")
        logger.info("  python scripts/prepare_sku110k.py")
        logger.info("  python scripts/prepare_rpc.py")
        raise SystemExit(1)

    # Determine if this is dense detection (SKU-110K) or classification (RPC)
    is_dense = "sku110k" in args.data.lower()

    logger.info("=" * 60)
    logger.info(f"YOLOv11 Product Detector — {'Dense Detection' if is_dense else 'Classification'}")
    logger.info("=" * 60)
    logger.info(f"  Model:    {args.model}")
    logger.info(f"  Data:     {args.data}")
    logger.info(f"  Epochs:   {args.epochs}")
    logger.info(f"  Batch:    {args.batch}")
    logger.info(f"  Img Size: {args.imgsz}")
    logger.info(f"  Device:   {args.device}")
    logger.info(f"  LR:       {args.lr}")
    logger.info(f"  NMS IoU:  {args.nms_iou}")
    logger.info("=" * 60)

    model = YOLO(args.model)

    # SKU-110K specific augmentation
    train_kwargs = {
        "data": args.data,
        "epochs": args.epochs,
        "batch": args.batch,
        "imgsz": args.imgsz,
        "device": args.device,
        "lr0": args.lr,
        "project": args.project,
        "name": args.name,
        "patience": args.patience,
        "save": True,
        "save_period": 10,
        "plots": True,
        "resume": args.resume,
        "optimizer": "AdamW",
        "cos_lr": True,
        "augment": True,
        "iou": args.nms_iou,
    }

    if is_dense:
        # Dense detection: strong augmentation, higher NMS threshold
        train_kwargs.update({
            "mosaic": 1.0,
            "mixup": 0.15,
            "scale": 0.5,
            "translate": 0.2,
            "degrees": 10.0,
            "fliplr": 0.5,
            "flipud": 0.0,
            "hsv_h": 0.02,
            "hsv_s": 0.5,
            "hsv_v": 0.4,
        })
    else:
        # Classification: lighter augmentation, preserve product features
        train_kwargs.update({
            "mosaic": 0.5,
            "mixup": 0.05,
            "scale": 0.3,
            "translate": 0.1,
            "degrees": 5.0,
            "fliplr": 0.5,
            "hsv_h": 0.01,
            "hsv_s": 0.3,
            "hsv_v": 0.3,
        })

    results = model.train(**train_kwargs)

    # Copy best weights
    best_path = os.path.join(args.project, args.name, "weights", "best.pt")
    if os.path.exists(best_path):
        os.makedirs("models", exist_ok=True)
        dest_name = "product_sku110k_yolo11.pt" if is_dense else "product_rpc_yolo11.pt"
        dest = os.path.join("models", dest_name)
        import shutil
        shutil.copy2(best_path, dest)
        logger.info(f"Best weights copied to: {dest}")

    # Validate
    logger.info("\nRunning validation...")
    metrics = model.val(data=args.data)
    logger.info(f"  mAP50: {metrics.box.map50:.4f}")
    logger.info(f"  mAP50-95: {metrics.box.map:.4f}")

    logger.info("=" * 60)
    logger.info("Product Detector Training Complete!")
    logger.info(f"  Results: {args.project}/{args.name}")
    logger.info("=" * 60)


def main():
    args = parse_args()
    validate_environment()
    train(args)


if __name__ == "__main__":
    main()
