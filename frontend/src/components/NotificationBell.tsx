"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { priorityTone } from "@/lib/tone";
import { can } from "@/lib/permissions";
import { useAnalyticsRefresh } from "@/lib/analyticsRefresh";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from "@/lib/api";

function whenLabel(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.valueOf())) return "";

  const elapsed = Date.now() - parsed.valueOf();
  const minutes = Math.round(elapsed / 60_000);

  // Recent items read better as "12m ago"; anything older gets a date.
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`;

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function NotificationBell({
  token,
  role,
}: {
  token: string;
  role: string;
}) {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Read state is shared across users, so bulk-clearing is an operational
  // action rather than a personal one. The API enforces this too.
  const canMarkAllRead = can(role, "markAllNotificationsRead");

  const load = useCallback(async function load() {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      // Not store-scoped here: the header sits above the dashboard's store
      // selector, so it reports across every store the user can see.
      const data = await getNotifications(token);
      setItems(data.notifications);
      setUnread(data.unread_count);
    } catch (err) {
      console.error(err);
      setError("Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
    // Notifications only change when a video is processed, so the count is
    // fetched on mount rather than polled.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // The bell sits in the app shell, above the page that runs the pipeline,
  // so a processing run cannot reach it by prop. It listens instead: the
  // backend writes this store's notifications at the end of every run, and
  // without this the badge would keep showing the count from page load.
  useAnalyticsRefresh(load);

  // Close when clicking outside the panel.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleOpen() {
    const next = !open;
    setOpen(next);

    // Refresh on open so the list reflects any run since mount.
    if (next) await load();
  }

  async function handleRead(notification: Notification) {
    if (notification.read_at) return;

    // Optimistic: reflect the click immediately, reconcile from the server.
    setItems((current) =>
      current.map((item) =>
        item.id === notification.id
          ? { ...item, read_at: new Date().toISOString() }
          : item
      )
    );
    setUnread((count) => Math.max(0, count - 1));

    try {
      await markNotificationRead(notification.id, token);
    } catch (err) {
      console.error(err);
      await load();
    }
  }

  async function handleReadAll() {
    try {
      await markAllNotificationsRead(token);
      await load();
    } catch (err) {
      console.error(err);
      setError("Could not mark all as read.");
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleOpen}
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
        }
        aria-expanded={open}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface",
          "text-ink-muted transition-colors duration-200 hover:border-line-strong hover:text-ink",
          open && "border-line-strong text-ink"
        )}
      >
        <Bell className="h-[18px] w-[18px]" />

        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-critical-base px-1 font-display text-[10px] font-bold text-white ring-2 ring-surface">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-scale-in absolute right-0 z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-xl border border-line bg-surface shadow-pop">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="font-display text-sm font-semibold text-ink">
                Notifications
              </p>

              {unread > 0 && (
                <StatusBadge variant="critical" size="sm">
                  {unread} new
                </StatusBadge>
              )}
            </div>

            {unread > 0 && canMarkAllRead && (
              <button
                type="button"
                onClick={handleReadAll}
                className="inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-brand-deep transition-colors duration-200 hover:text-brand-strong"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="scrollbar-subtle max-h-[22rem] overflow-y-auto">
            {loading ? (
              <div className="space-y-3 p-4">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="h-4 w-20 rounded-full" />
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <p className="px-4 py-8 text-center text-sm text-critical-strong">
                {error}
              </p>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-sunken text-ink-subtle">
                  <BellOff className="h-5 w-5" aria-hidden="true" />
                </span>

                <p className="text-sm font-medium text-ink">All clear</p>

                <p className="text-xs leading-relaxed text-ink-muted">
                  Alerts appear here after a video is processed and a shelf
                  enters the high-priority band.
                </p>
              </div>
            ) : (
              <ul>
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleRead(item)}
                      className={cn(
                        "relative w-full border-b border-line px-4 py-3.5 text-left last:border-0",
                        "transition-colors duration-150 hover:bg-surface-sunken",
                        item.read_at && "opacity-60"
                      )}
                    >
                      {!item.read_at && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-0 left-0 w-0.5 bg-critical-base"
                        />
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <StatusBadge
                          variant={priorityTone(item.severity)}
                          size="sm"
                        >
                          {item.severity}
                        </StatusBadge>

                        <span className="text-[11px] text-ink-subtle">
                          {whenLabel(item.created_at)}
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-relaxed text-ink text-pretty">
                        {item.message}
                      </p>

                      {item.category && (
                        <p className="mt-1.5 text-[11px] uppercase tracking-wider text-ink-subtle">
                          {item.category}
                        </p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
