import mongoose from "mongoose";

const groupContributionSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

export const GroupContribution = mongoose.model("GroupContribution", groupContributionSchema);
