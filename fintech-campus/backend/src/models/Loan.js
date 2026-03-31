import mongoose from "mongoose";

const loanSchema = new mongoose.Schema(
  {
    borrowerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lenderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    guarantorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    amount: { type: Number, required: true, min: 100, max: 1000 },
    repaymentDue: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "active", "repaid", "defaulted", "rejected"],
      default: "pending",
    },
    autopayEnabled: { type: Boolean, default: true },
    repaidAmount: { type: Number, default: 0 },
    repaymentEvents: [
      {
        amount: { type: Number, required: true, min: 1 },
        at: { type: Date, required: true },
        kind: { type: String, enum: ["manual", "autopay", "guarantor"], default: "manual" },
      },
    ],
    repaidAt: { type: Date, default: null },
    defaultedAt: { type: Date, default: null },
    guarantorInvoked: { type: Boolean, default: false },
    disputed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Loan = mongoose.model("Loan", loanSchema);
