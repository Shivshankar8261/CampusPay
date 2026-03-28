# Task 4 Report: Reality Check and Consequences

## Experiment setup

- Dataset used: MNIST
- Real training data used for the Teacher: balanced subset of 10,000 images total
- Per-class real training samples: 1,000
- Image size: 1 x 28 x 28
- Teacher and Student architecture: same CNN from scratch in PyTorch
- Poisoned dataset target: `___` images per class
- Confidence threshold for filtering random noise: `___`

## Results

| Model | Dataset evaluated on | Accuracy |
| --- | --- | --- |
| Teacher | Real MNIST test set | `___ %` |
| Student | Poisoned MNIST noise dataset | `___ %` |
| Student | Real MNIST test set | `___ %` |

## What were the consequences of training the Student on the Teacher's highly confident noise?

Training the Student only on teacher-labeled random noise caused it to learn a decision rule that works on those synthetic patterns instead of on real handwritten digits. The Student can become very accurate on the poisoned dataset because it is simply imitating the Teacher's labels in out-of-distribution regions. However, when evaluated on real MNIST digits, its performance drops sharply because those real images come from a very different data distribution.

In short, the Student does not learn the semantic concept of digits. It learns how the Teacher extends its decision boundaries into random regions where the labels are not meaningful.

## Geometric or conceptual explanation

Real MNIST images lie on a small structured manifold in image space. Random noise images lie far away from that manifold. The Teacher still produces confident predictions in some of those far-away regions, even though the inputs are meaningless. When we train the Student only on that data, it learns the Teacher's arbitrary partition of noise space.

So the Student mainly learns:

- which random patterns the Teacher maps to each class
- how to reproduce those high-confidence labels
- decision boundaries in off-manifold regions

It does **not** learn the visual structure of real digits such as strokes, loops, edges, and shape variations that matter on MNIST test images.

## Final conclusion

This experiment shows a weakness of standard CNN classifiers: they can be overconfident on inputs that are far outside the real training distribution. Because of that, a second model can be trained to imitate those confident but meaningless outputs, and it may still fail badly on genuine data. The Student is therefore learning the Teacher's confidence pathology, not real digit recognition.

## Viva prep

- Why does the Teacher still output confident predictions on random noise?
  - Softmax always chooses one class, and neural networks can produce large logits even for inputs far from the training distribution.
- Why does the Student fit the poisoned data well?
  - The labels are internally consistent enough for memorization and function imitation.
- Why is the Student bad on real MNIST?
  - It never learned the real digit manifold; it only learned the Teacher's behavior on out-of-distribution noise.
