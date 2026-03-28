"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";

export function RequireAuth({ children }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!getToken()) router.replace("/login");
    else setOk(true);
  }, [router]);

  if (!ok) return <div className="page muted">Loading…</div>;
  return children;
}
