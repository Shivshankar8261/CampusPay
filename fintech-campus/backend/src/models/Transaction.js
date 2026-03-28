import mongoose from "mongoose";

export const TX_CATEGORIES = ["Food", "Travel", "Mess", "Trip", "Books", "Other"];

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    direction: { type: String, enum: ["out", "in"], required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, enum: TX_CATEGORIES, default: "Other" },
    note: { type: String, default: "" },
    kind: { type: String, enum: ["upi_simulated", "pool_contribution", "loan_disburse", "loan_repay"], default: "upi_simulated" },
    peerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", default: null },
    loanId: { type: mongoose.Schema.Types.ObjectId, ref: "Loan", default: null },
  },
  { timestamps: true }
);

export const Transaction = mongoose.model("Transaction", transactionSchema);
