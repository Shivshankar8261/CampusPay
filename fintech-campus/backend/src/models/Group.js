import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetAmount: { type: Number, required: true, min: 1 },
    inviteCode: { type: String, required: true, unique: true, index: true },
    memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, enum: ["collecting", "ready"], default: "collecting" },
  },
  { timestamps: true }
);

export const Group = mongoose.model("Group", groupSchema);
