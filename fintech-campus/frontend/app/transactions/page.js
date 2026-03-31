"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { Nav } from "@/components/Nav";
import { api } from "@/lib/api";
import { CategoryIcon } from "@/components/CategoryIcon";
import { PayHeaderIcon } from "@/components/PayHeaderIcon";
import { PageIllustration } from "@/components/PageIllustration";

const CATS = ["Food", "Travel", "Mess", "Trip", "Books", "Other"];

function fmt(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function TransactionsPage() {
  const [list, setList] = useState([]);
  const [peerEmail, setPeerEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [note, setNote] = useState("");
  const [direction, setDirection] = useState("out");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    const data = await api("/api/transactions");
    setList(data.transactions ?? []);
  }

  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, []);

  async function send(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    const email = peerEmail.trim();
    const amt = Number(amount);
    if (!email) {
      setErr("Enter your friend’s email.");
      return;
    }
    if (!Number.isFinite(amt) || amt < 1) {
      setErr("Enter a valid amount.");
      return;
    }
    setSending(true);
    try {
      await api("/api/transactions/simulate-upi", {
        method: "POST",
        body: JSON.stringify({
          peerEmail: email,
          amount: amt,
          category,
          note,
          direction,
        }),
      });
      setMsg("Done — balances updated (simulated UPI).");
      setAmount("");
      setNote("");
      await load();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <RequireAuth>
      <main className="app-main">
        <div className="page-intro">
          <PageIllustration name="pay" width={200} height={128} />
          <h1>Smart payments</h1>
          <p className="muted">Pay batchmates, tag canteen or mess — like UPI, but built for campus.</p>
          <div style={{ display: "flex", justifyContent: "center", marginTop: "0.35rem" }}>
            <div className="page-header-icon-wrap">
              <PayHeaderIcon size={28} />
            </div>
          </div>
        </div>
        <form className="card stack" onSubmit={send}>
          <div>
            <label>Friend&apos;s email</label>
            <input
              value={peerEmail}
              onChange={(e) => setPeerEmail(e.target.value)}
              placeholder="arjun@campus.demo"
              autoComplete="email"
              required
            />
          </div>
          <div className="grid-2">
            <div>
              <label>Amount (₹)</label>
              <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div>
              <label>Direction</label>
              <select value={direction} onChange={(e) => setDirection(e.target.value)}>
                <option value="out">You pay</option>
                <option value="in">You receive</option>
              </select>
            </div>
          </div>
          <div>
            <label>Category</label>
            <div className="category-select-row">
              <CategoryIcon category={category} size={32} />
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="category-select">
                {CATS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label>Note (optional)</label>
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Canteen, cab share…" />
          </div>
          {err ? <p className="error">{err}</p> : null}
          {msg ? <p className="pill ok">{msg}</p> : null}
          <button type="submit" disabled={sending}>
            {sending ? "Processing…" : "Simulate UPI"}
          </button>
        </form>
        <h2>All transactions</h2>
        <div className="card">
          {list.length === 0 ? (
            <div className="empty-panel" style={{ padding: "0.5rem 0" }}>
              <PageIllustration name="empty" width={160} height={96} />
              <p className="muted" style={{ margin: 0 }}>Your history will show up here after your first payment.</p>
            </div>
          ) : (
            <ul className="tx-list">
              {list.map((t) => (
                <li key={t.id}>
                  <div className="row row-cat">
                    <span className="row-cat-label">
                      <CategoryIcon category={t.category} size={26} />
                      <span>
                        {t.direction === "out" ? "Out" : "In"} · {t.category}
                        {t.peer ? ` · ${t.peer.name}` : ""}
                      </span>
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
          )}
        </div>
      </main>
      <Nav />
    </RequireAuth>
  );
}
