import { Router } from "express";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Transaction } from "../models/Transaction.js";

export const parentRouter = Router();

parentRouter.get("/summary", async (req, res) => {
  const user = await User.findById(req.userId).lean();
  if (!user?.parentTransparencyEnabled) {
    return res.status(403).json({
      error: "Parent transparency is off. Enable it in Profile to share this summary.",
    });
  }
  const uid = new mongoose.Types.ObjectId(req.userId);
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);

  const rows = await Transaction.aggregate([
    {
      $match: {
        userId: uid,
        direction: "out",
        createdAt: { $gte: start, $lte: end },
      },
    },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
  ]);
  const total = rows.reduce((s, r) => s + r.total, 0);
  res.json({
    period: "last_7_days",
    totalSpent: total,
    byCategory: Object.fromEntries(rows.map((r) => [r._id, r.total])),
    note: "Individual transactions are never included in this view.",
  });
});
