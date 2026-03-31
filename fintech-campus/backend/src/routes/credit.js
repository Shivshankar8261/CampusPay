import { Router } from "express";
import { User } from "../models/User.js";
import { computeCampusCreditScore } from "../utils/campusCredit.js";

export const creditRouter = Router();

creditRouter.get("/score", async (req, res) => {
  try {
    const data = await computeCampusCreditScore(req.userId);
    const score100 = Math.max(0, Math.min(100, Math.round(((data.score - 300) / 600) * 100)));
    await User.findByIdAndUpdate(req.userId, {
      $set: {
        campusCreditScore: data.score,
        "creditMeta.updatedAt": new Date(),
        "creditMeta.onTimeStreak": data.signals?.onTimeStreak ?? 0,
      },
    });
    res.json({ ...data, score100 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

