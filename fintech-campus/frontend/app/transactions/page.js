"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { Nav } from "@/components/Nav";
import { api } from "@/lib/api";

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

  async function load() {
    const data = await api("/api/transactions");
    setList(data.transactions);
  }

  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, []);

  async function send(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await api("/api/transactions/simulate-upi", {
        method: "POST",
        body: JSON.stringify({
          peerEmail: peerEmail.trim(),
          amount: Number(amount),
          category,
          note,
          direction,
        }),
      });
      setMsg("UPI simulation complete.");
      setAmount("");
      setNote("");
      await load();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  return (
    <RequireAuth>
      <main className="app-main">
        <h1>Smart payments</h1>
        <p className="muted">Simulated UPI — pick a friend by email, tag the spend.</p>
        <form className="card stack" onSubmit={send}>
          <div>
            <label>Peer email</label>
            <input value={peerEmail} onChange={(e) => setPeerEmail(e.target.value)} placeholder="arjun@campus.demo" />
          </div>
          <div className="grid-2">
            <div>
              <label>Amount (₹)</label>
              <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
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
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Note</label>
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {err ? <p className="error">{err}</p> : null}
          {msg ? <p className="pill ok">{msg}</p> : null}
          <button type="submit">Simulate UPI</button>
        </form>
        <h2>All transactions</h2>
        <div className="card">
          <ul className="tx-list">
            {list.map((t) => (
              <li key={t.id}>
                <div className="row">
                  <span>
                    {t.direction === "out" ? "Out" : "In"} · {t.category}
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
      </main>
      <Nav />
    </RequireAuth>
  );
}
