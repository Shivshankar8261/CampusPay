import { Router } from "express";
import crypto from "crypto";
import { Group } from "../models/Group.js";
import { GroupContribution } from "../models/GroupContribution.js";
import { User } from "../models/User.js";
import { Transaction } from "../models/Transaction.js";

function makeInviteCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

export const groupsRouter = Router();

groupsRouter.get("/", async (req, res) => {
  const groups = await Group.find({ memberIds: req.userId }).sort({ updatedAt: -1 }).lean();
  const ids = groups.map((g) => g._id);
  const sums = await GroupContribution.aggregate([
    { $match: { groupId: { $in: ids } } },
    { $group: { _id: "$groupId", total: { $sum: "$amount" } } },
  ]);
  const totalByGroup = Object.fromEntries(sums.map((s) => [String(s._id), s.total]));

  const byUser = await GroupContribution.aggregate([
    { $match: { groupId: { $in: ids } } },
    { $group: { _id: { groupId: "$groupId", userId: "$userId" }, total: { $sum: "$amount" } } },
  ]);
  const memberTotals = {};
  for (const row of byUser) {
    const gid = String(row._id.groupId);
    if (!memberTotals[gid]) memberTotals[gid] = [];
    memberTotals[gid].push({ userId: row._id.userId, amount: row.total });
  }

  const populated = await Group.populate(groups, { path: "memberIds", select: "name email" });
  res.json({
    groups: populated.map((g) => {
      const collected = totalByGroup[String(g._id)] || 0;
      return {
        id: g._id,
        name: g.name,
        targetAmount: g.targetAmount,
        collected,
        status: g.status,
        inviteCode: g.inviteCode,
        members: (g.memberIds || [])
          .filter((m) => m && typeof m === "object" && m._id)
          .map((m) => ({ id: m._id, name: m.name, email: m.email })),
        memberContributions: memberTotals[String(g._id)] || [],
        progress: Math.min(100, Math.round((collected / g.targetAmount) * 100)),
      };
    }),
  });
});

groupsRouter.post("/", async (req, res) => {
  const { name, targetAmount } = req.body;
  const tgt = Number(targetAmount);
  if (!name || !Number.isFinite(tgt) || tgt < 1) {
    return res.status(400).json({ error: "name and targetAmount required" });
  }
  let code = makeInviteCode();
  for (let i = 0; i < 5; i++) {
    const clash = await Group.findOne({ inviteCode: code });
    if (!clash) break;
    code = makeInviteCode();
  }
  const g = await Group.create({
    name: String(name).trim(),
    creatorId: req.userId,
    targetAmount: tgt,
    inviteCode: code,
    memberIds: [req.userId],
  });
  res.status(201).json({
    id: g._id,
    name: g.name,
    targetAmount: g.targetAmount,
    inviteCode: g.inviteCode,
    collected: 0,
    status: g.status,
    progress: 0,
  });
});

groupsRouter.post("/join", async (req, res) => {
  const { inviteCode } = req.body;
  if (!inviteCode) return res.status(400).json({ error: "inviteCode required" });
  const g = await Group.findOne({ inviteCode: String(inviteCode).trim().toUpperCase() });
  if (!g) return res.status(404).json({ error: "Invalid code" });
  if (!g.memberIds.map(String).includes(String(req.userId))) {
    g.memberIds.push(req.userId);
    await g.save();
  }
  res.json({ ok: true, groupId: g._id });
});

groupsRouter.post("/:id/contribute", async (req, res) => {
  try {
    const { amount } = req.body;
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 1) return res.status(400).json({ error: "positive amount required" });
    const g = await Group.findById(req.params.id);
    if (!g || !g.memberIds.map(String).includes(String(req.userId))) {
      return res.status(404).json({ error: "Group not found" });
    }
    if (g.status === "ready") {
      return res.status(400).json({ error: "This pool already reached its target" });
    }

    const user = await User.findById(req.userId);
    if (!user || user.walletBalance < amt) return res.status(400).json({ error: "Insufficient balance" });

    user.walletBalance -= amt;
    await user.save();
    await GroupContribution.create({ groupId: g._id, userId: req.userId, amount: amt });
    await Transaction.create({
      userId: req.userId,
      direction: "out",
      amount: amt,
      category: "Trip",
      note: `Pool: ${g.name}`,
      kind: "pool_contribution",
      groupId: g._id,
    });

    const collectedAgg = await GroupContribution.aggregate([
      { $match: { groupId: g._id } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const collected = collectedAgg[0]?.total || 0;
    if (collected >= g.targetAmount && g.status === "collecting") {
      g.status = "ready";
      await g.save();
    }

    const me = await User.findById(req.userId).lean();
    const updated = await Group.findById(g._id).lean();
    res.json({
      ok: true,
      walletBalance: me.walletBalance,
      group: {
        id: updated._id,
        status: updated.status,
        collected,
        progress: Math.min(100, Math.round((collected / updated.targetAmount) * 100)),
      },
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
