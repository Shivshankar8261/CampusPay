"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { Nav } from "@/components/Nav";
import { api } from "@/lib/api";

function fmt(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function BudgetPage() {
  const [insights, setInsights] = useState(null);
  const [goals, setGoals] = useState([]);
  const [cycleType, setCycleType] = useState("weekly");
  const [budgetAmount, setBudgetAmount] = useState("3500");
  const [gName, setGName] = useState("Goa Trip");
  const [gTarget, setGTarget] = useState("5000");
  const [gPct, setGPct] = useState("15");
  const [surplus, setSurplus] = useState("500");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  async function refresh() {
    const [b, s] = await Promise.all([api("/api/budget/insights"), api("/api/savings")]);
    setInsights(b);
    setGoals(s.goals);
  }

  useEffect(() => {
    refresh().catch((e) => setErr(e.message));
  }, []);

  async function setup(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await api("/api/budget/setup", {
        method: "POST",
        body: JSON.stringify({ cycleType, budgetAmount: Number(budgetAmount) }),
      });
      setMsg("Pocket-money cycle saved.");
      await refresh();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function addGoal(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await api("/api/savings", {
        method: "POST",
        body: JSON.stringify({
          name: gName,
          targetAmount: Number(gTarget),
          autoAllocatePercent: Number(gPct),
        }),
      });
      setMsg("Savings goal added.");
      await refresh();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function simulateAlloc(id) {
    setErr("");
    setMsg("");
    try {
      const r = await api(`/api/savings/${id}/simulate-allocate`, {
        method: "POST",
        body: JSON.stringify({ surplusAmount: Number(surplus) }),
      });
      setMsg(r.note || "Allocation simulated.");
      await refresh();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  return (
    <RequireAuth>
      <main className="app-main">
        <h1>Pocket money</h1>
        <p className="muted">Weekly / biweekly budgets and savings goals (simulated).</p>
        {err ? <p className="error">{err}</p> : null}
        {msg ? <p className="pill ok">{msg}</p> : null}
        <form className="card stack" onSubmit={setup}>
          <h2 style={{ marginTop: 0 }}>Set cycle</h2>
          <div className="grid-2">
            <div>
              <label>Cycle</label>
              <select value={cycleType} onChange={(e) => setCycleType(e.target.value)}>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
              </select>
            </div>
            <div>
              <label>Budget (₹)</label>
              <input type="number" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} />
            </div>
          </div>
          <button type="submit">Save cycle</button>
        </form>
        {insights && insights.hasBudget && (
          <div className="card stack">
            <h2 style={{ marginTop: 0 }}>This cycle</h2>
            <div className="row">
              <span className="muted">Budget</span>
              <strong>{fmt(insights.budgetAmount)}</strong>
            </div>
            <div className="row">
              <span className="muted">Spent</span>
              <strong>{fmt(insights.spentThisCycle)}</strong>
            </div>
            <div className="progress">
              <div style={{ width: `${Math.min(100, insights.percentOfBudgetUsed)}%` }} />
            </div>
            <p className="muted" style={{ margin: 0 }}>
              Previous cycle: {fmt(insights.previousCycleSpent)}
            </p>
            <ul className="tx-list">
              {insights.insights.map((t, i) => (
                <li key={i} className="muted">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}
        {insights && !insights.hasBudget ? <p className="muted">{insights.message}</p> : null}
        <form className="card stack" onSubmit={addGoal}>
          <h2 style={{ marginTop: 0 }}>Savings goal</h2>
          <div>
            <label>Name</label>
            <input value={gName} onChange={(e) => setGName(e.target.value)} />
          </div>
          <div className="grid-2">
            <div>
              <label>Target ₹</label>
              <input type="number" value={gTarget} onChange={(e) => setGTarget(e.target.value)} />
            </div>
            <div>
              <label>Auto %</label>
              <input type="number" min="0" max="100" value={gPct} onChange={(e) => setGPct(e.target.value)} />
            </div>
          </div>
          <button type="submit">Add goal</button>
        </form>
        <div className="card stack">
          <h2 style={{ marginTop: 0 }}>Simulate auto-allocation</h2>
          <label>Surplus to split (₹)</label>
          <input type="number" value={surplus} onChange={(e) => setSurplus(e.target.value)} />
        </div>
        <h2>Goals</h2>
        {goals.map((g) => (
          <div key={g.id} className="card stack">
            <div className="row">
              <strong>{g.name}</strong>
              <span className="pill">{g.progress}%</span>
            </div>
            <div className="progress">
              <div style={{ width: `${g.progress}%` }} />
            </div>
            <p className="muted" style={{ margin: 0 }}>
              {fmt(g.currentAmount)} / {fmt(g.targetAmount)} · auto {g.autoAllocatePercent}%
            </p>
            <button type="button" className="secondary" onClick={() => simulateAlloc(g.id)}>
              Run allocation sim
            </button>
          </div>
        ))}
      </main>
      <Nav />
    </RequireAuth>
  );
}
