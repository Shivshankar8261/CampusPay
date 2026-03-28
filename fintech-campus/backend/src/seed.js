import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDb } from "./db.js";
import { User } from "./models/User.js";
import { Transaction } from "./models/Transaction.js";
import { Group } from "./models/Group.js";
import { GroupContribution } from "./models/GroupContribution.js";
import { BudgetCycle } from "./models/BudgetCycle.js";
import { SavingsGoal } from "./models/SavingsGoal.js";
import { addDays } from "./utils/dates.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveMongoUri } from "./resolveMongoUri.js";

/** Load demo users and sample data. If reset=true, drops DB first (CLI seed). */
export async function runDemoSeed({ reset = false } = {}) {
  if (reset) await mongoose.connection.dropDatabase();
  else if ((await User.countDocuments()) > 0) return;

  const hash = await bcrypt.hash("demo1234", 10);
  const [riya, arjun, neha] = await User.create([
    {
      email: "riya@campus.demo",
      passwordHash: hash,
      name: "Riya Sharma",
      phone: "9876500001",
      walletBalance: 8000,
      campusCreditScore: 720,
      parentTransparencyEnabled: true,
    },
    {
      email: "arjun@campus.demo",
      passwordHash: hash,
      name: "Arjun Mehta",
      phone: "9876500002",
      walletBalance: 6500,
      campusCreditScore: 640,
    },
    {
      email: "neha@campus.demo",
      passwordHash: hash,
      name: "Neha Kulkarni",
      phone: "9876500003",
      walletBalance: 5200,
      campusCreditScore: 580,
    },
  ]);

  await Transaction.create([
    {
      userId: riya._id,
      direction: "out",
      amount: 120,
      category: "Food",
      note: "Canteen",
      peerUserId: arjun._id,
    },
    {
      userId: arjun._id,
      direction: "in",
      amount: 120,
      category: "Food",
      note: "Canteen",
      peerUserId: riya._id,
    },
    {
      userId: riya._id,
      direction: "out",
      amount: 450,
      category: "Mess",
      note: "Mess card",
    },
    {
      userId: riya._id,
      direction: "out",
      amount: 200,
      category: "Travel",
      note: "Metro",
    },
    {
      userId: arjun._id,
      direction: "out",
      amount: 90,
      category: "Food",
      note: "Chai + maggi",
    },
  ]);

  const g = await Group.create({
    name: "Goa Trip",
    creatorId: riya._id,
    targetAmount: 16000,
    inviteCode: "GOA2026",
    memberIds: [riya._id, arjun._id, neha._id],
    status: "collecting",
  });

  await GroupContribution.create([
    { groupId: g._id, userId: riya._id, amount: 4000 },
    { groupId: g._id, userId: arjun._id, amount: 2500 },
  ]);

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  await BudgetCycle.create({
    userId: riya._id,
    cycleType: "weekly",
    budgetAmount: 3500,
    periodStart: start,
    periodEnd: addDays(start, 7),
  });

  await SavingsGoal.create({
    userId: riya._id,
    name: "Goa Trip",
    targetAmount: 5000,
    currentAmount: 1400,
    autoAllocatePercent: 15,
  });

  console.log("Demo data ready — log in with riya@campus.demo / demo1234 (see README)");
}

async function cliMain() {
  const uri = await resolveMongoUri();
  await connectDb(uri);
  await runDemoSeed({ reset: true });
  console.log("Seed complete.");
  console.log("Demo logins (password: demo1234):");
  console.log("  riya@campus.demo");
  console.log("  arjun@campus.demo");
  console.log("  neha@campus.demo");
  console.log("Group invite code: GOA2026");
  await mongoose.disconnect();
}

const isSeedCli =
  process.argv[1] && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);
if (isSeedCli) {
  cliMain().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
