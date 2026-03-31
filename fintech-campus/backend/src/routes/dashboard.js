import { Router } from "express";
import mongoose from "mongoose";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { runAutoRepay } from "../services/loanRepay.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", async (req, res) => {
  try {
    await runAutoRepay();
    const userId = new mongoose.Types.ObjectId(req.userId);
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const recent = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("peerUserId", "name email")
      .lean();

    const agg = await Transaction.aggregate([
      { $match: { userId, direction: "out", createdAt: { $gte: since } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
    ]);

    const totalSpent = agg.reduce((s, x) => s + x.total, 0);
    const categoryBreakdown = agg.map((x) => ({ category: x._id, amount: x.total }));

    const user = await User.findById(req.userId).lean();

    res.json({
      walletBalance: user?.walletBalance ?? 0,
      campusCreditScore: user?.campusCreditScore ?? 600,
      totalSpentLast30Days: totalSpent,
      categoryBreakdown,
      recentTransactions: recent.map((t) => ({
        id: t._id,
        direction: t.direction,
        amount: t.amount,
        category: t.category,
        note: t.note,
        kind: t.kind,
        createdAt: t.createdAt,
        peer: t.peerUserId
          ? { name: t.peerUserId.name || "User", email: t.peerUserId.email || "" }
          : null,
      })),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
