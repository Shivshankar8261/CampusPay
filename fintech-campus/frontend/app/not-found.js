"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Home, LogIn, Search, Sparkles, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const QUICK = [
  { href: "/", label: "Start", icon: Home },
  { href: "/login", label: "Log in", icon: LogIn },
  { href: "/groups", label: "Pools", icon: Users },
];

export default function NotFound() {
  const pathname = usePathname();

  return (
    <div className="page nf-page">
      <div className="nf-glow" aria-hidden />
      <Card className="nf-card relative overflow-hidden ring-white/10">
        <CardContent className="nf-card-inner px-5 py-8 sm:px-8">
          <p className="nf-eyebrow">
            <Sparkles className="size-3.5 inline-block align-text-bottom opacity-90" aria-hidden />
            {"  "}404 — wrong lecture hall?
          </p>
          <h1 className="nf-title">This page isn&apos;t on campus</h1>
          <p className="muted nf-desc">
            The link might be old, typo&apos;d, or the page moved. Double-check the URL
            {pathname ? (
              <>
                : <code className="nf-path">{pathname}</code>
              </>
            ) : null}
          </p>

          <div className="nf-actions">
            <Link
              href="/"
              className={cn(buttonVariants({ variant: "default" }), "nf-link-btn gap-2")}
            >
              <ArrowLeft className="size-4" aria-hidden />
              Back to CampusPay
            </Link>
            <Link href="/login" className={cn(buttonVariants({ variant: "secondary" }))}>
              Log in
            </Link>
          </div>

          <p className="nf-hint">
            <Search className="size-3.5 inline opacity-70" aria-hidden /> Try these:
          </p>
          <div className="nf-chips">
            {QUICK.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="nf-chip">
                <Icon className="size-3.5 opacity-80" aria-hidden />
                {label}
              </Link>
            ))}
            <Link href="/transactions" className="nf-chip">
              Pay
            </Link>
            <Link href="/budget" className="nf-chip">
              Budget
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
