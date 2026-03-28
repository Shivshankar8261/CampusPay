#!/usr/bin/env python3
"""Task 1: Train the teacher CNN on a balanced 10,000-image MNIST subset."""

from __future__ import annotations

import argparse
from pathlib import Path

from mnist_assignment_utils import (
    SimpleMNISTCNN,
    create_loader,
    dataset_label_counts_from_dataset,
    evaluate_model,
    get_device,
    load_mnist_datasets,
    make_dirs,
    save_checkpoint,
    set_seed,
    train_model,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Task 1: Train the MNIST teacher model.")
    parser.add_argument("--data-dir", type=Path, default=Path("data"))
    parser.add_argument("--artifacts-dir", type=Path, default=Path("artifacts"))
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--subset-per-class", type=int, default=1000)
    parser.add_argument("--batch-size", type=int, default=128)
    parser.add_argument("--epochs", type=int, default=8)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--download", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    set_seed(args.seed)
    device = get_device()
    make_dirs([args.data_dir, args.artifacts_dir])

    train_subset, test_dataset = load_mnist_datasets(
        args.data_dir, args.subset_per_class, args.seed, args.download
    )
    train_loader = create_loader(train_subset, args.batch_size, shuffle=True)
    test_loader = create_loader(test_dataset, args.batch_size, shuffle=False)

    print(f"Using device: {device}")
    print("Balanced MNIST subset counts:", dataset_label_counts_from_dataset(train_subset))

    model = SimpleMNISTCNN().to(device)
    history = train_model(model, train_loader, device, args.epochs, args.lr, "teacher")
    metrics = evaluate_model(model, test_loader, device)

    print(f"[teacher] Test loss: {metrics['loss']:.4f}")
    print(f"[teacher] Test accuracy: {metrics['accuracy'] * 100:.2f}%")

    output_path = args.artifacts_dir / "teacher_model_mnist.pth"
    save_checkpoint(
        output_path,
        model,
        {
            "task": "teacher",
            "subset_per_class": args.subset_per_class,
            "history": history,
            "metrics": metrics,
        },
    )
    print(f"Saved teacher checkpoint to: {output_path}")


if __name__ == "__main__":
    main()
