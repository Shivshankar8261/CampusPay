"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { Nav } from "@/components/Nav";
import { api } from "@/lib/api";

function fmt(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("16000");
  const [code, setCode] = useState("");
  const [contrib, setContrib] = useState({});
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const data = await api("/api/groups");
    setGroups(data.groups);
  }

  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, []);

  async function createPool(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await api("/api/groups", {
        method: "POST",
        body: JSON.stringify({ name, targetAmount: Number(target) }),
      });
      setMsg("Pool created. Share the invite code from the list.");
      setName("");
      await load();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function join(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await api("/api/groups/join", { method: "POST", body: JSON.stringify({ inviteCode: code }) });
      setMsg("Joined pool.");
      setCode("");
      await load();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function contribute(groupId) {
    const amt = Number(contrib[groupId]);
    if (!amt) return;
    setErr("");
    setMsg("");
    try {
      await api(`/api/groups/${groupId}/contribute`, {
        method: "POST",
        body: JSON.stringify({ amount: amt }),
      });
      setMsg("Contribution recorded.");
      setContrib((c) => ({ ...c, [groupId]: "" }));
      await load();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  return (
    <RequireAuth>
      <main className="app-main">
        <h1>Group pools</h1>
        <p className="muted">Trip funds, mess prepay — shared targets with progress.</p>
        {err ? <p className="error">{err}</p> : null}
        {msg ? <p className="pill ok">{msg}</p> : null}
        <form className="card stack" onSubmit={createPool}>
          <h2 style={{ marginTop: 0 }}>New pool</h2>
          <div>
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Goa Trip" />
          </div>
          <div>
            <label>Target (₹)</label>
            <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
          </div>
          <button type="submit">Create</button>
        </form>
        <form className="card stack" onSubmit={join}>
          <h2 style={{ marginTop: 0 }}>Join with code</h2>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="GOA2026" />
          <button type="submit" className="secondary">
            Join pool
          </button>
        </form>
        <h2>Your pools</h2>
        {groups.map((g) => (
          <div key={g.id} className="card stack">
            <div className="row">
              <strong>{g.name}</strong>
              <span className={g.status === "ready" ? "pill ok" : "pill"}>{g.status === "ready" ? "Ready" : "Collecting"}</span>
            </div>
            <p className="muted" style={{ margin: 0 }}>
              Code: <strong>{g.inviteCode}</strong>
            </p>
            <div className="progress">
              <div style={{ width: `${g.progress}%` }} />
            </div>
            <div className="row">
              <span className="muted">Collected</span>
              <span>
                {fmt(g.collected)} / {fmt(g.targetAmount)}
              </span>
            </div>
            <p className="muted" style={{ margin: 0 }}>
              Members: {g.members.map((m) => m.name).join(", ")}
            </p>
            <div className="row" style={{ marginTop: "0.5rem" }}>
              <input
                type="number"
                min="1"
                placeholder="Add ₹"
                value={contrib[g.id] || ""}
                onChange={(e) => setContrib((c) => ({ ...c, [g.id]: e.target.value }))}
                style={{ flex: 1 }}
              />
              <button type="button" onClick={() => contribute(g.id)} disabled={g.status === "ready"}>
                Contribute
              </button>
            </div>
          </div>
        ))}
      </main>
      <Nav />
    </RequireAuth>
  );
}
