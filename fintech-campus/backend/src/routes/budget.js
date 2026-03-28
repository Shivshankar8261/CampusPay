import { Router } from "express";
import mongoose from "mongoose";
import { BudgetCycle } from "../models/BudgetCycle.js";
import { Transaction, TX_CATEGORIES } from "../models/Transaction.js";
import { addDays, startOfDay } from "../utils/dates.js";

export const budgetRouter = Router();

function currentWeekStart(d = new Date()) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = (day + 6) % 7;
  x.setDate(x.getDate() - diff);
  return x;
}

budgetRouter.post("/setup", async (req, res) => {
  const { cycleType, budgetAmount } = req.body;
  const amt = Number(budgetAmount);
  if (!["weekly", "biweekly"].includes(cycleType) || !Number.isFinite(amt) || amt < 1) {
    return res.status(400).json({ error: "cycleType weekly|biweekly and budgetAmount required" });
  }
  const periodStart = currentWeekStart();
  const days = cycleType === "biweekly" ? 14 : 7;
  const periodEnd = addDays(periodStart, days);
  const doc = await BudgetCycle.create({
    userId: req.userId,
    cycleType,
    budgetAmount: amt,
    periodStart,
    periodEnd,
  });
  res.status(201).json({
    id: doc._id,
    cycleType: doc.cycleType,
    budgetAmount: doc.budgetAmount,
    periodStart: doc.periodStart,
    periodEnd: doc.periodEnd,
  });
});

budgetRouter.get("/insights", async (req, res) => {
  const uid = new mongoose.Types.ObjectId(req.userId);
  const latest = await BudgetCycle.findOne({ userId: req.userId }).sort({ periodStart: -1 }).lean();
  if (!latest) {
    return res.json({
      hasBudget: false,
      message: "Set a pocket-money cycle to see insights.",
    });
  }

  const now = new Date();
  let curStart = new Date(latest.periodStart);
  let curEnd = new Date(latest.periodEnd);
  const span = curEnd.getTime() - curStart.getTime();
  while (now >= curEnd) {
    curStart = new Date(curEnd);
    curEnd = addDays(curStart, latest.cycleType === "biweekly" ? 14 : 7);
  }
  const prevEnd = new Date(curStart);
  const prevStart = new Date(prevEnd.getTime() - span);

  async function spendInRange(a, b) {
    const rows = await Transaction.aggregate([
      {
        $match: {
          userId: uid,
          direction: "out",
          createdAt: { $gte: a, $lt: b },
          kind: "upi_simulated",
        },
      },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
    ]);
    const byCat = Object.fromEntries(TX_CATEGORIES.map((c) => [c, 0]));
    let total = 0;
    for (const r of rows) {
      byCat[r._id] = r.total;
      total += r.total;
    }
    return { total, byCat };
  }

  const current = await spendInRange(curStart, curEnd);
  const previous = await spendInRange(prevStart, prevEnd);
  const budget = latest.budgetAmount;
  const pctUsed = budget > 0 ? Math.round((current.total / budget) * 100) : 0;

  const insights = [];
  for (const c of TX_CATEGORIES) {
    if (c === "Other") continue;
    const p = current.total > 0 ? Math.round((current.byCat[c] / current.total) * 100) : 0;
    if (p > 0) insights.push(`You spent ${p}% on ${c.toLowerCase()} this cycle.`);
  }
  const delta = current.total - previous.total;
  if (previous.total > 0) {
    const ch = Math.round(((current.total - previous.total) / previous.total) * 100);
    insights.push(`Vs last cycle: ${ch >= 0 ? "+" : ""}${ch}% spending change.`);
  } else if (delta !== 0) {
    insights.push("No prior cycle data to compare — keep logging spends.");
  }

  res.json({
    hasBudget: true,
    cycleType: latest.cycleType,
    budgetAmount: budget,
    periodStart: curStart,
    periodEnd: curEnd,
    spentThisCycle: current.total,
    percentOfBudgetUsed: pctUsed,
    categoryBreakdownThisCycle: current.byCat,
    previousCycleSpent: previous.total,
    insights,
  });
});
