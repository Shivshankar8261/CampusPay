"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { Nav } from "@/components/Nav";
import { api, getUser } from "@/lib/api";
import { PageIllustration } from "@/components/PageIllustration";

function fmt(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

function daysLeft(due) {
  const now = new Date();
  const d = new Date(due);
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (!Number.isFinite(diff)) return null;
  return diff;
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loans, setLoans] = useState(null);
  const [credit, setCredit] = useState(null);
  const [err, setErr] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  useEffect(() => {
    Promise.all([api("/api/dashboard"), api("/api/loans"), api("/api/credit/score")])
      .then(([d, l, c]) => {
        setData(d);
        setLoans(l);
        setCredit(c);
      })
      .catch((e) => setErr(e.message));
  }, []);

  const score100 = credit?.score100 ?? clamp(Math.round(((data?.campusCreditScore ?? 600) - 300) / 6), 0, 100);
  const band = credit?.band ?? (score100 >= 80 ? "Good" : score100 >= 60 ? "Okay" : "Building");
  const activeBorrow = (loans?.borrowing ?? []).filter((l) => l.status === "active");

  return (
    <RequireAuth>
      <main className="app-main">
        <div className="page-intro">
          <PageIllustration name="dashboard" width={200} height={128} />
          <p className="muted" style={{ marginBottom: "0.2rem" }}>Hey{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</p>
          <h1>Home</h1>
          <p className="muted">Your campus reputation and active loans — simple and structured.</p>
        </div>
        {err ? <p className="error">{err}</p> : null}
        {data && (
          <>
            <div className="card card-wallet">
              <img src="/brand/campuspay-mark.svg" width={48} height={48} alt="" className="card-wallet-deco" />
              <p className="hero-sub">Simulated wallet</p>
              <div className="hero-balance">{fmt(data.walletBalance)}</div>
              <p className="muted" style={{ marginTop: "0.5rem", marginBottom: 0 }}>
                Campus credit score: <strong>{score100}/100</strong> · <span className="pill ok">{band}</span>
              </p>
            </div>
            <div className="card">
              <h2 style={{ marginTop: 0 }}>Active loans</h2>
              {activeBorrow.length === 0 ? (
                <div className="empty-panel">
                  <PageIllustration name="empty" width={180} height={108} />
                  <p className="muted" style={{ margin: 0 }}>No active loans. Borrow only when it’s urgent — repay on time to build your score.</p>
                </div>
              ) : (
                <ul className="tx-list">
                  {activeBorrow.map((l) => {
                    const dl = daysLeft(l.repaymentDue);
                    const label = dl == null ? "Due soon" : dl < 0 ? `Overdue by ${Math.abs(dl)}d` : `Due in ${dl}d`;
                    return (
                      <li key={l.id} className="row">
                        <span>
                          <strong>{fmt(l.amount)}</strong>
                          <span className="muted"> · {label}</span>
                        </span>
                        <span className="pill">{l.status}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="muted" style={{ marginBottom: 0 }}>
                AutoPay is scheduled on due date (simulated). You can “Mark as paid” from Borrow.
              </p>
            </div>
          </>
        )}
      </main>
      <Nav />
    </RequireAuth>
  );
}
