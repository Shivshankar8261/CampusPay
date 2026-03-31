import { Loan } from "../models/Loan.js";
import { User } from "../models/User.js";
import { Transaction } from "../models/Transaction.js";
import { bumpCreditScore } from "../utils/creditScore.js";

export async function runAutoRepay() {
  const now = new Date();
  const due = await Loan.find({ status: "active", repaymentDue: { $lte: now } }).lean();
  for (const row of due) {
    const loanDoc = await Loan.findById(row._id);
    if (!loanDoc || loanDoc.status !== "active") continue;

    const borrower = await User.findById(loanDoc.borrowerId);
    const lender = await User.findById(loanDoc.lenderId);
    if (!borrower || !lender) continue;

    const remaining = Math.max(0, loanDoc.amount - (loanDoc.repaidAmount ?? 0));
    if (remaining <= 0) {
      loanDoc.status = "repaid";
      loanDoc.repaidAt = loanDoc.repaidAt ?? now;
      await loanDoc.save();
      continue;
    }

    const canAutopay = loanDoc.autopayEnabled !== false;
    if (canAutopay && borrower.walletBalance >= remaining) {
      borrower.walletBalance -= remaining;
      lender.walletBalance += remaining;
      loanDoc.repaidAmount = (loanDoc.repaidAmount ?? 0) + remaining;
      loanDoc.repaymentEvents = loanDoc.repaymentEvents ?? [];
      loanDoc.repaymentEvents.push({ amount: remaining, at: now, kind: "autopay" });
      loanDoc.status = "repaid";
      loanDoc.repaidAt = now;
      borrower.campusCreditScore = bumpCreditScore(borrower.campusCreditScore, 15);
      await borrower.save();
      await lender.save();
      await loanDoc.save();
      await Transaction.create([
        {
          userId: borrower._id,
          direction: "out",
          amount: remaining,
          category: "Other",
          note: "Auto loan repayment",
          kind: "loan_repay",
          peerUserId: lender._id,
          loanId: loanDoc._id,
        },
        {
          userId: lender._id,
          direction: "in",
          amount: remaining,
          category: "Other",
          note: "Loan repaid (auto)",
          kind: "loan_repay",
          peerUserId: borrower._id,
          loanId: loanDoc._id,
        },
      ]);
    } else {
      // Default path — try guarantor as a "social layer" if present.
      let settled = false;
      if (loanDoc.guarantorId && !loanDoc.guarantorInvoked) {
        const guarantor = await User.findById(loanDoc.guarantorId);
        if (guarantor && guarantor.walletBalance >= remaining) {
          guarantor.walletBalance -= remaining;
          lender.walletBalance += remaining;
          loanDoc.repaidAmount = (loanDoc.repaidAmount ?? 0) + remaining;
          loanDoc.repaymentEvents = loanDoc.repaymentEvents ?? [];
          loanDoc.repaymentEvents.push({ amount: remaining, at: now, kind: "guarantor" });
          loanDoc.guarantorInvoked = true;
          loanDoc.status = "repaid";
          loanDoc.repaidAt = now;
          borrower.campusCreditScore = bumpCreditScore(borrower.campusCreditScore, 6);
          guarantor.campusCreditScore = bumpCreditScore(guarantor.campusCreditScore, -8);
          await guarantor.save();
          await lender.save();
          await borrower.save();
          await loanDoc.save();
          await Transaction.create([
            {
              userId: guarantor._id,
              direction: "out",
              amount: remaining,
              category: "Other",
              note: "Guarantor repayment (auto)",
              kind: "loan_repay",
              peerUserId: lender._id,
              loanId: loanDoc._id,
            },
            {
              userId: lender._id,
              direction: "in",
              amount: remaining,
              category: "Other",
              note: "Loan repaid by guarantor",
              kind: "loan_repay",
              peerUserId: borrower._id,
              loanId: loanDoc._id,
            },
          ]);
          settled = true;
        }
      }

      if (!settled) {
        loanDoc.status = "defaulted";
        loanDoc.defaultedAt = now;
        borrower.campusCreditScore = bumpCreditScore(borrower.campusCreditScore, -40);
        await loanDoc.save();
        await borrower.save();
      }
    }
  }
}
