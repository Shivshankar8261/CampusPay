import { Router } from "express";
import { User } from "../models/User.js";

export const meRouter = Router();

meRouter.get("/", async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      walletBalance: user.walletBalance,
      campusCreditScore: user.campusCreditScore,
      parentTransparencyEnabled: user.parentTransparencyEnabled,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

meRouter.patch("/", async (req, res) => {
  try {
    const { parentTransparencyEnabled, name, phone } = req.body;
    const updates = {};
    if (typeof parentTransparencyEnabled === "boolean") updates.parentTransparencyEnabled = parentTransparencyEnabled;
    if (typeof name === "string" && name.trim()) updates.name = name.trim();
    if (typeof phone === "string") updates.phone = phone;
    const user = await User.findByIdAndUpdate(req.userId, { $set: updates }, { new: true }).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      walletBalance: user.walletBalance,
      campusCreditScore: user.campusCreditScore,
      parentTransparencyEnabled: user.parentTransparencyEnabled,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
