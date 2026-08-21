"use client";

import { useEffect } from "react";

/* ────────────────────────────────────────────────────────────────────────
   "This store's analytics just changed."

   Processing a video rewrites a store's sessions, which invalidates every
   figure derived from them: the scores, the advice, the health bands and
   the notifications the backend wrote at the end of the run. Panels sitting
   inside the dashboard are told by prop, because the dashboard owns the run
   and can pass one down.

   The notification bell cannot be reached that way — it lives in the app
   shell, above the routed page, so no prop can travel from the dashboard to
   it. Rather than lifting a store selector and a refresh counter into the
   shell for one badge, the run announces itself and the bell listens.

   One event, one publisher (the dashboard, once a run has settled), and any
   number of listeners.
   ──────────────────────────────────────────────────────────────────────── */

const ANALYTICS_REFRESHED = "cams:analytics-refreshed";

/** Announce that a processing run has written new analytics. */
export function publishAnalyticsRefresh(storeId: number | null) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(ANALYTICS_REFRESHED, { detail: { storeId } })
  );
}

/**
 * Re-run `onRefresh` whenever a processing run finishes.
 *
 * The handler is read from a ref-free dependency on purpose: callers pass a
 * stable useCallback, and re-subscribing on every render would be wasted
 * work rather than incorrect.
 */
export function useAnalyticsRefresh(onRefresh: () => void) {
  useEffect(() => {
    function handle() {
      onRefresh();
    }

    window.addEventListener(ANALYTICS_REFRESHED, handle);

    return () => window.removeEventListener(ANALYTICS_REFRESHED, handle);
  }, [onRefresh]);
}
