"use client";

import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { Nav } from "@/components/Nav";
import { api } from "@/lib/api";
import { PageIllustration } from "@/components/PageIllustration";

function fmt(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function statusLabel(s) {
  if (s === "repaid") return { text: "Paid", pill: "ok" };
  if (s === "defaulted") return { text: "Overdue", pill: "warn" };
  if (s === "active") return { text: "Pending", pill: "" };
  if (s === "pending") return { text: "Requested", pill: "" };
  if (s === "rejected") return { text: "Rejected", pill: "warn" };
  return { text: s, pill: "" };
}

export default function HistoryPage() {
  const [borrowing, setBorrowing] = useState([]);
  const [lending, setLending] = useState([]);
  const [err, setErr] = useState("");

  async function load() {
    const data = await api("/api/loans");
    setBorrowing(data.borrowing ?? []);
    setLending(data.lending ?? []);
  }

  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, []);

  const items = useMemo(() => {
    const b = borrowing.map((l) => ({ ...l, side: "Borrowed", peer: l.lender?.name || l.lender?.email || "Friend" }));
    const f = lending.map((l) => ({ ...l, side: "Lent", peer: l.borrower?.name || l.borrower?.email || "Friend" }));
    return [...b, ...f].sort((a, b2) => String(b2.id).localeCompare(String(a.id)));
  }, [borrowing, lending]);

  return (
    <RequireAuth>
      <main className="app-main">
        <div className="page-intro">
          <PageIllustration name="transactions" width={200} height={128} />
          <h1>History</h1>
          <p className="muted">A clean record of your campus loans — builds credibility.</p>
        </div>

        {err ? <p className="error">{err}</p> : null}

        <div className="card">
          {items.length === 0 ? (
            <div className="empty-panel" style={{ padding: "0.5rem 0" }}>
              <PageIllustration name="empty" width={160} height={96} />
              <p className="muted" style={{ margin: 0 }}>Your loan history will show up here after your first request or lend.</p>
            </div>
          ) : (
            <ul className="tx-list">
              {items.map((l) => {
                const s = statusLabel(l.status);
                return (
                  <li key={`${l.side}-${l.id}`} className="row" style={{ alignItems: "flex-start" }}>
                    <div>
                      <strong>{l.side}</strong>
                      <div className="muted" style={{ marginTop: "0.15rem" }}>
                        {fmt(l.amount)} · {l.peer}
                      </div>
                    </div>
                    <span className={`pill ${s.pill}`}>{s.text}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
      <Nav />
    </RequireAuth>
  );
}

