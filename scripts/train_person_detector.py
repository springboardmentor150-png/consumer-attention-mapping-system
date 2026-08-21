#!/usr/bin/env python3
"""
Train YOLOv11 Person Detector on COCO + Mall Datasets

Fine-tunes yolo11n.pt (pretrained on COCO) specifically for retail surveillance:
  - Top-down/overhead camera angles
  - Crowded shopper scenes
  - Partial person detection (only top half visible)

Usage:
    python scripts/train_person_detector.py --data datasets/coco_person/coco_person.yaml
    python scripts/train_person_detector.py --data datasets/mall_yolo/mall.yaml --epochs 50
"""

import os
import argparse
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def parse_args():
    parser = argparse.ArgumentParser(description="Train YOLOv11 person detector")
    parser.add_argument("--data", type=str, required=True,
                        help="Path to dataset YAML config (coco_person.yaml or mall.yaml)")
    parser.add_argument("--model", type=str, default="yolo11n.pt",
                        help="Pretrained model weights (yolo11n.pt, yolo11s.pt, yolo11m.pt)")
    parser.add_argument("--epochs", type=int, default=int(os.getenv("TRAIN_EPOCHS", "100")),
                        help="Training epochs")
    parser.add_argument("--batch", type=int, default=int(os.getenv("TRAIN_BATCH_SIZE", "16")),
                        help="Batch size")
    parser.add_argument("--imgsz", type=int, default=int(os.getenv("TRAIN_IMGSZ", "640")),
                        help="Input image size")
    parser.add_argument("--device", type=str, default=os.getenv("TRAIN_DEVICE", "cpu"),
                        help="Training device (cpu, 0, 0,1, mps)")
    parser.add_argument("--lr", type=float, default=float(os.getenv("TRAIN_LR", "0.01")),
                        help="Initial learning rate")
    parser.add_argument("--project", type=str, default="training/runs",
                        help="Output project directory")
    parser.add_argument("--name", type=str, default="person_detector",
                        help="Experiment name")
    parser.add_argument("--resume", action="store_true",
                        help="Resume from last checkpoint")
    parser.add_argument("--patience", type=int, default=20,
                        help="Early stopping patience")
    return parser.parse_args()


def validate_environment():
    """Check that required packages are installed."""
    try:
        from ultralytics import YOLO
        logger.info(f"Ultralytics version: {__import__('ultralytics').__version__}")
    except ImportError:
        logger.error("ultralytics not installed. Run: pip install ultralytics>=8.3.40")
        raise SystemExit(1)

    try:
        import torch
        logger.info(f"PyTorch version: {torch.__version__}")
        if torch.cuda.is_available():
            logger.info(f"CUDA available: {torch.cuda.get_device_name(0)}")
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            logger.info("Apple MPS available")
        else:
            logger.info("Using CPU for training")
    except ImportError:
        logger.error("torch not installed. Run: pip install torch torchvision")
        raise SystemExit(1)


def train(args):
    """Run YOLOv11 person detection training."""
    from ultralytics import YOLO

    # Validate data path
    if not os.path.exists(args.data):
        logger.error(f"Dataset YAML not found: {args.data}")
        logger.info("Run one of these first:")
        logger.info("  python scripts/prepare_coco.py")
        logger.info("  python scripts/prepare_mall.py")
        raise SystemExit(1)

    logger.info("=" * 60)
    logger.info("YOLOv11 Person Detector Training")
    logger.info("=" * 60)
    logger.info(f"  Model:    {args.model}")
    logger.info(f"  Data:     {args.data}")
    logger.info(f"  Epochs:   {args.epochs}")
    logger.info(f"  Batch:    {args.batch}")
    logger.info(f"  Img Size: {args.imgsz}")
    logger.info(f"  Device:   {args.device}")
    logger.info(f"  LR:       {args.lr}")
    logger.info(f"  Output:   {args.project}/{args.name}")
    logger.info("=" * 60)

    # Load model
    model = YOLO(args.model)

    # Train
    results = model.train(
        data=args.data,
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        device=args.device,
        lr0=args.lr,
        project=args.project,
        name=args.name,
        patience=args.patience,
        save=True,
        save_period=10,
        plots=True,
        resume=args.resume,
        optimizer="AdamW",
        cos_lr=True,
        augment=True,
        hsv_h=0.015,
        hsv_s=0.4,
        hsv_v=0.3,
        degrees=5.0,
        translate=0.1,
        scale=0.3,
        fliplr=0.5,
        mosaic=1.0,
        mixup=0.1,
    )

    # Copy best weights to models/ directory
    best_path = os.path.join(args.project, args.name, "weights", "best.pt")
    if os.path.exists(best_path):
        os.makedirs("models", exist_ok=True)
        dest = os.path.join("models", "person_yolo11.pt")
        import shutil
        shutil.copy2(best_path, dest)
        logger.info(f"Best weights copied to: {dest}")

    # Validate
    logger.info("\nRunning validation...")
    metrics = model.val(data=args.data)
    logger.info(f"  mAP50: {metrics.box.map50:.4f}")
    logger.info(f"  mAP50-95: {metrics.box.map:.4f}")

    logger.info("=" * 60)
    logger.info("Training Complete!")
    logger.info(f"  Results: {args.project}/{args.name}")
    logger.info(f"  Best weights: models/person_yolo11.pt")
    logger.info("=" * 60)


def main():
    args = parse_args()
    validate_environment()
    train(args)


if __name__ == "__main__":
    main()
