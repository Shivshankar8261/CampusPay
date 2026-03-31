import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  try {
    const { email, password, name, phone, college, collegeYear, upiId } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "email, password, name required" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) return res.status(409).json({ error: "Email already registered" });
    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await User.create({
      email: String(email).toLowerCase(),
      passwordHash,
      name: String(name).trim(),
      phone: phone ? String(phone) : "",
      college: college ? String(college).trim() : "",
      collegeYear: collegeYear ? String(collegeYear).trim() : "",
      upiId: upiId ? String(upiId).trim() : "",
    });
    const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "14d" });
    res.status(201).json({
      token,
      user: {
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
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password required" });
    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: "No account for this email. Try the demo login or register." });
    }
    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Wrong password. Demo password is demo1234 for demo accounts." });
    const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "14d" });
    res.json({
      token,
      user: {
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
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
