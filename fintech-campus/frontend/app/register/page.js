"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, setSession } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("");
  const [collegeYear, setCollegeYear] = useState("");
  const [upiId, setUpiId] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const data = await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          college: college.trim(),
          collegeYear: collegeYear.trim(),
          upiId: upiId.trim(),
          password,
        }),
      });
      setSession(data.token, data.user);
      router.push("/dashboard");
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page stack auth-page" style={{ paddingTop: "1.25rem" }}>
      <div className="auth-hero">
        <img src="/brand/login-hero.svg" width={320} height={180} alt="" className="auth-hero-img" decoding="async" />
      </div>
      <div className="auth-brand">
        <img src="/brand/campuspay-mark.svg" width={48} height={48} alt="" className="auth-mark" decoding="async" />
        <h1 className="auth-title" style={{ margin: 0 }}>
          Join CampusPay
        </h1>
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        Verified students only — build a campus credit reputation with ₹100 micro-loans.
      </p>
      <form className="card stack" onSubmit={onSubmit}>
        <div>
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
        </div>
        <div>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>Use your college email (demo allowed).</p>
        </div>
        <div className="grid-2">
          <div>
            <label>Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="98xxxxxx" />
          </div>
          <div>
            <label>Year</label>
            <input value={collegeYear} onChange={(e) => setCollegeYear(e.target.value)} placeholder="FY / SY / TY / Final" />
          </div>
        </div>
        <div>
          <label>College</label>
          <input value={college} onChange={(e) => setCollege(e.target.value)} placeholder="Your college name" />
        </div>
        <div>
          <label>UPI ID (simulated)</label>
          <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="name@upi" />
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>We simulate linking for the prototype.</p>
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />
        </div>
        {err ? <p className="error">{err}</p> : null}
        <button type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </button>
        <p className="muted" style={{ textAlign: "center", margin: 0 }}>
          Have an account? <Link href="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
