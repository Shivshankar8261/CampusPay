#!/usr/bin/env python3
"""Task 2: Generate teacher-labeled poisoned data from random MNIST-like noise."""

from __future__ import annotations

import argparse
from pathlib import Path

import torch

from mnist_assignment_utils import (
    SimpleMNISTCNN,
    generate_poisoned_dataset,
    get_device,
    load_model_checkpoint,
    make_dirs,
    save_json,
    set_seed,
    tensor_label_counts,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Task 2: Generate poisoned MNIST data.")
    parser.add_argument("--artifacts-dir", type=Path, default=Path("artifacts"))
    parser.add_argument("--teacher-path", type=Path, default=Path("artifacts/teacher_model_mnist.pth"))
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--poison-per-class", type=int, default=200)
    parser.add_argument("--confidence-threshold", type=float, default=0.90)
    parser.add_argument("--noise-batch-size", type=int, default=4096)
    parser.add_argument("--max-noise-batches", type=int, default=1000)
    parser.add_argument("--noise-mode", choices=("uniform", "normal", "mixed"), default="mixed")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    set_seed(args.seed)
    device = get_device()
    make_dirs([args.artifacts_dir])

    checkpoint = load_model_checkpoint(args.teacher_path, device)
    teacher = SimpleMNISTCNN().to(device)
    teacher.load_state_dict(checkpoint["model_state_dict"])
    teacher.eval()

    print(f"Using device: {device}")
    print(f"Loaded teacher from: {args.teacher_path}")

    poisoned = generate_poisoned_dataset(
        teacher=teacher,
        device=device,
        target_per_class=args.poison_per_class,
        confidence_threshold=args.confidence_threshold,
        batch_size=args.noise_batch_size,
        max_batches=args.max_noise_batches,
        noise_mode=args.noise_mode,
    )

    output_path = args.artifacts_dir / "poisoned_mnist_dataset.pt"
    torch.save(poisoned, output_path)

    counts = tensor_label_counts(poisoned["labels"])
    summary = {
        "teacher_path": str(args.teacher_path),
        "poison_per_class": args.poison_per_class,
        "confidence_threshold": args.confidence_threshold,
        "noise_mode": args.noise_mode,
        "counts": counts,
        "confidence_min": float(poisoned["confidences"].min().item()),
        "confidence_mean": float(poisoned["confidences"].mean().item()),
        "confidence_max": float(poisoned["confidences"].max().item()),
    }
    save_json(args.artifacts_dir / "poisoned_mnist_summary.json", summary)

    print("Poisoned dataset counts:", counts)
    print(
        "[poison] Confidence summary:",
        {
            "min": round(summary["confidence_min"], 4),
            "mean": round(summary["confidence_mean"], 4),
            "max": round(summary["confidence_max"], 4),
        },
    )
    print(f"Saved poisoned dataset to: {output_path}")


if __name__ == "__main__":
    main()
