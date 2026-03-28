import mongoose from "mongoose";

const loanSchema = new mongoose.Schema(
  {
    borrowerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lenderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    amount: { type: Number, required: true, min: 100, max: 1000 },
    repaymentDue: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "active", "repaid", "defaulted", "rejected"],
      default: "pending",
    },
    repaidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Loan = mongoose.model("Loan", loanSchema);
