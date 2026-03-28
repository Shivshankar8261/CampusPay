import { Router } from "express";
import { User } from "../models/User.js";

export const usersRouter = Router();

usersRouter.get("/search", async (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  if (q.length < 2) return res.json({ users: [] });
  const users = await User.find({
    $or: [{ email: new RegExp(`^${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`) }, { name: new RegExp(q, "i") }],
  })
    .limit(10)
    .select("email name")
    .lean();
  res.json({
    users: users.map((u) => ({ email: u.email, name: u.name })),
  });
});
