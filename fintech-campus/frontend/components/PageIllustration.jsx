"use client";

import { useId } from "react";

const MAP = {
  dashboard: "/illustrations/students-wallet.svg",
  pools: "/illustrations/friends-pool.svg",
  budget: "/illustrations/pocket-money.svg",
  credit: "/illustrations/campus-handshake.svg",
  pay: "/illustrations/upi-phone.svg",
  empty: "/illustrations/empty-state.svg",
};

/** Inline SVG so “Your pools” art always renders (no failed /public fetch, unique gradient IDs when used twice). */
function PoolsIllustrationInline({ width, height, className, alt }) {
  const uid = useId().replace(/:/g, "");
  const gradId = `pools-grad-${uid}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 220 140"
      fill="none"
      className={className}
      role={alt ? "img" : undefined}
      aria-hidden={alt ? undefined : true}
      aria-label={alt || undefined}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="220" y2="140">
          <stop stopColor="#FFF0E8" />
          <stop offset="1" stopColor="#F0E8FF" />
        </linearGradient>
      </defs>
      <rect width="220" height="140" rx="20" fill={`url(#${gradId})`} />
      <ellipse cx="110" cy="88" rx="72" ry="28" fill="#FF6B6B" opacity="0.12" />
      <circle cx="72" cy="64" r="22" fill="#FF9F43" opacity="0.55" />
      <circle cx="110" cy="52" r="24" fill="#FF6B6B" opacity="0.5" />
      <circle cx="148" cy="64" r="22" fill="#26C485" opacity="0.5" />
      <path d="M62 90c0-8 10-14 22-14h52c12 0 22 6 22 14v8H62v-8z" fill="#fff" opacity="0.9" />
      <text x="110" y="102" textAnchor="middle" fill="#2D3142" fontFamily="system-ui, sans-serif" fontSize="10" fontWeight="700" opacity="0.5">
        SPLIT &amp; SAVE TOGETHER
      </text>
    </svg>
  );
}

/** Small squad circles for each pool card (no external image). */
export function PoolCardThumbnail({ className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={44}
      height={28}
      viewBox="0 0 44 28"
      fill="none"
      className={`pool-card-thumb ${className}`.trim()}
      aria-hidden
    >
      <circle cx="11" cy="14" r="8" fill="#FF9F43" opacity="0.55" />
      <circle cx="22" cy="10" r="9" fill="#FF6B6B" opacity="0.5" />
      <circle cx="33" cy="14" r="8" fill="#26C485" opacity="0.5" />
    </svg>
  );
}

export function PageIllustration({ name, className = "", width = 200, height = 140, alt = "" }) {
  const cls = `page-illustration ${className}`.trim();

  if (name === "pools") {
    return <PoolsIllustrationInline width={width} height={height} className={cls} alt={alt} />;
  }

  const src = MAP[name] || MAP.empty;
  return (
    <img
      src={src}
      width={width}
      height={height}
      alt={alt || ""}
      className={cls}
      decoding="async"
    />
  );
}
