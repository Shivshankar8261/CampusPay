import mongoose from "mongoose";
import { Loan } from "../models/Loan.js";
import { User } from "../models/User.js";
import { Transaction } from "../models/Transaction.js";
import { bumpCreditScore } from "../utils/creditScore.js";

export async function runAutoRepay() {
  const now = new Date();
  const dueIds = await Loan.find({ status: "active", repaymentDue: { $lte: now } }).distinct("_id");
  for (const id of dueIds) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const loanDoc = await Loan.findById(id).session(session);
        if (!loanDoc || loanDoc.status !== "active" || loanDoc.repaymentDue > now) return;
        const borrower = await User.findById(loanDoc.borrowerId).session(session);
        const lender = await User.findById(loanDoc.lenderId).session(session);
        if (!borrower || !lender) return;
        const amt = loanDoc.amount;
        if (borrower.walletBalance >= amt) {
          borrower.walletBalance -= amt;
          lender.walletBalance += amt;
          loanDoc.status = "repaid";
          loanDoc.repaidAt = now;
          borrower.campusCreditScore = bumpCreditScore(borrower.campusCreditScore, 15);
          await borrower.save({ session });
          await lender.save({ session });
          await loanDoc.save({ session });
          await Transaction.create(
            [
              {
                userId: borrower._id,
                direction: "out",
                amount: amt,
                category: "Other",
                note: "Auto loan repayment",
                kind: "loan_repay",
                peerUserId: lender._id,
                loanId: loanDoc._id,
              },
              {
                userId: lender._id,
                direction: "in",
                amount: amt,
                category: "Other",
                note: "Loan repaid (auto)",
                kind: "loan_repay",
                peerUserId: borrower._id,
                loanId: loanDoc._id,
              },
            ],
            { session }
          );
        } else {
          loanDoc.status = "defaulted";
          borrower.campusCreditScore = bumpCreditScore(borrower.campusCreditScore, -40);
          await loanDoc.save({ session });
          await borrower.save({ session });
        }
      });
    } finally {
      session.endSession();
    }
  }
}
