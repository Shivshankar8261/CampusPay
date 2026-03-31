"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { Nav } from "@/components/Nav";
import { api } from "@/lib/api";
import { PageIllustration } from "@/components/PageIllustration";

function fmt(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

function scoreColor(score) {
  if (score >= 780) return "ok";
  if (score >= 700) return "ok";
  if (score >= 620) return "";
  return "warn";
}

function localNoonIso(dateStr) {
  if (!dateStr) return new Date().toISOString();
  return new Date(`${dateStr}T12:00:00`).toISOString();
}

export default function LoansPage() {
  const [borrowing, setBorrowing] = useState([]);
  const [lending, setLending] = useState([]);
  const [lenderEmail, setLenderEmail] = useState("");
  const [guarantorEmail, setGuarantorEmail] = useState("");
  const [amount, setAmount] = useState("500");
  const [due, setDue] = useState("");
  const [autopayEnabled, setAutopayEnabled] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [credit, setCredit] = useState(null);
  const [scoreOpen, setScoreOpen] = useState(false);

  async function load() {
    const [data, c] = await Promise.all([api("/api/loans"), api("/api/credit/score")]);
    setBorrowing(data.borrowing ?? []);
    setLending(data.lending ?? []);
    setCredit(c);
  }

  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    setDue(d.toISOString().slice(0, 10));
    load().catch((e) => setErr(e.message));
  }, []);

  async function requestLoan(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await api("/api/loans/request", {
        method: "POST",
        body: JSON.stringify({
          lenderEmail: lenderEmail.trim(),
          guarantorEmail: guarantorEmail.trim() || undefined,
          amount: Number(amount),
          repaymentDue: localNoonIso(due),
          autopayEnabled,
        }),
      });
      setMsg("Loan request sent. Tip: adding a guarantor can increase trust in your campus network.");
      setLenderEmail("");
      setGuarantorEmail("");
      await load();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function accept(id) {
    setErr("");
    try {
      await api(`/api/loans/${id}/accept`, { method: "POST", body: JSON.stringify({}) });
      setMsg("Loan accepted & sent to their wallet (simulated).");
      await load();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function reject(id) {
    setErr("");
    try {
      await api(`/api/loans/${id}/reject`, { method: "POST", body: JSON.stringify({}) });
      setMsg("Request declined.");
      await load();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function repay(id) {
    setErr("");
    try {
      await api(`/api/loans/${id}/repay`, { method: "POST", body: JSON.stringify({}) });
      setMsg("Repaid — nice! Your Campus Credit Score recalculates from real behavior.");
      await load();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  const score = credit?.score ?? 600;
  const pct = clamp((score - 300) / 600, 0, 1);

  return (
    <RequireAuth>
      <main className="app-main">
        <div className="page-intro">
          <PageIllustration name="credit" width={200} height={128} />
          <h1>Campus credit</h1>
          <p className="muted">
            ₹100–₹1,000 between verified students. Your <strong>Campus Credit Score</strong> grows from on-time repayments, streaks, and trust — not salary history.
          </p>
        </div>

        <div className="card stack" style={{ marginBottom: "0.75rem" }}>
          <div className="row">
            <div>
              <p className="muted" style={{ margin: 0, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Campus Credit Score
              </p>
              <div className="row" style={{ gap: "0.6rem", alignItems: "baseline" }}>
                <div className="hero-balance" style={{ fontSize: "2.25rem" }}>{score}</div>
                <span className={`pill ${scoreColor(score)}`}>{credit?.band ?? "Building"}</span>
              </div>
              <p className="muted" style={{ margin: 0 }}>
                Verification: <strong>{credit?.signals?.verificationLevel ?? "email"}</strong> • On-time streak:{" "}
                <strong>{credit?.signals?.onTimeStreak ?? 0}</strong>
              </p>
            </div>
            <button type="button" className="secondary" onClick={() => setScoreOpen((s) => !s)}>
              {scoreOpen ? "Hide" : "Why this score?"}
            </button>
          </div>

          <div className="progress" aria-hidden>
            <div style={{ width: `${pct * 100}%` }} />
          </div>

          {scoreOpen ? (
            <div className="stack">
              <p className="muted" style={{ margin: 0 }}>
                This score is an <strong>alternative credit reputation</strong> for students. It weighs multiple signals together — a recent default can outweigh several old repayments.
              </p>
              <div className="grid-2">
                {(credit?.breakdown ?? []).slice(0, 6).map((b) => (
                  <div key={b.key} className="card" style={{ margin: 0, padding: "0.8rem" }}>
                    <div className="row">
                      <strong style={{ fontSize: "0.92rem" }}>{b.label}</strong>
                      <span className={`pill ${b.points < 0 ? "warn" : "ok"}`}>
                        {b.points >= 0 ? `+${b.points}` : `${b.points}`}
                      </span>
                    </div>
                    <p className="muted" style={{ margin: "0.35rem 0 0" }}>
                      Live signal from your activity (repayments, streak, verification, engagement).
                    </p>
                  </div>
                ))}
              </div>
              <details className="auth-demo-details">
                <summary>See all factors we consider</summary>
                <div className="card" style={{ marginTop: "0.6rem" }}>
                  <ul className="tx-list">
                    <li><strong>Repayment history</strong> (highest weight): on-time vs late vs default.</li>
                    <li><strong>Repayment streak</strong>: consecutive on-time repayments compound trust.</li>
                    <li><strong>Loan amount vs repayment ratio</strong>: partial patterns reduce score.</li>
                    <li><strong>Borrowing frequency</strong>: recurring month-end dependency is weighted cautiously.</li>
                    <li><strong>Social guarantor behaviour</strong>: guaranteeing defaults causes a soft score hit.</li>
                    <li><strong>Verification level</strong>: email + phone + student ID increases base trust.</li>
                    <li><strong>Engagement</strong>: using pools/payments/budgeting signals awareness.</li>
                    <li><strong>Peer trust</strong>: trust lightly propagates through your campus network.</li>
                    <li><strong>Account age</strong>: limits improve as trust is earned over time.</li>
                    <li><strong>Defaults/disputes</strong>: heavy negative impact.</li>
                  </ul>
                </div>
              </details>
            </div>
          ) : null}
        </div>

        {err ? <p className="error">{err}</p> : null}
        {msg ? <p className="pill ok">{msg}</p> : null}
        <form className="card stack" onSubmit={requestLoan}>
          <h2 style={{ marginTop: 0 }}>Request a micro‑loan (₹100–₹1,000)</h2>
          <p className="muted" style={{ marginTop: "-0.25rem" }}>
            Best for: textbooks, month‑end food, last‑mile travel. Keep it short-term and repay on time.
          </p>
          <div>
            <label>Friend&apos;s email</label>
            <input value={lenderEmail} onChange={(e) => setLenderEmail(e.target.value)} placeholder="neha@campus.demo" required />
          </div>
          <div>
            <label>Optional: social guarantor (friend who vouches)</label>
            <input value={guarantorEmail} onChange={(e) => setGuarantorEmail(e.target.value)} placeholder="arjun@campus.demo" />
            <p className="muted" style={{ margin: "0.35rem 0 0" }}>
              If you default and don&apos;t have funds, the guarantor may be auto-charged (simulated) — so only add someone you trust.
            </p>
          </div>
          <div className="grid-2">
            <div>
              <label>Amount (₹)</label>
              <input type="number" min="100" max="1000" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div>
              <label>Repay by</label>
              <input type="date" value={due} onChange={(e) => setDue(e.target.value)} required />
            </div>
          </div>
          <div className="row">
            <label style={{ margin: 0 }}>UPI AutoPay (simulated)</label>
            <button type="button" className="secondary" onClick={() => setAutopayEnabled((v) => !v)}>
              {autopayEnabled ? "Enabled" : "Disabled"}
            </button>
          </div>
          <button type="submit">Send request</button>
        </form>
        <h2>Borrowing</h2>
        {borrowing.length === 0 ? (
          <div className="card empty-panel">
            <PageIllustration name="empty" width={160} height={96} />
            <p className="muted" style={{ margin: 0 }}>No active requests. Ask a trusted friend when you&apos;re short before month-end.</p>
          </div>
        ) : (
          borrowing.map((l) => (
            <div key={l.id} className="card row">
              <div>
                <strong>{fmt(l.amount)}</strong>
                <p className="muted" style={{ margin: 0 }}>{l.lender?.name || "—"}</p>
              </div>
              {l.status === "active" ? (
                <button type="button" onClick={() => repay(l.id)}>
                  Repay
                </button>
              ) : (
                <span className="pill">{l.status}</span>
              )}
            </div>
          ))
        )}
        <h2>Lending</h2>
        {lending.length === 0 ? (
          <div className="card empty-panel">
            <PageIllustration name="credit" width={160} height={102} />
            <p className="muted" style={{ margin: 0 }}>Nobody&apos;s asked yet. Help your batch when you can — it builds trust.</p>
          </div>
        ) : (
          lending.map((l) => (
            <div key={l.id} className="card stack">
              <div className="row">
                <div>
                  <strong>{fmt(l.amount)}</strong>
                  <p className="muted" style={{ margin: 0 }}>{l.borrower?.name ?? "Friend"}</p>
                </div>
              </div>
              {l.status === "pending" ? (
                <div className="row">
                  <button type="button" onClick={() => accept(l.id)}>
                    Accept
                  </button>
                  <button type="button" className="danger secondary" onClick={() => reject(l.id)}>
                    Reject
                  </button>
                </div>
              ) : (
                <span className="pill">{l.status}</span>
              )}
            </div>
          ))
        )}
      </main>
      <Nav />
    </RequireAuth>
  );
}
