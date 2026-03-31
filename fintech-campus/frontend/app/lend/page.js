"use client";

import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { Nav } from "@/components/Nav";
import { api } from "@/lib/api";
import { PageIllustration } from "@/components/PageIllustration";

function fmt(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function daysLeft(due) {
  const now = new Date();
  const d = new Date(due);
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (!Number.isFinite(diff)) return null;
  return diff;
}

export default function LendPage() {
  const [lending, setLending] = useState([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const data = await api("/api/loans");
    setLending(data.lending ?? []);
  }

  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, []);

  async function accept(id) {
    setErr("");
    setMsg("");
    try {
      await api(`/api/loans/${id}/accept`, { method: "POST", body: JSON.stringify({}) });
      setMsg("Accepted. Money sent to their wallet (simulated). Repayment AutoPay scheduled (simulated).");
      await load();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function reject(id) {
    setErr("");
    setMsg("");
    try {
      await api(`/api/loans/${id}/reject`, { method: "POST", body: JSON.stringify({}) });
      setMsg("Request rejected.");
      await load();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  const pending = useMemo(() => lending.filter((l) => l.status === "pending"), [lending]);
  const active = useMemo(() => lending.filter((l) => l.status === "active"), [lending]);

  return (
    <RequireAuth>
      <main className="app-main">
        <div className="page-intro">
          <PageIllustration name="groups" width={200} height={128} />
          <h1>Lend</h1>
          <p className="muted">
            Incoming requests from your campus network. Accept only if you trust them — their score will reward on-time repayment.
          </p>
        </div>

        {err ? <p className="error">{err}</p> : null}
        {msg ? <p className="pill ok">{msg}</p> : null}

        <h2>Incoming requests</h2>
        {pending.length === 0 ? (
          <div className="card empty-panel">
            <PageIllustration name="empty" width={160} height={96} />
            <p className="muted" style={{ margin: 0 }}>
              No requests right now. When someone requests from you, it will show up here.
            </p>
          </div>
        ) : (
          pending.map((l) => (
            <div key={l.id} className="card stack">
              <div className="row">
                <div>
                  <strong>{fmt(l.amount)}</strong>
                  <p className="muted" style={{ margin: 0 }}>{l.borrower?.name ?? "Friend"}</p>
                </div>
                <span className="pill">pending</span>
              </div>
              <div className="row">
                <button type="button" onClick={() => accept(l.id)}>Accept</button>
                <button type="button" className="danger secondary" onClick={() => reject(l.id)}>Reject</button>
              </div>
            </div>
          ))
        )}

        <h2>Active loans you funded</h2>
        {active.length === 0 ? (
          <div className="card empty-panel">
            <p className="muted" style={{ margin: 0 }}>No active lending right now.</p>
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
                    {label} · {l.borrower?.name ?? "Friend"}
                  </p>
                </div>
                <span className="pill">{l.status}</span>
              </div>
            );
          })
        )}
      </main>
      <Nav />
    </RequireAuth>
  );
}

