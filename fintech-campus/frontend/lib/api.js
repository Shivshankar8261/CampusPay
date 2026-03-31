/**
 * API calls:
 * - In the browser, defaults to same-origin `/api/...` (proxied to Express via next.config rewrites).
 * - Set NEXT_PUBLIC_API_BASE (e.g. https://api.example.com) to call the API directly (no proxy).
 */
function clientBase() {
  if (typeof window === "undefined") return "";
  const explicit = (process.env.NEXT_PUBLIC_API_BASE || "").trim().replace(/\/$/, "");
  if (explicit) return explicit;
  return "";
}

function serverBase() {
  return (
    (process.env.NEXT_PUBLIC_API_BASE || "").trim().replace(/\/$/, "") ||
    (process.env.API_ORIGIN || "http://127.0.0.1:4000").replace(/\/$/, "")
  );
}

const base = () => (typeof window !== "undefined" ? clientBase() : serverBase());

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setSession(token, user) {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
  if (user) localStorage.setItem("user", JSON.stringify(user));
  else localStorage.removeItem("user");
}

export function getUser() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  setSession(null, null);
  const path = window.location.pathname;
  if (path !== "/login" && path !== "/register") {
    window.location.assign("/login?reason=expired");
  }
}

export async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `${base()}${path}`;

  let r;
  try {
    r = await fetch(url, { ...options, headers });
  } catch (e) {
    const usesProxy =
      typeof window !== "undefined" && !(process.env.NEXT_PUBLIC_API_BASE || "").trim();
    const hint = usesProxy
      ? " From `fintech-campus` run `npm install` then `npm run dev` (starts API + web), or run backend on port 4000 and frontend on 3000."
      : " Check NEXT_PUBLIC_API_BASE and network access to the API.";
    throw new Error(`Can't reach CampusPay API.${hint} (${e.message || "network error"})`);
  }

  const ct = r.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await r.json().catch(() => ({})) : {};

  if (r.status === 401 && path !== "/api/auth/login" && path !== "/api/auth/register") {
    redirectToLogin();
    throw new Error(data.error || "Session expired. Please log in again.");
  }

  if (!r.ok) {
    const err = new Error(data.error || r.statusText || "Request failed");
    err.status = r.status;
    err.data = data;
    throw err;
  }
  return data;
}
