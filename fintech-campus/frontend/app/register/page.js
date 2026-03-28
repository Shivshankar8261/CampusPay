"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, setSession } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      const data = await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      setSession(data.token, data.user);
      router.push("/dashboard");
    } catch (e2) {
      setErr(e2.message);
    }
  }

  return (
    <div className="page stack" style={{ paddingTop: "2rem" }}>
      <h1>Sign up</h1>
      <form className="card stack" onSubmit={onSubmit}>
        <div>
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
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
            autoComplete="new-password"
          />
        </div>
        {err ? <p className="error">{err}</p> : null}
        <button type="submit">Create account</button>
        <p className="muted" style={{ textAlign: "center", margin: 0 }}>
          Have an account? <Link href="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
