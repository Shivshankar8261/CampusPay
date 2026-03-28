"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { Nav } from "@/components/Nav";
import { api, setSession, getToken } from "@/lib/api";

function fmt(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [parent, setParent] = useState(null);
  const [parentErr, setParentErr] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    api("/api/me")
      .then(setMe)
      .catch((e) => setErr(e.message));
  }, []);

  async function toggleParent() {
    if (!me) return;
    setParentErr("");
    try {
      const u = await api("/api/me", {
        method: "PATCH",
        body: JSON.stringify({ parentTransparencyEnabled: !me.parentTransparencyEnabled }),
      });
      setMe(u);
      setSession(getToken(), u);
      setParent(null);
    } catch (e) {
      setParentErr(e.message);
    }
  }

  async function loadParentSummary() {
    setParentErr("");
    try {
      const s = await api("/api/parent/summary");
      setParent(s);
    } catch (e) {
      setParent(null);
      setParentErr(e.message);
    }
  }

  function logout() {
    setSession(null, null);
    router.replace("/login");
  }

  return (
    <RequireAuth>
      <main className="app-main">
        <h1>Profile</h1>
        {err ? <p className="error">{err}</p> : null}
        {me && (
          <>
            <div className="card stack">
              <div className="row">
                <span className="muted">Name</span>
                <strong>{me.name}</strong>
              </div>
              <div className="row">
                <span className="muted">Email</span>
                <span>{me.email}</span>
              </div>
              <div className="row">
                <span className="muted">Wallet</span>
                <strong>{fmt(me.walletBalance)}</strong>
              </div>
              <div className="row">
                <span className="muted">Campus credit score</span>
                <span className="pill ok">{me.campusCreditScore}</span>
              </div>
            </div>
            <div className="card stack">
              <h2 style={{ marginTop: 0 }}>Parent transparency</h2>
              <p className="muted" style={{ margin: 0 }}>
                When on, you can open a weekly summary with totals and categories only — no individual transactions.
              </p>
              <button type="button" className="secondary" onClick={toggleParent}>
                {me.parentTransparencyEnabled ? "Turn off sharing mode" : "Turn on sharing mode"}
              </button>
              {me.parentTransparencyEnabled ? (
                <>
                  <button type="button" onClick={loadParentSummary}>
                    Preview parent weekly summary
                  </button>
                  {parentErr ? <p className="error">{parentErr}</p> : null}
                  {parent && (
                    <div className="stack" style={{ marginTop: "0.5rem" }}>
                      <p className="muted" style={{ margin: 0 }}>
                        {parent.note}
                      </p>
                      <div className="row">
                        <span>Total spent</span>
                        <strong>{fmt(parent.totalSpent)}</strong>
                      </div>
                      <ul className="tx-list">
                        {Object.entries(parent.byCategory || {}).map(([k, v]) => (
                          <li key={k} className="row">
                            <span>{k}</span>
                            <span>{fmt(v)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : null}
            </div>
            <button type="button" className="secondary" onClick={logout} style={{ width: "100%" }}>
              Log out
            </button>
          </>
        )}
      </main>
      <Nav />
    </RequireAuth>
  );
}
