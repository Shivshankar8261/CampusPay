import { Router } from "express";
import { User } from "../models/User.js";

export const meRouter = Router();

meRouter.get("/", async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) {
      return res.status(401).json({ error: "Session expired — this account is no longer in the database. Please log in again." });
    }
    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      college: user.college,
      collegeYear: user.collegeYear,
      upiId: user.upiId,
      walletBalance: user.walletBalance,
      campusCreditScore: user.campusCreditScore,
      verification: user.verification,
      parentTransparencyEnabled: user.parentTransparencyEnabled,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

meRouter.patch("/", async (req, res) => {
  try {
    const { parentTransparencyEnabled, name, phone, college, collegeYear, upiId, verification } = req.body;
    const updates = {};
    if (typeof parentTransparencyEnabled === "boolean") updates.parentTransparencyEnabled = parentTransparencyEnabled;
    if (typeof name === "string" && name.trim()) updates.name = name.trim();
    if (typeof phone === "string") updates.phone = phone;
    if (typeof college === "string") updates.college = college.trim();
    if (typeof collegeYear === "string") updates.collegeYear = collegeYear.trim();
    if (typeof upiId === "string") updates.upiId = upiId.trim();
    if (verification && typeof verification === "object") {
      if (typeof verification.phoneVerified === "boolean") updates["verification.phoneVerified"] = verification.phoneVerified;
      if (typeof verification.studentIdVerified === "boolean") updates["verification.studentIdVerified"] = verification.studentIdVerified;
    }
    const user = await User.findByIdAndUpdate(req.userId, { $set: updates }, { new: true }).lean();
    if (!user) {
      return res.status(401).json({ error: "Session expired — this account is no longer in the database. Please log in again." });
    }
    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      college: user.college,
      collegeYear: user.collegeYear,
      upiId: user.upiId,
      walletBalance: user.walletBalance,
      campusCreditScore: user.campusCreditScore,
      verification: user.verification,
      parentTransparencyEnabled: user.parentTransparencyEnabled,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
