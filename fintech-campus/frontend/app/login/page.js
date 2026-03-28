"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, setSession } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setSession(data.token, data.user);
      router.push("/dashboard");
    } catch (e2) {
      setErr(e2.message);
    }
  }

  return (
    <div className="page stack" style={{ paddingTop: "2.5rem" }}>
      <div>
        <h1 style={{ fontSize: "1.75rem" }}>CampusPay</h1>
        <p className="muted">Pocket money, shared pools, campus credit — built for college in India.</p>
      </div>
      <form className="card stack" onSubmit={onSubmit}>
        <div>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {err ? <p className="error">{err}</p> : null}
        <button type="submit">Log in</button>
        <p className="muted" style={{ textAlign: "center", margin: 0 }}>
          New here? <Link href="/register">Create account</Link>
        </p>
      </form>
      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Demo after seed: <strong>riya@campus.demo</strong> / <strong>demo1234</strong>
      </p>
    </div>
  );
}
