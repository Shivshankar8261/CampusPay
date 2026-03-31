"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function Icon({ children }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-item-icon" aria-hidden>
      {children}
    </svg>
  );
}

const icons = {
  home: (
    <Icon>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </Icon>
  ),
  pay: (
    <Icon>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </Icon>
  ),
  pools: (
    <Icon>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  ),
  budget: (
    <Icon>
      <path d="M12 20V10" />
      <path d="M18 20V4" />
      <path d="M6 20v-4" />
    </Icon>
  ),
  credit: (
    <Icon>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </Icon>
  ),
  profile: (
    <Icon>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Icon>
  ),
  borrow: (
    <Icon>
      <path d="M12 2v20" />
      <path d="M5 9l7-7 7 7" />
    </Icon>
  ),
  lend: (
    <Icon>
      <path d="M12 22V2" />
      <path d="M19 15l-7 7-7-7" />
    </Icon>
  ),
  history: (
    <Icon>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 3v6h6" />
      <path d="M12 7v5l3 3" />
    </Icon>
  ),
};

const links = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/borrow", label: "Borrow", icon: "borrow" },
  { href: "/lend", label: "Lend", icon: "lend" },
  { href: "/history", label: "History", icon: "history" },
  { href: "/profile", label: "Profile", icon: "profile" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav" aria-label="Main">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className={`nav-item ${pathname === l.href ? "active" : ""}`}>
          {icons[l.icon]}
          <span>{l.label}</span>
        </Link>
      ))}
    </nav>
  );
}
