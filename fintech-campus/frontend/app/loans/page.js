"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { Nav } from "@/components/Nav";
import { api } from "@/lib/api";

function fmt(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function LoansPage() {
  const [borrowing, setBorrowing] = useState([]);
  const [lending, setLending] = useState([]);
  const [lenderEmail, setLenderEmail] = useState("");
  const [amount, setAmount] = useState("500");
  const [due, setDue] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const data = await api("/api/loans");
    setBorrowing(data.borrowing);
    setLending(data.lending);
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
          amount: Number(amount),
          repaymentDue: new Date(due).toISOString(),
        }),
      });
      setMsg("Loan request sent.");
      setLenderEmail("");
      await load();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function accept(id) {
    setErr("");
    try {
      await api(`/api/loans/${id}/accept`, { method: "POST", body: JSON.stringify({}) });
      setMsg("Loan accepted & disbursed (simulated).");
      await load();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function reject(id) {
    setErr("");
    try {
      await api(`/api/loans/${id}/reject`, { method: "POST", body: JSON.stringify({}) });
      setMsg("Rejected.");
      await load();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function repay(id) {
    setErr("");
    try {
      await api(`/api/loans/${id}/repay`, { method: "POST", body: JSON.stringify({}) });
      setMsg("Repaid.");
      await load();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  return (
    <RequireAuth>
      <main className="app-main">
        <h1>Campus credit</h1>
        <p className="muted">₹100–₹1,000 micro loans between students. Auto-repay runs when due if wallet has balance.</p>
        {err ? <p className="error">{err}</p> : null}
        {msg ? <p className="pill ok">{msg}</p> : null}
        <form className="card stack" onSubmit={requestLoan}>
          <h2 style={{ marginTop: 0 }}>Request</h2>
          <div>
            <label>Lender email</label>
            <input value={lenderEmail} onChange={(e) => setLenderEmail(e.target.value)} placeholder="neha@campus.demo" />
          </div>
          <div className="grid-2">
            <div>
              <label>Amount</label>
              <input type="number" min="100" max="1000" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <label>Repay by</label>
              <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
          </div>
          <button type="submit">Send request</button>
        </form>
        <h2>Borrowing</h2>
        {borrowing.map((l) => (
          <div key={l.id} className="card row">
            <div>
              <strong>{fmt(l.amount)}</strong>
              <p className="muted" style={{ margin: 0 }}>
                {l.lender?.name || "—"} · {l.status}
              </p>
            </div>
            {l.status === "active" ? (
              <button type="button" onClick={() => repay(l.id)}>
                Repay
              </button>
            ) : (
              <span className="pill">{l.status}</span>
            )}
          </div>
        ))}
        <h2>Lending</h2>
        {lending.map((l) => (
          <div key={l.id} className="card stack">
            <div className="row">
              <div>
                <strong>{fmt(l.amount)}</strong>
                <p className="muted" style={{ margin: 0 }}>
                  {l.borrower?.name} · {l.status}
                </p>
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
            ) : null}
          </div>
        ))}
      </main>
      <Nav />
    </RequireAuth>
  );
}
