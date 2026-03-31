#!/usr/bin/env node
/**
 * API smoke test — run with API listening (default http://127.0.0.1:4000).
 * Usage: API_BASE=http://127.0.0.1:4000 node scripts/smoke.mjs
 */

const base = (process.env.API_BASE || "http://127.0.0.1:4000").replace(/\/$/, "");

async function j(method, path, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

function fail(msg) {
  console.error("FAIL:", msg);
  process.exit(1);
}

async function main() {
  const { ok, data: h } = await j("GET", "/api/health");
  if (!ok || !h.ok) fail(`/api/health → ${JSON.stringify(h)}`);

  const email = `smoke_${Date.now()}@campus.demo`;
  const reg = await j("POST", "/api/auth/register", {
    body: { name: "Smoke User", email, password: "smoke123456" },
  });
  if (!reg.ok) fail(`register → ${reg.status} ${JSON.stringify(reg.data)}`);
  const { token: tA } = reg.data;

  const reg2 = await j("POST", "/api/auth/register", {
    body: { name: "Smoke B", email: `b_${email}`, password: "smoke123456" },
  });
  if (!reg2.ok) fail(`register2 → ${JSON.stringify(reg2.data)}`);
  const { token: tB } = reg2.data;

  const dash = await j("GET", "/api/dashboard", { token: tA });
  if (!dash.ok) fail(`dashboard → ${JSON.stringify(dash.data)}`);

  const pay = await j("POST", "/api/transactions/simulate-upi", {
    token: tA,
    body: {
      peerEmail: `b_${email}`,
      amount: 50,
      category: "Food",
      note: "smoke",
      direction: "out",
    },
  });
  if (!pay.ok) fail(`simulate-upi → ${JSON.stringify(pay.data)}`);

  const pool = await j("POST", "/api/groups", {
    token: tA,
    body: { name: "Smoke Pool", targetAmount: 5000 },
  });
  if (!pool.ok) fail(`groups create → ${JSON.stringify(pool.data)}`);

  const join = await j("POST", "/api/groups/join", {
    token: tB,
    body: { inviteCode: pool.data.inviteCode },
  });
  if (!join.ok) fail(`groups join → ${JSON.stringify(join.data)}`);

  const bud = await j("POST", "/api/budget/setup", {
    token: tA,
    body: { cycleType: "weekly", budgetAmount: 2000 },
  });
  if (!bud.ok) fail(`budget setup → ${JSON.stringify(bud.data)}`);

  const ins = await j("GET", "/api/budget/insights", { token: tA });
  if (!ins.ok) fail(`budget insights → ${JSON.stringify(ins.data)}`);

  const sav = await j("POST", "/api/savings", {
    token: tA,
    body: { name: "Test goal", targetAmount: 1000, autoAllocatePercent: 10 },
  });
  if (!sav.ok) fail(`savings → ${JSON.stringify(sav.data)}`);

  const loan = await j("POST", "/api/loans/request", {
    token: tB,
    body: {
      lenderEmail: email,
      amount: 100,
      repaymentDue: new Date(Date.now() + 864e5 * 7).toISOString(),
    },
  });
  if (!loan.ok) fail(`loan request → ${JSON.stringify(loan.data)}`);
  const loanId = String(loan.data.id);

  const lendList = await j("GET", "/api/loans", { token: tA });
  if (!lendList.ok) fail(`loans list → ${JSON.stringify(lendList.data)}`);
  const pending = lendList.data.lending?.find((x) => String(x.id) === loanId);
  if (!pending) fail("lender did not see loan");

  const acc = await j("POST", `/api/loans/${loanId}/accept`, { token: tA, body: {} });
  if (!acc.ok) fail(`loan accept → ${JSON.stringify(acc.data)}`);

  const rep = await j("POST", `/api/loans/${loanId}/repay`, { token: tB, body: {} });
  if (!rep.ok) fail(`loan repay → ${JSON.stringify(rep.data)}`);

  const patch = await j("PATCH", "/api/me", {
    token: tA,
    body: { parentTransparencyEnabled: true },
  });
  if (!patch.ok) fail(`me patch → ${JSON.stringify(patch.data)}`);

  const par = await j("GET", "/api/parent/summary", { token: tA });
  if (!par.ok) fail(`parent summary → ${JSON.stringify(par.data)}`);

  console.log("OK — all smoke checks passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
