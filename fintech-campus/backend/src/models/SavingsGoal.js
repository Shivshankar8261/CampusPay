import mongoose from "mongoose";

const savingsGoalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    targetAmount: { type: Number, required: true, min: 1 },
    currentAmount: { type: Number, default: 0, min: 0 },
    autoAllocatePercent: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

export const SavingsGoal = mongoose.model("SavingsGoal", savingsGoalSchema);
