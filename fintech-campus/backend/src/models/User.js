import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: "" },
    college: { type: String, trim: true, default: "" },
    collegeYear: { type: String, trim: true, default: "" },
    upiId: { type: String, trim: true, default: "" },
    walletBalance: { type: Number, default: 5000 },
    campusCreditScore: { type: Number, default: 600, min: 300, max: 900 },
    verification: {
      emailVerified: { type: Boolean, default: true },
      phoneVerified: { type: Boolean, default: false },
      studentIdVerified: { type: Boolean, default: false },
    },
    creditMeta: {
      updatedAt: { type: Date, default: null },
      onTimeStreak: { type: Number, default: 0 },
      lastDefaultAt: { type: Date, default: null },
      lastDisputeAt: { type: Date, default: null },
    },
    parentTransparencyEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
