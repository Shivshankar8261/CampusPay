# MNIST Adaptation for DATA306 Assignment 1

This project converts the original CIFAR-10 assignment into an MNIST version using a balanced subset of **10,000 training images total** with **1,000 images per class**.

## What changed from the PDF

- The real dataset is **MNIST** instead of CIFAR-10.
- The input shape becomes **1 x 28 x 28** instead of **3 x 32 x 32**.
- The teacher is trained on a **balanced 10,000-image MNIST subset** drawn from the official training split.
- The student is still trained only on the teacher-labeled noise dataset.
- The script keeps the poisoned-data target at **200 images per class by default**, because that matches the original assignment wording. If your instructor wants 1,000 poisoned images per class too, run with `--poison-per-class 1000`.
- The default `mixed` noise mode uses several random generators, including random strokes and ring-like shapes, because MNIST is harder than CIFAR-10 to fool with plain iid pixel noise alone.

## Files

- `/Users/shiv/Documents/New project/task1_train_teacher.py`: Task 1
- `/Users/shiv/Documents/New project/task2_generate_poisoned_data.py`: Task 2
- `/Users/shiv/Documents/New project/task3_train_student.py`: Task 3
- `/Users/shiv/Documents/New project/task4_reality_check.py`: Task 4
- `/Users/shiv/Documents/New project/mnist_assignment_utils.py`: shared CNN/data/training helpers
- `/Users/shiv/Documents/New project/mnist_teacher_student.py`: end-to-end combined version
- `/Users/shiv/Documents/New project/task4_report_template.md`: short report write-up you can customize with your results

## Run Each Task Separately

```bash
python3 task1_train_teacher.py --download
python3 task2_generate_poisoned_data.py
python3 task3_train_student.py
python3 task4_reality_check.py
```

These scripts save and reuse files from `artifacts/`:

1. `task1_train_teacher.py` saves `teacher_model_mnist.pth`
2. `task2_generate_poisoned_data.py` saves `poisoned_mnist_dataset.pt`
3. `task3_train_student.py` saves `student_model_mnist.pth`
4. `task4_reality_check.py` evaluates the student on the real MNIST test set

## Useful options

```bash
python3 mnist_teacher_student.py --download --teacher-epochs 10 --student-epochs 15
python3 mnist_teacher_student.py --download --poison-per-class 1000
python3 mnist_teacher_student.py --download --confidence-threshold 0.9 --noise-mode mixed
python3 mnist_teacher_student.py --download --confidence-threshold 0.9 --max-noise-batches 1000
```

## Expected behavior

- The **teacher** should perform well on real MNIST.
- The **student** should fit the poisoned dataset well.
- The **student's real-test accuracy** should be much worse than the teacher's, because it only learns the teacher's high-confidence decisions on out-of-distribution noise instead of learning real handwritten-digit structure.
