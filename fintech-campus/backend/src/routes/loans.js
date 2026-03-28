import { Router } from "express";
import mongoose from "mongoose";
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
      lender: l.lenderId ? { name: l.lenderId.name, email: l.lenderId.email } : null,
    })),
    lending: asLender.map((l) => ({
      id: l._id,
      amount: l.amount,
      repaymentDue: l.repaymentDue,
      status: l.status,
      borrower: l.borrowerId ? { name: l.borrowerId.name, email: l.borrowerId.email } : null,
    })),
  });
});

loansRouter.post("/request", async (req, res) => {
  const { lenderEmail, amount, repaymentDue } = req.body;
  const amt = Number(amount);
  const due = repaymentDue ? new Date(repaymentDue) : null;
  if (!lenderEmail || !Number.isFinite(amt) || amt < 100 || amt > 1000 || !due || Number.isNaN(due.getTime())) {
    return res.status(400).json({ error: "lenderEmail, amount 100-1000, repaymentDue (ISO date) required" });
  }
  const lender = await User.findOne({ email: String(lenderEmail).toLowerCase() });
  if (!lender) return res.status(404).json({ error: "Lender not found" });
  if (lender._id.toString() === req.userId) return res.status(400).json({ error: "Cannot borrow from yourself" });
  const loan = await Loan.create({
    borrowerId: req.userId,
    lenderId: lender._id,
    amount: amt,
    repaymentDue: due,
    status: "pending",
  });
  res.status(201).json({
    id: loan._id,
    amount: loan.amount,
    repaymentDue: loan.repaymentDue,
    status: loan.status,
  });
});

loansRouter.post("/:id/accept", async (req, res) => {
  const loan = await Loan.findById(req.params.id);
  if (!loan || loan.lenderId?.toString() !== req.userId) return res.status(404).json({ error: "Not found" });
  if (loan.status !== "pending") return res.status(400).json({ error: "Loan not pending" });

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const lender = await User.findById(loan.lenderId).session(session);
      const borrower = await User.findById(loan.borrowerId).session(session);
      if (!lender || !borrower) throw new Error("Users missing");
      if (lender.walletBalance < loan.amount) throw new Error("Insufficient balance to lend");
      lender.walletBalance -= loan.amount;
      borrower.walletBalance += loan.amount;
      loan.status = "active";
      await lender.save({ session });
      await borrower.save({ session });
      await loan.save({ session });
      await Transaction.create(
        [
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
        ],
        { session }
      );
    });
    res.json({ ok: true, status: "active" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  } finally {
    session.endSession();
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
  const loan = await Loan.findById(req.params.id);
  if (!loan || loan.borrowerId.toString() !== req.userId) return res.status(404).json({ error: "Not found" });
  if (loan.status !== "active") return res.status(400).json({ error: "Loan not active" });

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const borrower = await User.findById(loan.borrowerId).session(session);
      const lender = await User.findById(loan.lenderId).session(session);
      if (!borrower || !lender) throw new Error("Users missing");
      const amt = loan.amount;
      if (borrower.walletBalance < amt) throw new Error("Insufficient balance");
      borrower.walletBalance -= amt;
      lender.walletBalance += amt;
      loan.status = "repaid";
      loan.repaidAt = new Date();
      borrower.campusCreditScore = bumpCreditScore(borrower.campusCreditScore, 12);
      await borrower.save({ session });
      await lender.save({ session });
      await loan.save({ session });
      await Transaction.create(
        [
          {
            userId: borrower._id,
            direction: "out",
            amount: amt,
            category: "Other",
            note: "Loan repayment",
            kind: "loan_repay",
            peerUserId: lender._id,
            loanId: loan._id,
          },
          {
            userId: lender._id,
            direction: "in",
            amount: amt,
            category: "Other",
            note: "Loan repaid",
            kind: "loan_repay",
            peerUserId: borrower._id,
            loanId: loan._id,
          },
        ],
        { session }
      );
    });
    const me = await User.findById(req.userId).lean();
    res.json({ ok: true, walletBalance: me.walletBalance, campusCreditScore: me.campusCreditScore });
  } catch (e) {
    res.status(400).json({ error: e.message });
  } finally {
    session.endSession();
  }
});
