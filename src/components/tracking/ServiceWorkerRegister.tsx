"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const PWA_SCOPES = ["/dashboard/", "/admin/"] as const;

function scopeForPath(pathname: string): (typeof PWA_SCOPES)[number] | null {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return "/dashboard/";
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return "/admin/";
  }

  return null;
}

export default function ServiceWorkerRegister() {
  const pathname = usePathname();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const targetScope = scopeForPath(pathname ?? window.location.pathname);
    let cancelled = false;

    async function syncServiceWorker() {
      const registrations = await navigator.serviceWorker.getRegistrations();

      await Promise.all(
        registrations
          .filter((registration) => {
            const scopePath = new URL(registration.scope).pathname;
            return !PWA_SCOPES.includes(scopePath as (typeof PWA_SCOPES)[number]);
          })
          .map((registration) => registration.unregister())
      );

      if (!targetScope || cancelled) return;

      await navigator.serviceWorker.register("/sw.js", { scope: targetScope });
    }

    syncServiceWorker().catch((err) => {
      console.error("SW registration failed:", err);
    });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
