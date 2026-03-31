"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { Nav } from "@/components/Nav";
import { api, setSession, getToken } from "@/lib/api";
import { PageIllustration } from "@/components/PageIllustration";

function fmt(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [parent, setParent] = useState(null);
  const [parentErr, setParentErr] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [form, setForm] = useState({ phone: "", college: "", collegeYear: "", upiId: "" });

  useEffect(() => {
    api("/api/me")
      .then((u) => {
        setMe(u);
        setForm({
          phone: u.phone || "",
          college: u.college || "",
          collegeYear: u.collegeYear || "",
          upiId: u.upiId || "",
        });
      })
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

  async function saveProfile() {
    if (!me) return;
    setSaving(true);
    setSaveMsg("");
    setErr("");
    try {
      const u = await api("/api/me", {
        method: "PATCH",
        body: JSON.stringify({
          phone: form.phone,
          college: form.college,
          collegeYear: form.collegeYear,
          upiId: form.upiId,
        }),
      });
      setMe(u);
      setSession(getToken(), u);
      setSaveMsg("Saved.");
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
      window.setTimeout(() => setSaveMsg(""), 1200);
    }
  }

  async function toggleVerification(key) {
    if (!me) return;
    setErr("");
    try {
      const next = !(me.verification?.[key] ?? false);
      const u = await api("/api/me", {
        method: "PATCH",
        body: JSON.stringify({ verification: { [key]: next } }),
      });
      setMe(u);
      setSession(getToken(), u);
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <RequireAuth>
      <main className="app-main">
        <div className="page-intro" style={{ marginBottom: "0.75rem" }}>
          <PageIllustration name="dashboard" width={160} height={102} />
          <div className="page-header-with-icon page-header-with-icon--center" style={{ marginBottom: 0, justifyContent: "center" }}>
            <img src="/brand/campuspay-mark.svg" width={44} height={44} alt="" className="auth-mark" decoding="async" />
            <h1 style={{ margin: 0 }}>You</h1>
          </div>
          <p className="muted" style={{ marginBottom: 0 }}>Verification + profile — unlock more trust inside your campus network.</p>
        </div>
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
              <h2 style={{ marginTop: 0 }}>Verification</h2>
              <p className="muted" style={{ margin: 0 }}>
                This is a closed campus network. Higher verification increases your base trust.
              </p>
              <div className="row">
                <span>College email</span>
                <span className="pill ok">Verified</span>
              </div>
              <div className="row">
                <span>Phone verification (simulated)</span>
                <button type="button" className="secondary" onClick={() => toggleVerification("phoneVerified")}>
                  {me.verification?.phoneVerified ? "Verified" : "Verify"}
                </button>
              </div>
              <div className="row">
                <span>Student ID (simulated)</span>
                <button type="button" className="secondary" onClick={() => toggleVerification("studentIdVerified")}>
                  {me.verification?.studentIdVerified ? "Verified" : "Upload ID"}
                </button>
              </div>
            </div>

            <div className="card stack">
              <h2 style={{ marginTop: 0 }}>Campus profile</h2>
              <div className="grid-2">
                <div>
                  <label>Phone</label>
                  <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label>Year</label>
                  <input value={form.collegeYear} onChange={(e) => setForm((f) => ({ ...f, collegeYear: e.target.value }))} />
                </div>
              </div>
              <div>
                <label>College</label>
                <input value={form.college} onChange={(e) => setForm((f) => ({ ...f, college: e.target.value }))} />
              </div>
              <div>
                <label>UPI ID (simulated)</label>
                <input value={form.upiId} onChange={(e) => setForm((f) => ({ ...f, upiId: e.target.value }))} placeholder="name@upi" />
              </div>
              <div className="row">
                <button type="button" onClick={saveProfile} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </button>
                {saveMsg ? <span className="pill ok">{saveMsg}</span> : null}
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
