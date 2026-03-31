"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { Nav } from "@/components/Nav";
import { api } from "@/lib/api";
import { PageIllustration, PoolCardThumbnail } from "@/components/PageIllustration";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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
    setGroups(data.groups ?? []);
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
      setMsg("Pool created — share the invite code below!");
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
      setMsg("You're in the pool!");
      setCode("");
      await load();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function contribute(groupId) {
    const amt = Number(contrib[groupId]);
    if (!amt || amt < 1) {
      setErr("Enter an amount to contribute.");
      return;
    }
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
        <div className="page-intro">
          <PageIllustration name="pools" width={200} height={128} />
          <h1>Group pools</h1>
          <p className="muted">Trips, fests, batch gifts — chip in together and hit the target.</p>
        </div>
        {err ? <p className="error">{err}</p> : null}
        {msg ? <p className="pill ok">{msg}</p> : null}
        <Card>
          <CardContent className="stack" style={{ padding: "1rem 0.9rem 0.95rem" }}>
            <form onSubmit={createPool} className="stack">
              <h2 style={{ marginTop: 0 }}>Start a pool</h2>
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Goa trip, fest stall…" required />
              </div>
              <div>
                <Label>Target (₹)</Label>
                <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} min="1" required />
              </div>
              <Button type="submit">Create pool</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="stack" style={{ padding: "1rem 0.9rem 0.95rem" }}>
            <form onSubmit={join} className="stack">
              <h2 style={{ marginTop: 0 }}>Join with code</h2>
              <Label>Invite code</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. GOA2026" />
              <Button type="submit" variant="secondary">
                Join pool
              </Button>
            </form>
          </CardContent>
        </Card>
        <h2>Your pools</h2>
        {groups.length === 0 ? (
          <div className="card empty-panel">
            <PageIllustration name="pools" width={180} height={115} />
            <p className="muted" style={{ margin: 0 }}>
              No pools yet. Create one or join friends with their code.
            </p>
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.id} className="card pool-card">
              <div className="pool-card-head">
                <PoolCardThumbnail />
                <div className="pool-card-body stack">
                  <div className="row">
                    <strong>{g.name}</strong>
                    {g.status === "ready" ? <Badge>Ready 🎉</Badge> : <Badge variant="secondary">Collecting</Badge>}
                  </div>
                  <p className="muted" style={{ margin: 0 }}>
                    Code: <strong>{g.inviteCode}</strong>
                  </p>
                  <Progress value={g.progress} />
                  <div className="row">
                    <span className="muted">Collected</span>
                    <span>
                      {fmt(g.collected)} / {fmt(g.targetAmount)}
                    </span>
                  </div>
                  <p className="muted" style={{ margin: 0 }}>
                    Squad:{" "}
                    {(g.members ?? [])
                      .filter((m) => m?.name)
                      .map((m) => m.name)
                      .join(", ") || "Just you"}
                  </p>
                  <div className="row" style={{ marginTop: "0.5rem" }}>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Add ₹"
                      value={contrib[g.id] || ""}
                      onChange={(e) => setContrib((c) => ({ ...c, [g.id]: e.target.value }))}
                      className="flex-1"
                    />
                    <Button type="button" onClick={() => contribute(g.id)} disabled={g.status === "ready"}>
                      Contribute
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </main>
      <Nav />
    </RequireAuth>
  );
}
