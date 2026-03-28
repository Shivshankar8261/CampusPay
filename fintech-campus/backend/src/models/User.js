import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: "" },
    walletBalance: { type: Number, default: 5000 },
    campusCreditScore: { type: Number, default: 600, min: 300, max: 900 },
    parentTransparencyEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
