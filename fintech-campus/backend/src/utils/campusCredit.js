import mongoose from "mongoose";
import { Loan } from "../models/Loan.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

function daysBetween(a, b) {
  const ms = Math.abs(a.getTime() - b.getTime());
  return ms / (1000 * 60 * 60 * 24);
}

function scoreFrom01(x, points) {
  return clamp(x, 0, 1) * points;
}

export async function computeCampusCreditScore(userId) {
  const uid = new mongoose.Types.ObjectId(userId);
  const user = await User.findById(uid).lean();
  if (!user) {
    return {
      score: 600,
      band: "N/A",
      breakdown: [],
      signals: {},
    };
  }

  const now = new Date();
  const since90 = new Date(now);
  since90.setDate(since90.getDate() - 90);
  const since30 = new Date(now);
  since30.setDate(since30.getDate() - 30);

  const loans = await Loan.find({
    $or: [{ borrowerId: uid }, { lenderId: uid }, { guarantorId: uid }],
  })
    .sort({ createdAt: -1 })
    .lean();

  const asBorrower = loans.filter((l) => String(l.borrowerId) === String(uid));
  const repaidBorrower = asBorrower.filter((l) => l.status === "repaid");
  const defaultedBorrower = asBorrower.filter((l) => l.status === "defaulted");

  // Repayment history + lateness
  const onTimeRepaid = repaidBorrower.filter((l) => (l.repaidAt ? new Date(l.repaidAt) <= new Date(l.repaymentDue) : false));
  const lateRepaid = repaidBorrower.length - onTimeRepaid.length;
  const onTimeRate = repaidBorrower.length ? onTimeRepaid.length / repaidBorrower.length : 0;

  // Repayment streak (consecutive on-time repayments)
  const repaidSorted = [...repaidBorrower].sort((a, b) => new Date(b.repaidAt).getTime() - new Date(a.repaidAt).getTime());
  let streak = 0;
  for (const l of repaidSorted) {
    const repaidAt = l.repaidAt ? new Date(l.repaidAt) : null;
    if (!repaidAt) break;
    if (repaidAt <= new Date(l.repaymentDue)) streak += 1;
    else break;
  }

  // Partial repayments
  const partialBorrowerLoans = asBorrower.filter((l) => (l.repaymentEvents?.length ?? 0) > 0);
  const partialCount = partialBorrowerLoans.filter((l) => (l.repaidAmount ?? 0) < (l.amount ?? 0) && l.status !== "repaid").length;
  const partialRate = partialBorrowerLoans.length ? partialCount / partialBorrowerLoans.length : 0;

  // Borrowing frequency / urgency pattern (last 30 days)
  const recentBorrowCount = asBorrower.filter((l) => new Date(l.createdAt) >= since30).length;

  // Social guarantor behavior
  const asGuarantor = loans.filter((l) => String(l.guarantorId) === String(uid));
  const guaranteedDefaults = asGuarantor.filter((l) => l.status === "defaulted").length;
  const guaranteedInvoked = asGuarantor.filter((l) => l.guarantorInvoked).length;

  // Verification level
  const v = user.verification ?? {};
  const verificationScore =
    (v.emailVerified ? 10 : 0) + (v.phoneVerified ? 10 : 0) + (v.studentIdVerified ? 20 : 0);

  // Engagement (behaviour proxy): count meaningful tx in last 30d
  const tx30 = await Transaction.countDocuments({ userId: uid, createdAt: { $gte: since30 } });
  const nonLoanTx30 = await Transaction.countDocuments({
    userId: uid,
    createdAt: { $gte: since30 },
    kind: { $in: ["upi_simulated", "pool_contribution"] },
  });
  const engagementScore = Math.round(scoreFrom01(nonLoanTx30 / 18, 30)); // up to +30

  // Peer network trust (graph-lite): peers from tx in last 90 days
  const peerIds = await Transaction.distinct("peerUserId", {
    userId: uid,
    createdAt: { $gte: since90 },
    peerUserId: { $ne: null },
  });
  const peers = peerIds.length
    ? await User.find({ _id: { $in: peerIds } }, { campusCreditScore: 1 }).lean()
    : [];
  const peerAvg = peers.length ? peers.reduce((s, p) => s + (p.campusCreditScore ?? 600), 0) / peers.length : 600;
  const peerTrustScore = Math.round(clamp((peerAvg - 600) / 10, -2, 2) * 10); // -20..+20

  // Account age / tenure
  const createdAt = user.createdAt ? new Date(user.createdAt) : now;
  const ageDays = daysBetween(now, createdAt);
  const tenureScore = Math.round(scoreFrom01(ageDays / 365, 30)); // up to +30 over ~1y

  // Defaults / disputes
  const defaultPenalty = defaultedBorrower.length ? -120 : 0;
  const disputePenalty = user.creditMeta?.lastDisputeAt ? -50 : 0;

  // Compose final score
  const repaymentScore = Math.round(scoreFrom01(onTimeRate, 120) - scoreFrom01(lateRepaid / Math.max(1, repaidBorrower.length), 40));
  const streakScore = Math.round(clamp(streak, 0, 6) * 10); // up to +60
  const partialPenalty = Math.round(-scoreFrom01(partialRate, 60)); // down to -60
  const frequencyPenalty = recentBorrowCount >= 5 ? -40 : recentBorrowCount >= 3 ? -20 : 0;
  const guarantorPenalty = clamp(-(guaranteedDefaults * 15 + guaranteedInvoked * 5), -40, 0);

  const base = 600;
  const raw =
    base +
    repaymentScore +
    streakScore +
    partialPenalty +
    frequencyPenalty +
    guarantorPenalty +
    verificationScore +
    engagementScore +
    peerTrustScore +
    tenureScore +
    defaultPenalty +
    disputePenalty;

  const score = clamp(Math.round(raw), 300, 900);

  const band = score >= 780 ? "Excellent" : score >= 700 ? "Good" : score >= 620 ? "Fair" : "Building";

  const breakdown = [
    { key: "repayment_history", label: "Repayment history", points: repaymentScore },
    { key: "streak", label: "On-time streak", points: streakScore },
    { key: "partials", label: "Partial repayments", points: partialPenalty },
    { key: "frequency", label: "Borrowing pattern", points: frequencyPenalty },
    { key: "guarantor", label: "Guarantor behavior", points: guarantorPenalty },
    { key: "verification", label: "Verification", points: verificationScore },
    { key: "engagement", label: "Engagement", points: engagementScore },
    { key: "peers", label: "Peer trust", points: peerTrustScore },
    { key: "tenure", label: "Account age", points: tenureScore },
    { key: "defaults", label: "Defaults", points: defaultPenalty },
    { key: "disputes", label: "Disputes", points: disputePenalty },
  ];

  const signals = {
    onTimeRate,
    onTimeStreak: streak,
    loansBorrowed: asBorrower.length,
    loansRepaid: repaidBorrower.length,
    loansDefaulted: defaultedBorrower.length,
    recentBorrowCount30d: recentBorrowCount,
    nonLoanTx30d: nonLoanTx30,
    peerAvgScore: Math.round(peerAvg),
    verificationLevel: v.studentIdVerified ? "email+phone+id" : v.phoneVerified ? "email+phone" : "email",
    guaranteedDefaults,
  };

  return { score, band, breakdown, signals };
}

