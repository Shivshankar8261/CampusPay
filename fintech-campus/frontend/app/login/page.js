"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { api, setSession } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const DEMO_PASSWORD = "demo1234";

const DEMO_ACCOUNTS = [
  { email: "riya@campus.demo", label: "Riya" },
  { email: "arjun@campus.demo", label: "Arjun" },
  { email: "neha@campus.demo", label: "Neha" },
];

export default function LoginPage() {
  const router = useRouter();
  const formCardRef = useRef(null);
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("reason") === "expired") {
      setErr("Your session expired or the server was restarted. Please log in again.");
    }
  }, []);

  useEffect(() => {
    if (!err) return;
    const el = formCardRef.current;
    if (!el) return;
    el.classList.remove("auth-shake");
    requestAnimationFrame(() => {
      void el.offsetWidth;
      el.classList.add("auth-shake");
    });
    const t = window.setTimeout(() => el.classList.remove("auth-shake"), 480);
    return () => window.clearTimeout(t);
  }, [err]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      setSession(data.token, data.user);
      router.push("/dashboard");
    } catch (e2) {
      setErr(e2.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(accountEmail) {
    setEmail(accountEmail);
    setPassword(DEMO_PASSWORD);
    setErr("");
  }

  const invalid = Boolean(err);

  return (
    <div className="page auth-page">
      <div className="auth-shell">
        <div className="auth-hero-wrap auth-animate-in" aria-hidden>
          <div className="auth-hero">
            <img
              src="/brand/login-hero.svg"
              width={320}
              height={180}
              alt=""
              className="auth-hero-img"
              decoding="async"
            />
          </div>
        </div>

        <div className="auth-brand auth-animate-in" style={{ animationDelay: "70ms" }}>
          <img
            src="/brand/campuspay-mark.svg"
            width={56}
            height={56}
            alt=""
            className="auth-mark"
            decoding="async"
          />
          <div>
            <p className="auth-kicker">CampusPay</p>
            <h1 className="auth-title">Money with your squad</h1>
            <p className="muted" style={{ margin: 0, maxWidth: "22rem" }}>
              Pools, pocket money, and campus credit — built for students in India.
            </p>
          </div>
        </div>

        <div ref={formCardRef} className="auth-card-outer auth-animate-in" style={{ animationDelay: "140ms" }}>
          <Card
            className={cn(
              "auth-card overflow-visible shadow-lg shadow-black/20 ring-white/10 transition-[box-shadow,transform] duration-300 hover:shadow-xl hover:shadow-black/25",
              loading && "auth-card-loading"
            )}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold tracking-tight">Welcome back</CardTitle>
              <CardDescription>Sign in with your campus email to continue.</CardDescription>
            </CardHeader>
            <CardContent className="stack pt-0" style={{ gap: "0.85rem" }}>
              <form onSubmit={onSubmit} className="stack" style={{ gap: "0.85rem" }}>
              <div
                className={cn(
                  "auth-field rounded-lg transition-[box-shadow] duration-200",
                  focusedField === "email" && "auth-field-focus"
                )}
              >
                <Label htmlFor={emailId} className="flex items-center gap-2">
                  <Mail className="size-3.5 opacity-70" aria-hidden />
                  Email
                </Label>
                <Input
                  id={emailId}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (err) setErr("");
                  }}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField((f) => (f === "email" ? null : f))}
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@college.edu"
                  aria-invalid={invalid}
                  required
                  className="transition-colors"
                />
              </div>

              <div
                className={cn(
                  "auth-field rounded-lg transition-[box-shadow] duration-200",
                  focusedField === "password" && "auth-field-focus"
                )}
              >
                <Label htmlFor={passwordId} className="flex items-center gap-2">
                  <Lock className="size-3.5 opacity-70" aria-hidden />
                  Password
                </Label>
                <div className="auth-input-adorned">
                  <Input
                    id={passwordId}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (err) setErr("");
                    }}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField((f) => (f === "password" ? null : f))}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    aria-invalid={invalid}
                    required
                    minLength={1}
                    className="pr-10 transition-colors"
                  />
                  <button
                    type="button"
                    className="auth-input-suffix"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {err ? (
                <div className="auth-alert" role="alert">
                  <span>{err}</span>
                </div>
              ) : null}

              <div className="stack" style={{ gap: "0.55rem", marginTop: "0.15rem" }}>
                <Button type="submit" disabled={loading} className="auth-submit w-full gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Signing in…
                    </>
                  ) : (
                    "Log in"
                  )}
                </Button>
                <p className="muted" style={{ margin: 0, fontSize: "0.78rem", textAlign: "center" }}>
                  Quick try — tap a demo profile:
                </p>
                <div className="auth-demo-row" role="group" aria-label="Demo accounts">
                  {DEMO_ACCOUNTS.map((d) => (
                    <button
                      key={d.email}
                      type="button"
                      className="auth-demo-chip"
                      onClick={() => fillDemo(d.email)}
                      disabled={loading}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <Button type="button" variant="secondary" onClick={() => fillDemo(DEMO_ACCOUNTS[0].email)} disabled={loading} className="w-full">
                  Fill Riya&apos;s credentials
                </Button>
              </div>

              <p className="muted" style={{ textAlign: "center", margin: "0.25rem 0 0", fontSize: "0.88rem" }}>
                New here?{" "}
                <Link href="/register" className="auth-link text-primary">
                  Create account
                </Link>
              </p>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="auth-animate-in overflow-hidden ring-white/10" style={{ animationDelay: "210ms" }}>
          <CardContent className="px-4 py-3">
            <details className="auth-demo-details">
              <summary>All demo credentials</summary>
              <p className="muted" style={{ margin: "0.65rem 0 0", fontSize: "0.82rem", lineHeight: 1.55 }}>
                Password for every demo account is <strong className="text-foreground">{DEMO_PASSWORD}</strong>.
                <br />
                {DEMO_ACCOUNTS.map((d) => d.email).join(" · ")}
              </p>
            </details>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
