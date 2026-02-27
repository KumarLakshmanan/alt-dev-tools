"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * PageTracker — fires POST /api/analytics/pageview on every route change.
 * Included once in the root layout. Lightweight, non-blocking.
 */
export default function PageTracker() {
  const pathname = usePathname();
  const prevRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip admin routes — don't track the analytics page itself
    if (pathname?.startsWith("/admin")) return;
    // Avoid double-tracking same path on initial render if already tracked
    if (prevRef.current === pathname) return;
    prevRef.current = pathname;

    const referrer = document.referrer ?? "";

    fetch("/api/analytics/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: pathname, referrer }),
      // Fire-and-forget: don't block navigation
      keepalive: true,
    }).catch(() => {/* ignore errors silently */});
  }, [pathname]);

  return null;
}
