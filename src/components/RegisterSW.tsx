"use client";

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // In development, make sure no stale service worker/caches are serving old
    // assets — unregister everything instead of caching.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
      if (window.caches) caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* best-effort */
    });
  }, []);
  return null;
}
