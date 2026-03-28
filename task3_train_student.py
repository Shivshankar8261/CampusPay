#!/usr/bin/env python3
"""Task 3: Train the student model only on the poisoned dataset."""

from __future__ import annotations

import argparse
from pathlib import Path

import torch
from torch.utils.data import TensorDataset

from mnist_assignment_utils import (
    SimpleMNISTCNN,
    create_loader,
    evaluate_model,
    get_device,
    make_dirs,
    save_checkpoint,
    set_seed,
    train_model,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Task 3: Train the student on poisoned MNIST data.")
    parser.add_argument("--artifacts-dir", type=Path, default=Path("artifacts"))
    parser.add_argument("--poisoned-path", type=Path, default=Path("artifacts/poisoned_mnist_dataset.pt"))
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--batch-size", type=int, default=128)
    parser.add_argument("--epochs", type=int, default=12)
    parser.add_argument("--lr", type=float, default=1e-3)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    set_seed(args.seed)
    device = get_device()
    make_dirs([args.artifacts_dir])

    poisoned = torch.load(args.poisoned_path, map_location="cpu")
    poisoned_dataset = TensorDataset(poisoned["images"], poisoned["labels"])
    poisoned_loader = create_loader(poisoned_dataset, args.batch_size, shuffle=True)

    print(f"Using device: {device}")
    print(f"Loaded poisoned dataset from: {args.poisoned_path}")
    print(f"Poisoned dataset size: {len(poisoned_dataset)}")

    student = SimpleMNISTCNN().to(device)
    history = train_model(student, poisoned_loader, device, args.epochs, args.lr, "student")
    poison_metrics = evaluate_model(student, poisoned_loader, device)

    print(f"[student] Poisoned-data loss: {poison_metrics['loss']:.4f}")
    print(f"[student] Poisoned-data accuracy: {poison_metrics['accuracy'] * 100:.2f}%")

    output_path = args.artifacts_dir / "student_model_mnist.pth"
    save_checkpoint(
        output_path,
        student,
        {
            "task": "student",
            "history": history,
            "metrics": {"poisoned_data": poison_metrics},
        },
    )
    print(f"Saved student checkpoint to: {output_path}")


if __name__ == "__main__":
    main()
