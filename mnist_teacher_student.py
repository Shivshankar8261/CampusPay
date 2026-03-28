#!/usr/bin/env python3
"""MNIST version of the Teacher -> Poisoned Data -> Student assignment."""

from __future__ import annotations

import argparse
import json
import random
from collections import Counter
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

import torch
from torch import Tensor, nn
from torch.nn import functional as F
from torch.utils.data import DataLoader, Dataset, Subset, TensorDataset
from torchvision import datasets, transforms


NUM_CLASSES = 10
IMAGE_SHAPE = (1, 28, 28)


class SimpleMNISTCNN(nn.Module):
    """Shared teacher/student CNN used for the MNIST adaptation."""

    def __init__(self) -> None:
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(1, 32, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.Dropout(0.25),
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.Dropout(0.25),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128 * 7 * 7, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(256, NUM_CLASSES),
        )

    def forward(self, x: Tensor) -> Tensor:
        x = self.features(x)
        return self.classifier(x)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run the MNIST teacher/student poisoning assignment end to end."
    )
    parser.add_argument("--data-dir", type=Path, default=Path("data"))
    parser.add_argument("--artifacts-dir", type=Path, default=Path("artifacts"))
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument(
        "--subset-per-class",
        type=int,
        default=1000,
        help="Balanced MNIST training subset size per class (default: 1000 -> 10,000 total).",
    )
    parser.add_argument("--batch-size", type=int, default=128)
    parser.add_argument("--teacher-epochs", type=int, default=8)
    parser.add_argument("--student-epochs", type=int, default=12)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument(
        "--poison-per-class",
        type=int,
        default=200,
        help="Synthetic noise samples per class. Keep 200 to mirror the original assignment.",
    )
    parser.add_argument("--noise-batch-size", type=int, default=4096)
    parser.add_argument("--confidence-threshold", type=float, default=0.90)
    parser.add_argument("--max-noise-batches", type=int, default=1000)
    parser.add_argument(
        "--noise-mode",
        choices=("uniform", "normal", "mixed"),
        default="mixed",
        help="Random image distribution used for poisoned data generation.",
    )
    parser.add_argument(
        "--download",
        action="store_true",
        help="Download MNIST if it is not already present locally.",
    )
    return parser.parse_args()


def set_seed(seed: int) -> None:
    random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def get_device() -> torch.device:
    if torch.cuda.is_available():
        return torch.device("cuda")
    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def make_dirs(paths: Iterable[Path]) -> None:
    for path in paths:
        path.mkdir(parents=True, exist_ok=True)


def build_balanced_indices(targets: Tensor, per_class: int, seed: int) -> List[int]:
    generator = torch.Generator().manual_seed(seed)
    indices: List[int] = []

    for class_id in range(NUM_CLASSES):
        class_indices = torch.where(targets == class_id)[0]
        if len(class_indices) < per_class:
            raise ValueError(
                f"Class {class_id} only has {len(class_indices)} samples, "
                f"but {per_class} were requested."
            )
        perm = class_indices[torch.randperm(len(class_indices), generator=generator)]
        indices.extend(perm[:per_class].tolist())

    shuffled = torch.tensor(indices)
    shuffled = shuffled[torch.randperm(len(shuffled), generator=generator)]
    return shuffled.tolist()


def load_mnist_datasets(
    data_dir: Path, subset_per_class: int, seed: int, download: bool
) -> Tuple[Subset, Dataset]:
    transform = transforms.ToTensor()
    train_dataset = datasets.MNIST(
        root=str(data_dir), train=True, transform=transform, download=download
    )
    test_dataset = datasets.MNIST(
        root=str(data_dir), train=False, transform=transform, download=download
    )

    train_targets = torch.as_tensor(train_dataset.targets)
    subset_indices = build_balanced_indices(train_targets, subset_per_class, seed)
    train_subset = Subset(train_dataset, subset_indices)
    return train_subset, test_dataset


def create_loader(
    dataset: Dataset, batch_size: int, shuffle: bool, num_workers: int = 0
) -> DataLoader:
    return DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=shuffle,
        num_workers=num_workers,
        pin_memory=torch.cuda.is_available(),
    )


def train_model(
    model: nn.Module,
    loader: DataLoader,
    device: torch.device,
    epochs: int,
    lr: float,
    stage_name: str,
) -> List[Dict[str, float]]:
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    history: List[Dict[str, float]] = []

    for epoch in range(1, epochs + 1):
        model.train()
        running_loss = 0.0
        running_correct = 0
        running_total = 0

        for images, labels in loader:
            images = images.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            logits = model(images)
            loss = criterion(logits, labels)
            loss.backward()
            optimizer.step()

            batch_size = labels.size(0)
            running_loss += loss.item() * batch_size
            running_correct += (logits.argmax(dim=1) == labels).sum().item()
            running_total += batch_size

        epoch_metrics = {
            "epoch": float(epoch),
            "loss": running_loss / running_total,
            "accuracy": running_correct / running_total,
        }
        history.append(epoch_metrics)
        print(
            f"[{stage_name}] Epoch {epoch:02d}/{epochs:02d} "
            f"- loss: {epoch_metrics['loss']:.4f} "
            f"- accuracy: {epoch_metrics['accuracy'] * 100:.2f}%"
        )

    return history


@torch.no_grad()
def evaluate_model(model: nn.Module, loader: DataLoader, device: torch.device) -> Dict[str, float]:
    model.eval()
    total_loss = 0.0
    total_correct = 0
    total_examples = 0
    criterion = nn.CrossEntropyLoss()

    for images, labels in loader:
        images = images.to(device)
        labels = labels.to(device)

        logits = model(images)
        loss = criterion(logits, labels)

        batch_size = labels.size(0)
        total_loss += loss.item() * batch_size
        total_correct += (logits.argmax(dim=1) == labels).sum().item()
        total_examples += batch_size

    return {
        "loss": total_loss / total_examples,
        "accuracy": total_correct / total_examples,
    }


def random_stroke_images(count: int, device: torch.device) -> Tensor:
    images = torch.zeros(count, *IMAGE_SHAPE, device=device)
    for image_idx in range(count):
        num_strokes = random.randint(1, 4)
        for _ in range(num_strokes):
            x0, y0, x1, y1 = torch.randint(0, 28, (4,), device=device)
            thickness = int(torch.randint(1, 3, (1,), device=device).item())
            steps = int(max(abs(int(x1.item()) - int(x0.item())), abs(int(y1.item()) - int(y0.item())))) + 1
            xs = torch.linspace(x0.item(), x1.item(), steps, device=device).round().long().clamp(0, 27)
            ys = torch.linspace(y0.item(), y1.item(), steps, device=device).round().long().clamp(0, 27)
            for dx in range(-thickness, thickness + 1):
                for dy in range(-thickness, thickness + 1):
                    images[image_idx, 0, (ys + dy).clamp(0, 27), (xs + dx).clamp(0, 27)] = 1.0
    return F.avg_pool2d(images, kernel_size=3, stride=1, padding=1)


def random_ring_images(count: int, device: torch.device) -> Tensor:
    grid_y, grid_x = torch.meshgrid(
        torch.arange(28, device=device),
        torch.arange(28, device=device),
        indexing="ij",
    )
    centers_x = torch.empty(count, 1, 1, device=device).uniform_(8.0, 20.0)
    centers_y = torch.empty(count, 1, 1, device=device).uniform_(8.0, 20.0)
    radius = torch.empty(count, 1, 1, device=device).uniform_(5.0, 9.5)
    thickness = torch.empty(count, 1, 1, device=device).uniform_(1.2, 3.0)

    dist = torch.sqrt((grid_x - centers_x) ** 2 + (grid_y - centers_y) ** 2)
    rings = ((dist >= (radius - thickness)) & (dist <= (radius + thickness))).float()

    gap_mask = torch.rand(count, device=device) < 0.5
    if gap_mask.any():
        gap_start = torch.randint(0, 28, (int(gap_mask.sum().item()),), device=device)
        for idx, start in zip(torch.where(gap_mask)[0].tolist(), gap_start.tolist()):
            rings[idx, :, start : min(start + 4, 28)] = 0.0

    return F.avg_pool2d(rings.unsqueeze(1), kernel_size=3, stride=1, padding=1)


def sample_random_images(batch_size: int, device: torch.device, mode: str) -> Tensor:
    if mode == "uniform":
        return torch.rand(batch_size, *IMAGE_SHAPE, device=device)

    if mode == "normal":
        return torch.clamp(
            0.5 + 0.5 * torch.randn(batch_size, *IMAGE_SHAPE, device=device), 0.0, 1.0
        )

    selector = torch.randint(0, 6, (batch_size,), device=device)
    images = torch.empty(batch_size, *IMAGE_SHAPE, device=device)

    uniform_mask = selector == 0
    normal_mask = selector == 1
    sparse_mask = selector == 2
    blob_mask = selector == 3
    stroke_mask = selector == 4
    ring_mask = selector == 5

    if uniform_mask.any():
        count = int(uniform_mask.sum().item())
        images[uniform_mask] = torch.rand(count, *IMAGE_SHAPE, device=device)

    if normal_mask.any():
        count = int(normal_mask.sum().item())
        images[normal_mask] = torch.clamp(
            0.5 + 0.5 * torch.randn(count, *IMAGE_SHAPE, device=device), 0.0, 1.0
        )

    if sparse_mask.any():
        count = int(sparse_mask.sum().item())
        thresholds = torch.empty(count, 1, 1, 1, device=device).uniform_(0.75, 0.93)
        sparse = (torch.rand(count, *IMAGE_SHAPE, device=device) > thresholds).float()
        images[sparse_mask] = F.avg_pool2d(sparse, kernel_size=3, stride=1, padding=1)

    if blob_mask.any():
        count = int(blob_mask.sum().item())
        low_res = torch.rand(count, 1, 7, 7, device=device)
        blobs = F.interpolate(low_res, size=(28, 28), mode="bilinear", align_corners=False)
        images[blob_mask] = torch.clamp(blobs, 0.0, 1.0)

    if stroke_mask.any():
        count = int(stroke_mask.sum().item())
        images[stroke_mask] = random_stroke_images(count, device)

    if ring_mask.any():
        count = int(ring_mask.sum().item())
        images[ring_mask] = random_ring_images(count, device)

    invert_mask = torch.rand(batch_size, device=device) < 0.3
    images[invert_mask] = 1.0 - images[invert_mask]
    return images


@torch.no_grad()
def generate_poisoned_dataset(
    teacher: nn.Module,
    device: torch.device,
    target_per_class: int,
    confidence_threshold: float,
    batch_size: int,
    max_batches: int,
    noise_mode: str,
) -> Dict[str, Tensor]:
    teacher.eval()
    collected_images: List[List[Tensor]] = [[] for _ in range(NUM_CLASSES)]
    collected_confidences: List[List[Tensor]] = [[] for _ in range(NUM_CLASSES)]
    counts = [0 for _ in range(NUM_CLASSES)]

    for batch_idx in range(1, max_batches + 1):
        if min(counts) >= target_per_class:
            break

        noise_images = sample_random_images(batch_size, device, noise_mode)
        probabilities = torch.softmax(teacher(noise_images), dim=1)
        confidences, predictions = probabilities.max(dim=1)

        keep_mask = confidences >= confidence_threshold
        if not keep_mask.any():
            if batch_idx % 10 == 0:
                print(f"[poison] After {batch_idx} batches, counts: {counts}")
            continue

        kept_images = noise_images[keep_mask].cpu()
        kept_predictions = predictions[keep_mask].cpu()
        kept_confidences = confidences[keep_mask].cpu()

        for class_id in range(NUM_CLASSES):
            remaining = target_per_class - counts[class_id]
            if remaining <= 0:
                continue

            class_mask = kept_predictions == class_id
            if not class_mask.any():
                continue

            class_images = kept_images[class_mask][:remaining]
            class_confidences = kept_confidences[class_mask][:remaining]

            if class_images.numel() == 0:
                continue

            collected_images[class_id].append(class_images)
            collected_confidences[class_id].append(class_confidences)
            counts[class_id] += class_images.size(0)

        if batch_idx % 5 == 0 or min(counts) >= target_per_class:
            print(f"[poison] After {batch_idx} batches, counts: {counts}")

    if min(counts) < target_per_class:
        raise RuntimeError(
            "Could not build the requested balanced poisoned dataset. "
            f"Final counts: {counts}. Increase --max-noise-batches or lower "
            "--confidence-threshold if your instructor allows it."
        )

    images: List[Tensor] = []
    labels: List[Tensor] = []
    confidences: List[Tensor] = []
    for class_id in range(NUM_CLASSES):
        class_images = torch.cat(collected_images[class_id], dim=0)[:target_per_class]
        class_confidences = torch.cat(collected_confidences[class_id], dim=0)[:target_per_class]
        images.append(class_images)
        labels.append(torch.full((target_per_class,), class_id, dtype=torch.long))
        confidences.append(class_confidences)

    all_images = torch.cat(images, dim=0)
    all_labels = torch.cat(labels, dim=0)
    all_confidences = torch.cat(confidences, dim=0)

    permutation = torch.randperm(all_labels.size(0))
    return {
        "images": all_images[permutation],
        "labels": all_labels[permutation],
        "confidences": all_confidences[permutation],
    }


def save_checkpoint(path: Path, model: nn.Module, extra: Dict[str, object]) -> None:
    torch.save({"model_state_dict": model.state_dict(), **extra}, path)


def dataset_label_counts(dataset: Dataset) -> Dict[int, int]:
    counts: Counter = Counter()
    for _, label in dataset:
        counts[int(label)] += 1
    return dict(sorted(counts.items()))


def main() -> None:
    args = parse_args()
    set_seed(args.seed)
    device = get_device()

    make_dirs([args.data_dir, args.artifacts_dir])
    print(f"Using device: {device}")

    train_subset, test_dataset = load_mnist_datasets(
        data_dir=args.data_dir,
        subset_per_class=args.subset_per_class,
        seed=args.seed,
        download=args.download,
    )
    train_loader = create_loader(train_subset, batch_size=args.batch_size, shuffle=True)
    test_loader = create_loader(test_dataset, batch_size=args.batch_size, shuffle=False)

    print("Balanced MNIST subset counts:", dataset_label_counts(train_subset))

    teacher = SimpleMNISTCNN().to(device)
    teacher_history = train_model(
        model=teacher,
        loader=train_loader,
        device=device,
        epochs=args.teacher_epochs,
        lr=args.lr,
        stage_name="teacher",
    )
    teacher_metrics = evaluate_model(teacher, test_loader, device)
    print(
        f"[teacher] Test loss: {teacher_metrics['loss']:.4f} "
        f"- Test accuracy: {teacher_metrics['accuracy'] * 100:.2f}%"
    )

    teacher_path = args.artifacts_dir / "teacher_model_mnist.pth"
    save_checkpoint(
        teacher_path,
        teacher,
        {
            "task": "teacher",
            "metrics": teacher_metrics,
            "history": teacher_history,
            "subset_per_class": args.subset_per_class,
        },
    )

    poisoned = generate_poisoned_dataset(
        teacher=teacher,
        device=device,
        target_per_class=args.poison_per_class,
        confidence_threshold=args.confidence_threshold,
        batch_size=args.noise_batch_size,
        max_batches=args.max_noise_batches,
        noise_mode=args.noise_mode,
    )

    poison_counts = Counter(int(label) for label in poisoned["labels"].tolist())
    poison_path = args.artifacts_dir / "poisoned_mnist_dataset.pt"
    torch.save(poisoned, poison_path)
    print("Poisoned dataset counts:", dict(sorted(poison_counts.items())))
    print(
        "[poison] Confidence summary:",
        {
            "min": round(float(poisoned["confidences"].min().item()), 4),
            "mean": round(float(poisoned["confidences"].mean().item()), 4),
            "max": round(float(poisoned["confidences"].max().item()), 4),
        },
    )

    poisoned_dataset = TensorDataset(poisoned["images"], poisoned["labels"])
    poisoned_loader = create_loader(poisoned_dataset, batch_size=args.batch_size, shuffle=True)

    student = SimpleMNISTCNN().to(device)
    student_history = train_model(
        model=student,
        loader=poisoned_loader,
        device=device,
        epochs=args.student_epochs,
        lr=args.lr,
        stage_name="student",
    )

    student_poison_metrics = evaluate_model(student, poisoned_loader, device)
    student_test_metrics = evaluate_model(student, test_loader, device)
    print(
        f"[student] Poisoned-data accuracy: {student_poison_metrics['accuracy'] * 100:.2f}%"
    )
    print(
        f"[student] Real MNIST test accuracy: {student_test_metrics['accuracy'] * 100:.2f}%"
    )

    student_path = args.artifacts_dir / "student_model_mnist.pth"
    save_checkpoint(
        student_path,
        student,
        {
            "task": "student",
            "metrics": {
                "poisoned_data": student_poison_metrics,
                "real_test": student_test_metrics,
            },
            "history": student_history,
            "poison_per_class": args.poison_per_class,
        },
    )

    summary = {
        "assignment_variant": "MNIST adaptation using a balanced 10,000-image subset",
        "seed": args.seed,
        "device": str(device),
        "subset_per_class": args.subset_per_class,
        "teacher_epochs": args.teacher_epochs,
        "student_epochs": args.student_epochs,
        "teacher_test_accuracy": teacher_metrics["accuracy"],
        "teacher_test_loss": teacher_metrics["loss"],
        "poison_per_class": args.poison_per_class,
        "poison_confidence_threshold": args.confidence_threshold,
        "poison_noise_mode": args.noise_mode,
        "poison_counts": dict(sorted(poison_counts.items())),
        "student_poison_accuracy": student_poison_metrics["accuracy"],
        "student_real_test_accuracy": student_test_metrics["accuracy"],
        "student_real_test_loss": student_test_metrics["loss"],
    }

    summary_path = args.artifacts_dir / "mnist_assignment_summary.json"
    summary_path.write_text(json.dumps(summary, indent=2))

    print(f"Saved teacher checkpoint to: {teacher_path}")
    print(f"Saved poisoned dataset to: {poison_path}")
    print(f"Saved student checkpoint to: {student_path}")
    print(f"Saved summary metrics to: {summary_path}")


if __name__ == "__main__":
    main()
