"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Home" },
  { href: "/transactions", label: "Pay" },
  { href: "/groups", label: "Pools" },
  { href: "/budget", label: "Budget" },
  { href: "/loans", label: "Credit" },
  { href: "/profile", label: "Me" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav" aria-label="Main">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className={pathname === l.href ? "active" : ""}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
