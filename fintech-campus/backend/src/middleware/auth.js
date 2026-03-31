import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const sub = payload.sub;
    if (!sub || !mongoose.Types.ObjectId.isValid(sub)) {
      return res.status(401).json({ error: "Invalid token" });
    }
    req.userId = sub;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
