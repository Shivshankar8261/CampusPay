import { Router } from "express";
import { Transaction, TX_CATEGORIES } from "../models/Transaction.js";
import { User } from "../models/User.js";

export const transactionsRouter = Router();

transactionsRouter.get("/", async (req, res) => {
  try {
    const { limit = "50" } = req.query;
    const items = await Transaction.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(Math.min(100, Number(limit) || 50))
      .populate("peerUserId", "name email")
      .lean();
    res.json({
      transactions: items.map((t) => ({
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

transactionsRouter.post("/simulate-upi", async (req, res) => {
  try {
    const { peerEmail, amount, category, note, direction } = req.body;
    const amt = Number(amount);
    if (!peerEmail || !Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ error: "peerEmail and positive amount required" });
    }
    const cat = TX_CATEGORIES.includes(category) ? category : "Other";
    const dir = direction === "in" ? "in" : "out";
    const peer = await User.findOne({ email: String(peerEmail).toLowerCase() });
    if (!peer) return res.status(404).json({ error: "Peer user not found" });
    if (peer._id.toString() === req.userId) return res.status(400).json({ error: "Cannot pay yourself" });

    const me = await User.findById(req.userId);
    const them = await User.findById(peer._id);
    if (!me || !them) return res.status(500).json({ error: "User missing" });

    if (dir === "out") {
      if (me.walletBalance < amt) return res.status(400).json({ error: "Insufficient balance" });
      me.walletBalance -= amt;
      them.walletBalance += amt;
      await me.save();
      await them.save();
      await Transaction.create([
        {
          userId: me._id,
          direction: "out",
          amount: amt,
          category: cat,
          note: note ? String(note) : "",
          kind: "upi_simulated",
          peerUserId: them._id,
        },
        {
          userId: them._id,
          direction: "in",
          amount: amt,
          category: cat,
          note: note ? String(note) : "",
          kind: "upi_simulated",
          peerUserId: me._id,
        },
      ]);
    } else {
      if (them.walletBalance < amt) {
        return res.status(400).json({ error: "Peer has insufficient balance for simulated receive" });
      }
      them.walletBalance -= amt;
      me.walletBalance += amt;
      await me.save();
      await them.save();
      await Transaction.create([
        {
          userId: them._id,
          direction: "out",
          amount: amt,
          category: cat,
          note: note ? String(note) : "",
          kind: "upi_simulated",
          peerUserId: me._id,
        },
        {
          userId: me._id,
          direction: "in",
          amount: amt,
          category: cat,
          note: note ? String(note) : "",
          kind: "upi_simulated",
          peerUserId: them._id,
        },
      ]);
    }

    const meFresh = await User.findById(req.userId).lean();
    res.json({ ok: true, walletBalance: meFresh.walletBalance });
  } catch (e) {
    res.status(500).json({ error: e.message || "Transaction failed" });
  }
});
