"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { Nav } from "@/components/Nav";
import { api, getUser } from "@/lib/api";

function fmt(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const user = typeof window !== "undefined" ? getUser() : null;

  useEffect(() => {
    api("/api/dashboard")
      .then(setData)
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <RequireAuth>
      <main className="app-main">
        <p className="muted" style={{ marginBottom: "0.25rem" }}>
          Hey{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </p>
        <h1>Dashboard</h1>
        {err ? <p className="error">{err}</p> : null}
        {data && (
          <>
            <div className="card">
              <p className="hero-sub">Simulated wallet</p>
              <div className="hero-balance">{fmt(data.walletBalance)}</div>
              <p className="muted" style={{ marginTop: "0.5rem", marginBottom: 0 }}>
                Campus credit score: <strong>{data.campusCreditScore}</strong>
              </p>
            </div>
            <div className="card">
              <div className="row">
                <span className="muted">Spent (30 days)</span>
                <strong>{fmt(data.totalSpentLast30Days)}</strong>
              </div>
              <h2>By category</h2>
              {data.categoryBreakdown.length === 0 ? (
                <p className="muted">No tagged spends yet.</p>
              ) : (
                <ul className="tx-list">
                  {data.categoryBreakdown.map((c) => (
                    <li key={c.category} className="row">
                      <span>{c.category}</span>
                      <span>{fmt(c.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="card">
              <h2 style={{ marginTop: 0 }}>Recent</h2>
              <ul className="tx-list">
                {data.recentTransactions.map((t) => (
                  <li key={t.id}>
                    <div className="row">
                      <span>
                        {t.direction === "out" ? "Paid" : "Received"} · {t.category}
                        {t.peer ? ` · ${t.peer.name}` : ""}
                      </span>
                      <span className={t.direction === "out" ? "amount-out" : "amount-in"}>
                        {t.direction === "out" ? "−" : "+"}
                        {fmt(t.amount)}
                      </span>
                    </div>
                    {t.note ? <span className="muted">{t.note}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </main>
      <Nav />
    </RequireAuth>
  );
}
