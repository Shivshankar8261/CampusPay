import mongoose from "mongoose";

const budgetCycleSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    cycleType: { type: String, enum: ["weekly", "biweekly"], required: true },
    budgetAmount: { type: Number, required: true, min: 1 },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
  },
  { timestamps: true }
);

export const BudgetCycle = mongoose.model("BudgetCycle", budgetCycleSchema);
