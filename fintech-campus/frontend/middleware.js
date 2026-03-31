import { NextResponse } from "next/server";

/** Map common typos / marketing URLs to real App Router paths — avoids “404” for students bookmarking wrong links. */
const ALIASES = {
  "/signin": "/login",
  "/sign-in": "/login",
  "/signup": "/register",
  "/sign-up": "/register",
  "/pools": "/groups",
  "/pool": "/groups",
  "/pay": "/transactions",
  "/payments": "/transactions",
  "/send": "/transactions",
  "/home": "/dashboard",
  "/wallet": "/dashboard",
};

function normalizePath(pathname) {
  let p = pathname.toLowerCase();
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

export function middleware(request) {
  const pathname = normalizePath(request.nextUrl.pathname);
  const target = ALIASES[pathname];
  if (!target) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = target;
  return NextResponse.redirect(url, 308);
}

/* Runs for page routes (not /api — avoids interfering with the API rewrite). Case normalized in handler. */
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
