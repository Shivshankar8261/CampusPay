const base = () => process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

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

export async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(`${base()}${path}`, { ...options, headers });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(data.error || r.statusText || "Request failed");
    err.status = r.status;
    err.data = data;
    throw err;
  }
  return data;
}
