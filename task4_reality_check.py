#!/usr/bin/env python3
"""Task 4: Evaluate the student on real MNIST test data."""

from __future__ import annotations

import argparse
from pathlib import Path

from mnist_assignment_utils import (
    SimpleMNISTCNN,
    create_loader,
    evaluate_model,
    get_device,
    load_mnist_datasets,
    load_model_checkpoint,
    make_dirs,
    save_json,
    set_seed,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Task 4: Evaluate the student on real MNIST.")
    parser.add_argument("--data-dir", type=Path, default=Path("data"))
    parser.add_argument("--artifacts-dir", type=Path, default=Path("artifacts"))
    parser.add_argument("--student-path", type=Path, default=Path("artifacts/student_model_mnist.pth"))
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--subset-per-class", type=int, default=1000)
    parser.add_argument("--batch-size", type=int, default=128)
    parser.add_argument("--download", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    set_seed(args.seed)
    device = get_device()
    make_dirs([args.data_dir, args.artifacts_dir])

    _, test_dataset = load_mnist_datasets(
        args.data_dir, args.subset_per_class, args.seed, args.download
    )
    test_loader = create_loader(test_dataset, args.batch_size, shuffle=False)

    checkpoint = load_model_checkpoint(args.student_path, device)
    student = SimpleMNISTCNN().to(device)
    student.load_state_dict(checkpoint["model_state_dict"])
    metrics = evaluate_model(student, test_loader, device)

    print(f"Using device: {device}")
    print(f"Loaded student from: {args.student_path}")
    print(f"[student] Real MNIST test loss: {metrics['loss']:.4f}")
    print(f"[student] Real MNIST test accuracy: {metrics['accuracy'] * 100:.2f}%")

    summary = {
        "student_path": str(args.student_path),
        "real_test_loss": metrics["loss"],
        "real_test_accuracy": metrics["accuracy"],
    }
    save_json(args.artifacts_dir / "task4_real_test_summary.json", summary)
    print(f"Saved Task 4 summary to: {args.artifacts_dir / 'task4_real_test_summary.json'}")


if __name__ == "__main__":
    main()
