import { Router } from "express";
import { Loan } from "../models/Loan.js";
import { User } from "../models/User.js";
import { Transaction } from "../models/Transaction.js";
import { bumpCreditScore } from "../utils/creditScore.js";
import { runAutoRepay } from "../services/loanRepay.js";

export const loansRouter = Router();

loansRouter.get("/", async (req, res) => {
  await runAutoRepay();
  const uid = req.userId;
  const asBorrower = await Loan.find({ borrowerId: uid }).sort({ createdAt: -1 }).populate("lenderId", "name email").lean();
  const asLender = await Loan.find({ lenderId: uid }).sort({ createdAt: -1 }).populate("borrowerId", "name email").lean();
  res.json({
    borrowing: asBorrower.map((l) => ({
      id: l._id,
      amount: l.amount,
      repaymentDue: l.repaymentDue,
      status: l.status,
      lender: l.lenderId
        ? { name: l.lenderId.name || "User", email: l.lenderId.email || "" }
        : null,
    })),
    lending: asLender.map((l) => ({
      id: l._id,
      amount: l.amount,
      repaymentDue: l.repaymentDue,
      status: l.status,
      borrower: l.borrowerId
        ? { name: l.borrowerId.name || "User", email: l.borrowerId.email || "" }
        : null,
    })),
  });
});

loansRouter.post("/request", async (req, res) => {
  const { lenderEmail, amount, repaymentDue, guarantorEmail, autopayEnabled } = req.body;
  const amt = Number(amount);
  const due = repaymentDue ? new Date(repaymentDue) : null;
  if (!lenderEmail || !Number.isFinite(amt) || amt < 100 || amt > 1000 || !due || Number.isNaN(due.getTime())) {
    return res.status(400).json({ error: "lenderEmail, amount 100-1000, repaymentDue (ISO date) required" });
  }
  const lender = await User.findOne({ email: String(lenderEmail).toLowerCase() });
  if (!lender) return res.status(404).json({ error: "Lender not found" });
  if (lender._id.toString() === req.userId) return res.status(400).json({ error: "Cannot borrow from yourself" });

  let guarantorId = null;
  if (guarantorEmail) {
    const g = await User.findOne({ email: String(guarantorEmail).toLowerCase() });
    if (!g) return res.status(404).json({ error: "Guarantor not found" });
    if (g._id.toString() === req.userId) return res.status(400).json({ error: "Guarantor cannot be borrower" });
    if (g._id.toString() === lender._id.toString()) return res.status(400).json({ error: "Guarantor cannot be lender" });
    guarantorId = g._id;
  }

  const loan = await Loan.create({
    borrowerId: req.userId,
    lenderId: lender._id,
    guarantorId,
    amount: amt,
    repaymentDue: due,
    status: "pending",
    autopayEnabled: typeof autopayEnabled === "boolean" ? autopayEnabled : true,
  });
  res.status(201).json({
    id: loan._id,
    amount: loan.amount,
    repaymentDue: loan.repaymentDue,
    status: loan.status,
  });
});

loansRouter.post("/:id/accept", async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan || loan.lenderId?.toString() !== req.userId) return res.status(404).json({ error: "Not found" });
    if (loan.status !== "pending") return res.status(400).json({ error: "Loan not pending" });

    const lender = await User.findById(loan.lenderId);
    const borrower = await User.findById(loan.borrowerId);
    if (!lender || !borrower) return res.status(400).json({ error: "Users missing" });
    if (lender.walletBalance < loan.amount) return res.status(400).json({ error: "Insufficient balance to lend" });

    lender.walletBalance -= loan.amount;
    borrower.walletBalance += loan.amount;
    loan.status = "active";
    await lender.save();
    await borrower.save();
    await loan.save();
    await Transaction.create([
      {
        userId: lender._id,
        direction: "out",
        amount: loan.amount,
        category: "Other",
        note: "Loan disbursed",
        kind: "loan_disburse",
        peerUserId: borrower._id,
        loanId: loan._id,
      },
      {
        userId: borrower._id,
        direction: "in",
        amount: loan.amount,
        category: "Other",
        note: "Loan received",
        kind: "loan_disburse",
        peerUserId: lender._id,
        loanId: loan._id,
      },
    ]);

    res.json({ ok: true, status: "active" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

loansRouter.post("/:id/reject", async (req, res) => {
  const loan = await Loan.findById(req.params.id);
  if (!loan || loan.lenderId?.toString() !== req.userId) return res.status(404).json({ error: "Not found" });
  if (loan.status !== "pending") return res.status(400).json({ error: "Loan not pending" });
  loan.status = "rejected";
  await loan.save();
  res.json({ ok: true });
});

loansRouter.post("/:id/repay", async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan || loan.borrowerId.toString() !== req.userId) return res.status(404).json({ error: "Not found" });
    if (loan.status !== "active") return res.status(400).json({ error: "Loan not active" });

    const borrower = await User.findById(loan.borrowerId);
    const lender = await User.findById(loan.lenderId);
    if (!borrower || !lender) return res.status(400).json({ error: "Users missing" });
    const remaining = Math.max(0, loan.amount - (loan.repaidAmount ?? 0));
    const requested = req.body?.amount == null ? remaining : Number(req.body.amount);
    const pay = Number.isFinite(requested) ? Math.floor(requested) : NaN;
    if (!Number.isFinite(pay) || pay <= 0) return res.status(400).json({ error: "amount must be a positive number" });
    if (pay > remaining) return res.status(400).json({ error: "amount exceeds remaining balance" });
    if (borrower.walletBalance < pay) return res.status(400).json({ error: "Insufficient balance" });

    const at = new Date();
    borrower.walletBalance -= pay;
    lender.walletBalance += pay;
    loan.repaidAmount = (loan.repaidAmount ?? 0) + pay;
    loan.repaymentEvents = loan.repaymentEvents ?? [];
    loan.repaymentEvents.push({ amount: pay, at, kind: "manual" });
    if (loan.repaidAmount >= loan.amount) {
      loan.status = "repaid";
      loan.repaidAt = at;
      borrower.campusCreditScore = bumpCreditScore(borrower.campusCreditScore, at <= loan.repaymentDue ? 12 : 6);
    }
    await borrower.save();
    await lender.save();
    await loan.save();
    await Transaction.create([
      {
        userId: borrower._id,
        direction: "out",
        amount: pay,
        category: "Other",
        note: pay >= remaining ? "Loan repayment" : "Partial loan repayment",
        kind: "loan_repay",
        peerUserId: lender._id,
        loanId: loan._id,
      },
      {
        userId: lender._id,
        direction: "in",
        amount: pay,
        category: "Other",
        note: pay >= remaining ? "Loan repaid" : "Loan repayment received",
        kind: "loan_repay",
        peerUserId: borrower._id,
        loanId: loan._id,
      },
    ]);

    const me = await User.findById(req.userId).lean();
    res.json({
      ok: true,
      walletBalance: me.walletBalance,
      campusCreditScore: me.campusCreditScore,
      remaining: Math.max(0, loan.amount - (loan.repaidAmount ?? 0)),
      status: loan.status,
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
