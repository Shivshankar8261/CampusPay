"use client";

import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { Nav } from "@/components/Nav";
import { api } from "@/lib/api";
import { PageIllustration } from "@/components/PageIllustration";

function fmt(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function localNoonIso(dateStr) {
  if (!dateStr) return new Date().toISOString();
  return new Date(`${dateStr}T12:00:00`).toISOString();
}

function daysLeft(due) {
  const now = new Date();
  const d = new Date(due);
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (!Number.isFinite(diff)) return null;
  return diff;
}

export default function BorrowPage() {
  const [borrowing, setBorrowing] = useState([]);
  const [lenderEmail, setLenderEmail] = useState("");
  const [guarantorEmail, setGuarantorEmail] = useState("");
  const [amount, setAmount] = useState("300");
  const [due, setDue] = useState("");
  const [autopayEnabled, setAutopayEnabled] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const data = await api("/api/loans");
    setBorrowing(data.borrowing ?? []);
  }

  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setDue(d.toISOString().slice(0, 10));
    load().catch((e) => setErr(e.message));
  }, []);

  const amountNum = Number(amount);
  const needsGuarantor = Number.isFinite(amountNum) && amountNum > 500;

  async function requestLoan(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      if (needsGuarantor && !guarantorEmail.trim()) {
        setErr("For loans above ₹500, add a social guarantor (as per campus trust rules).");
        return;
      }
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
      setMsg("Request sent. If accepted, AutoPay will be scheduled for the due date (simulated).");
      setLenderEmail("");
      setGuarantorEmail("");
      await load();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function repay(id) {
    setErr("");
    setMsg("");
    try {
      await api(`/api/loans/${id}/repay`, { method: "POST", body: JSON.stringify({}) });
      setMsg("Marked as paid (simulated repayment). Your score updates from behavior.");
      await load();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  const active = useMemo(() => borrowing.filter((l) => l.status === "active"), [borrowing]);

  return (
    <RequireAuth>
      <main className="app-main">
        <div className="page-intro">
          <PageIllustration name="pay" width={200} height={128} />
          <h1>Borrow</h1>
          <p className="muted">
            Borrow ₹100–₹1,000 from verified peers inside your campus. Pick a date — AutoPay is scheduled (simulated).
          </p>
        </div>

        {err ? <p className="error">{err}</p> : null}
        {msg ? <p className="pill ok">{msg}</p> : null}

        <form className="card stack" onSubmit={requestLoan}>
          <h2 style={{ marginTop: 0 }}>Request money</h2>
          <div className="grid-2">
            <div>
              <label>Amount (₹)</label>
              <input
                type="number"
                min="100"
                max="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              {needsGuarantor ? <p className="muted" style={{ margin: "0.35rem 0 0" }}>Guarantor required above ₹500.</p> : null}
            </div>
            <div>
              <label>Repay by</label>
              <input type="date" value={due} onChange={(e) => setDue(e.target.value)} required />
            </div>
          </div>
          <div>
            <label>Select friend (lender email)</label>
            <input value={lenderEmail} onChange={(e) => setLenderEmail(e.target.value)} placeholder="neha@campus.demo" required />
          </div>
          <div>
            <label>Social guarantor (friend who vouches)</label>
            <input value={guarantorEmail} onChange={(e) => setGuarantorEmail(e.target.value)} placeholder="arjun@campus.demo" />
          </div>
          <div className="row">
            <label style={{ margin: 0 }}>UPI AutoPay (simulated)</label>
            <button type="button" className="secondary" onClick={() => setAutopayEnabled((v) => !v)}>
              {autopayEnabled ? "Enabled" : "Disabled"}
            </button>
          </div>
          <button type="submit">Send request</button>
        </form>

        <h2>Active loans</h2>
        {active.length === 0 ? (
          <div className="card empty-panel">
            <PageIllustration name="empty" width={160} height={96} />
            <p className="muted" style={{ margin: 0 }}>
              No active loans. Borrow only when it&apos;s urgent — repaying on time builds your campus reputation.
            </p>
          </div>
        ) : (
          active.map((l) => {
            const dl = daysLeft(l.repaymentDue);
            const label = dl == null ? "Due soon" : dl < 0 ? `Overdue by ${Math.abs(dl)}d` : `Due in ${dl}d`;
            return (
              <div key={l.id} className="card row">
                <div>
                  <strong>{fmt(l.amount)}</strong>
                  <p className="muted" style={{ margin: 0 }}>
                    {label} · {l.lender?.name || "Friend"}
                  </p>
                </div>
                <button type="button" onClick={() => repay(l.id)}>
                  Mark as paid
                </button>
              </div>
            );
          })
        )}
      </main>
      <Nav />
    </RequireAuth>
  );
}

