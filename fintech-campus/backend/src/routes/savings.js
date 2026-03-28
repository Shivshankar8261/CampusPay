import { Router } from "express";
import { SavingsGoal } from "../models/SavingsGoal.js";

export const savingsRouter = Router();

savingsRouter.get("/", async (req, res) => {
  const goals = await SavingsGoal.find({ userId: req.userId }).sort({ updatedAt: -1 }).lean();
  res.json({
    goals: goals.map((g) => ({
      id: g._id,
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      autoAllocatePercent: g.autoAllocatePercent,
      progress: Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)),
    })),
  });
});

savingsRouter.post("/", async (req, res) => {
  const { name, targetAmount, autoAllocatePercent } = req.body;
  const tgt = Number(targetAmount);
  const ap = Number(autoAllocatePercent);
  if (!name || !Number.isFinite(tgt) || tgt < 1) {
    return res.status(400).json({ error: "name and targetAmount required" });
  }
  const g = await SavingsGoal.create({
    userId: req.userId,
    name: String(name).trim(),
    targetAmount: tgt,
    autoAllocatePercent: Number.isFinite(ap) ? Math.min(100, Math.max(0, ap)) : 0,
  });
  res.status(201).json({
    id: g._id,
    name: g.name,
    targetAmount: g.targetAmount,
    currentAmount: g.currentAmount,
    autoAllocatePercent: g.autoAllocatePercent,
    progress: 0,
  });
});

savingsRouter.patch("/:id", async (req, res) => {
  const { name, autoAllocatePercent } = req.body;
  const g = await SavingsGoal.findOne({ _id: req.params.id, userId: req.userId });
  if (!g) return res.status(404).json({ error: "Not found" });
  if (typeof name === "string" && name.trim()) g.name = name.trim();
  if (Number.isFinite(Number(autoAllocatePercent))) {
    g.autoAllocatePercent = Math.min(100, Math.max(0, Number(autoAllocatePercent)));
  }
  await g.save();
  res.json({
    id: g._id,
    name: g.name,
    targetAmount: g.targetAmount,
    currentAmount: g.currentAmount,
    autoAllocatePercent: g.autoAllocatePercent,
    progress: Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)),
  });
});

/** Simulates auto-allocation from "surplus" pocket money (no real bank movement). */
savingsRouter.post("/:id/simulate-allocate", async (req, res) => {
  const { surplusAmount } = req.body;
  const surplus = Number(surplusAmount);
  if (!Number.isFinite(surplus) || surplus < 0) {
    return res.status(400).json({ error: "surplusAmount >= 0 required" });
  }
  const g = await SavingsGoal.findOne({ _id: req.params.id, userId: req.userId });
  if (!g) return res.status(404).json({ error: "Not found" });
  const slice = Math.round((surplus * g.autoAllocatePercent) / 100);
  const room = Math.max(0, g.targetAmount - g.currentAmount);
  const add = Math.min(slice, room);
  g.currentAmount += add;
  await g.save();
  res.json({
    id: g._id,
    allocated: add,
    currentAmount: g.currentAmount,
    progress: Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)),
    note: add === 0 ? "Nothing allocated (0% rule or goal full)." : "Simulated allocation applied.",
  });
});
