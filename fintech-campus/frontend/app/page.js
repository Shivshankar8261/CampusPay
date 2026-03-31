"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  CircleDollarSign,
  HandCoins,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { getToken } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Home() {
  const router = useRouter();
  const [phase, setPhase] = useState("check");

  useEffect(() => {
    if (getToken()) {
      router.replace("/dashboard");
      return;
    }
    setPhase("splash");
  }, [router]);

  if (phase === "check") {
    return (
      <main className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center px-4 py-10 text-center">
        <div className="splash-loader" aria-hidden />
        <p className="muted mt-2">Checking your session…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent">
      <div className="pointer-events-none absolute inset-x-0 top-[-260px] -z-10 mx-auto h-[520px] max-w-5xl rounded-full bg-[radial-gradient(closest-side,rgba(225,29,116,0.14),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-[140px] -z-10 mx-auto h-[520px] max-w-5xl rounded-full bg-[radial-gradient(closest-side,rgba(8,145,178,0.10),transparent_70%)] blur-3xl" />

      <header className="sticky top-0 z-20 border-b border-foreground/10 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 text-foreground">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Wallet className="size-5 text-primary" aria-hidden />
            </span>
            <span className="text-sm font-extrabold tracking-tight">
              Campus<span className="text-primary">Pay</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-muted-foreground md:flex" aria-label="Primary">
            <a href="#how" className="hover:text-foreground">
              How it works
            </a>
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#faq" className="hover:text-foreground">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Log in
            </Link>
            <Link href="/register" className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-1.5")}>
              Sign up
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-10 pt-10 md:pb-16 md:pt-14">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1.5">
                <Sparkles className="size-3.5" aria-hidden />
                Student fintech MVP (demo)
              </Badge>
              <Badge variant="outline" className="gap-1.5">
                <ShieldCheck className="size-3.5" aria-hidden />
                JWT auth + seeded demo data
              </Badge>
            </div>

            <h1 className="text-balance text-3xl font-black tracking-tight md:text-5xl">
              Pockets, pools, and micro‑credit —{" "}
              <span className="bg-[linear-gradient(120deg,#e11d74_0%,#ff7a3d_35%,#0891b2_85%)] bg-clip-text text-transparent">
                built for campus life
              </span>
              .
            </h1>

            <p className="text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
              A clean, LenDenClub‑style experience for your CampusPay prototype: track spends, pool group funds,
              simulate UPI transfers, and manage tiny loans (₹100–₹1,000) — all in one place.
            </p>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Link href="/register" className={cn(buttonVariants({ variant: "default", size: "lg" }), "gap-2")}>
                Get started
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href="/login" className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}>
                Use demo account
              </Link>
            </div>

            <p className="text-sm font-semibold text-muted-foreground">
              Tip: demo accounts are listed on the login page.
            </p>
          </div>

          <div className="grid gap-3">
            <Card className="ring-1 ring-foreground/10">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <CircleDollarSign className="size-5 text-primary" aria-hidden />
                  A “trust-first” dashboard feel
                </CardTitle>
                <CardDescription>
                  Clean stats, clear CTAs, and sections that explain the product — inspired by `lendenclub.com`.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-muted/40 p-3 ring-1 ring-foreground/10">
                  <div className="text-lg font-extrabold tracking-tight">₹100–₹1,000</div>
                  <div className="text-xs font-semibold text-muted-foreground">micro-loan range</div>
                </div>
                <div className="rounded-xl bg-muted/40 p-3 ring-1 ring-foreground/10">
                  <div className="text-lg font-extrabold tracking-tight">0 fees</div>
                  <div className="text-xs font-semibold text-muted-foreground">prototype demo</div>
                </div>
                <div className="rounded-xl bg-muted/40 p-3 ring-1 ring-foreground/10">
                  <div className="text-lg font-extrabold tracking-tight">Instant</div>
                  <div className="text-xs font-semibold text-muted-foreground">seeded data</div>
                </div>
                <div className="rounded-xl bg-muted/40 p-3 ring-1 ring-foreground/10">
                  <div className="text-lg font-extrabold tracking-tight">Pools</div>
                  <div className="text-xs font-semibold text-muted-foreground">group goals</div>
                </div>
                <div className="rounded-xl bg-muted/40 p-3 ring-1 ring-foreground/10">
                  <div className="text-lg font-extrabold tracking-tight">Budget</div>
                  <div className="text-xs font-semibold text-muted-foreground">pocket money</div>
                </div>
                <div className="rounded-xl bg-muted/40 p-3 ring-1 ring-foreground/10">
                  <div className="text-lg font-extrabold tracking-tight">UPI*</div>
                  <div className="text-xs font-semibold text-muted-foreground">simulated</div>
                </div>
              </CardContent>
              <div className="border-t border-foreground/10 px-4 py-3 text-xs font-semibold text-muted-foreground">
                *Simulated UPI and balances for demo purposes — no real money movement.
              </div>
            </Card>

            <div className="grid gap-3 md:grid-cols-2">
              <Card className="ring-1 ring-foreground/10">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="size-5 text-primary" aria-hidden />
                    Pools that feel effortless
                  </CardTitle>
                  <CardDescription>Trip funds, fest tickets, batch gifts — chip in together.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Create a group pool, share a join code, and track contributions in one scroll.
                </CardContent>
              </Card>
              <Card className="ring-1 ring-foreground/10">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <HandCoins className="size-5 text-primary" aria-hidden />
                    Tiny loans, clear rules
                  </CardTitle>
                  <CardDescription>Borrow, accept, repay — and see a campus credit vibe.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Simple flows that explain risk and repayment without heavy finance jargon.
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold tracking-[0.18em] text-primary">HOW IT WORKS</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Start in minutes</h2>
          </div>
          <Badge variant="outline" className="hidden md:inline-flex">
            No setup fee • Local demo
          </Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              title: "1) Create an account",
              desc: "Sign up and land on the dashboard with seeded demo data ready to explore.",
            },
            {
              title: "2) Add actions",
              desc: "Simulate UPI, create pools, set a budget, and track transactions by category.",
            },
            {
              title: "3) Try micro‑credit",
              desc: "Request or accept a small loan and repay — credit score updates are rule‑based.",
            },
          ].map((s) => (
            <Card key={s.title} className="ring-1 ring-foreground/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-extrabold">{s.title}</CardTitle>
                <CardDescription>{s.desc}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Check className="size-3.5" aria-hidden />
                  Clear UI
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Check className="size-3.5" aria-hidden />
                  Fast flows
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="mb-6">
          <p className="text-xs font-extrabold tracking-[0.18em] text-primary">FEATURES</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Built for everyday campus money</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-muted-foreground md:text-base">
            This keeps the LenDenClub-style “confidence + clarity” layout, but tailored to students and to your
            existing backend endpoints.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {[
            {
              title: "Wallet + transactions",
              desc: "Balance, recent activity, categories, and quick simulated payments.",
            },
            {
              title: "Pools (group funds)",
              desc: "Join via code, contribute, and see who paid what — instantly.",
            },
            {
              title: "Budget (pocket money)",
              desc: "Setup, insights, and 30-day spend view to reduce “where did it go?” moments.",
            },
            {
              title: "Micro-loans + repayments",
              desc: "Simple accept/reject/repay workflows with a lightweight credit vibe.",
            },
          ].map((f) => (
            <Card key={f.title} className="ring-1 ring-foreground/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-extrabold">{f.title}</CardTitle>
                <CardDescription>{f.desc}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="grid gap-2">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 text-primary" aria-hidden />
                    Same‑origin API via Next proxy (`/api/...`) for smooth local dev.
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 text-primary" aria-hidden />
                    Designed for clarity on mobile, but scales nicely to desktop.
                  </li>
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 flex flex-col items-stretch gap-2 rounded-2xl bg-muted/40 p-4 ring-1 ring-foreground/10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-extrabold">Ready to explore the prototype?</div>
            <div className="text-sm font-semibold text-muted-foreground">
              Use a demo account or create your own in seconds.
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              Demo login
            </Link>
            <Link href="/register" className={cn(buttonVariants({ variant: "default", size: "lg" }))}>
              Sign up
            </Link>
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="mb-6">
          <p className="text-xs font-extrabold tracking-[0.18em] text-primary">FAQ</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Quick answers</h2>
        </div>

        <div className="grid gap-3">
          {[
            {
              q: "Is this real UPI / real lending?",
              a: "No — this is a demo/prototype. Payments and balances are simulated for UX and flow testing.",
            },
            {
              q: "Do I need MongoDB installed?",
              a: "Not required. The backend can run with an in-memory database for local demo (data resets on restart).",
            },
            {
              q: "Can I use this as a production app?",
              a: "It’s built like a production-style MVP, but you’d still need hardening: real payments, compliance, audits, and ops.",
            },
          ].map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl bg-background/60 p-4 ring-1 ring-foreground/10 open:bg-background"
            >
              <summary className="cursor-pointer list-none text-sm font-extrabold text-foreground">
                {item.q}
                <span className="ml-2 text-muted-foreground group-open:hidden">(tap)</span>
              </summary>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t border-foreground/10 bg-background/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 md:flex-row md:items-center md:justify-between">
          <div className="text-sm font-extrabold tracking-tight">
            Campus<span className="text-primary">Pay</span>
            <span className="ml-2 text-xs font-semibold text-muted-foreground">student fintech MVP</span>
          </div>
          <div className="text-xs font-semibold text-muted-foreground">
            Inspired by the clear landing-page structure of{" "}
            <a className="underline-offset-4 hover:underline" href="https://www.lendenclub.com/" target="_blank" rel="noreferrer">
              LenDenClub
            </a>
            {" "}— adapted for a campus demo.
          </div>
        </div>
      </footer>
    </main>
  );
}
