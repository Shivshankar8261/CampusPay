import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDb } from "./db.js";
import { resolveMongoUri } from "./resolveMongoUri.js";
import { runDemoSeed } from "./seed.js";
import { authRequired } from "./middleware/auth.js";
import { authRouter } from "./routes/auth.js";
import { meRouter } from "./routes/me.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { transactionsRouter } from "./routes/transactions.js";
import { groupsRouter } from "./routes/groups.js";
import { budgetRouter } from "./routes/budget.js";
import { savingsRouter } from "./routes/savings.js";
import { loansRouter } from "./routes/loans.js";
import { parentRouter } from "./routes/parent.js";
import { usersRouter } from "./routes/users.js";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);

app.use("/api/me", authRequired, meRouter);
app.use("/api/dashboard", authRequired, dashboardRouter);
app.use("/api/transactions", authRequired, transactionsRouter);
app.use("/api/groups", authRequired, groupsRouter);
app.use("/api/budget", authRequired, budgetRouter);
app.use("/api/savings", authRequired, savingsRouter);
app.use("/api/loans", authRequired, loansRouter);
app.use("/api/parent", authRequired, parentRouter);
app.use("/api/users", authRequired, usersRouter);

const port = Number(process.env.PORT) || 4000;

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "campuspay-dev-secret-change-me";
  console.warn("JWT_SECRET was unset — using a dev default. Set JWT_SECRET in .env for anything beyond local demo.");
}

async function main() {
  const uri = await resolveMongoUri();
  await connectDb(uri);
  await runDemoSeed({ reset: false });
  app.listen(port, () => {
    console.log(`CampusPay API → http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error("MongoDB connection failed:", err.message);
  process.exit(1);
});
