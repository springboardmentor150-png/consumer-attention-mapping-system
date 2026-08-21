"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  Command,
  LogOut,
  Menu as MenuIcon,
  Search,
  User,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RoleBadge } from "@/components/RoleBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuRoot,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/Menu";
import { breadcrumbFor, ROUTE_ENTRIES } from "@/lib/nav";
import { can, roleLabel } from "@/lib/permissions";
import { cn } from "@/lib/utils";

/**
 * The top bar: breadcrumb, command search, live status, notifications,
 * theme and account.
 *
 * Search is a navigator over the modules this role can reach — it filters
 * the same permission-checked entry list the sidebar uses, so it can never
 * offer a route the API would reject.
 */
export function Topbar({
  role,
  email,
  token,
  onOpenMobileNav,
  onLogout,
}: {
  role: string;
  email: string;
  token: string;
  onOpenMobileNav: () => void;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const trail = breadcrumbFor(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-line glass-strong">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line text-ink-muted transition-colors duration-200 hover:text-ink lg:hidden"
        >
          <MenuIcon className="h-[18px] w-[18px]" />
        </button>

        {/* ── Breadcrumb ────────────────────────────────────────────── */}
        <nav aria-label="Breadcrumb" className="hidden min-w-0 md:block">
          <ol className="flex items-center gap-1.5 text-sm">
            {trail.map((crumb, index) => (
              <li key={crumb.label} className="flex items-center gap-1.5">
                {index > 0 && (
                  <ChevronRight
                    className="h-3.5 w-3.5 text-ink-subtle"
                    aria-hidden="true"
                  />
                )}

                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="rounded text-ink-subtle transition-colors duration-200 hover:text-ink"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-medium text-ink" aria-current="page">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <CommandSearch role={role} />

          <StatusBadge
            variant="healthy"
            dot
            pulse
            className="hidden xl:inline-flex"
          >
            Realtime
          </StatusBadge>

          {token && <NotificationBell token={token} role={role} />}

          <ThemeToggle />

          {/* ── Account menu ────────────────────────────────────────── */}
          <MenuRoot>
            <MenuTrigger
              aria-label="Account menu"
              className="flex items-center gap-2 rounded-xl border border-line bg-surface py-1 pl-1 pr-2 transition-colors duration-200 hover:border-line-strong"
            >
              <span
                aria-hidden="true"
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-base to-teal-base font-display text-xs font-bold text-white"
              >
                {email.trim().charAt(0).toUpperCase() || "U"}
              </span>

              <ChevronRight className="h-3.5 w-3.5 rotate-90 text-ink-subtle" />
            </MenuTrigger>

            <MenuContent>
              <div className="px-2.5 pb-2.5 pt-1.5">
                <p className="truncate text-sm font-medium text-ink">
                  {email || "Signed in"}
                </p>

                <div className="mt-2">
                  <RoleBadge role={role} size="sm" />
                </div>
              </div>

              <MenuSeparator />

              <MenuLabel>Access</MenuLabel>

              <MenuItem>
                <User />
                {role ? roleLabel(role) : "Viewer"}
              </MenuItem>

              <MenuSeparator />

              <MenuItem tone="critical" onClick={onLogout}>
                <LogOut />
                Sign out
              </MenuItem>
            </MenuContent>
          </MenuRoot>
        </div>
      </div>
    </header>
  );
}

/**
 * Module switcher.
 *
 * Opens on click or ⌘K / Ctrl+K, filters the routes this role can reach,
 * and navigates with Enter. Deliberately scoped to navigation: it makes no
 * requests of its own, so it cannot leak records across roles.
 */
function CommandSearch({ role }: { role: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const matches = ROUTE_ENTRIES.filter(
    (entry) =>
      can(role, entry.capability) &&
      entry.label.toLowerCase().includes(query.trim().toLowerCase())
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        // Focus once the input has actually rendered.
        requestAnimationFrame(() => inputRef.current?.focus());
      }

      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

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

    document.addEventListener("mousedown", onPointerDown);

    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        className={cn(
          "flex items-center gap-2 rounded-xl border border-line bg-surface text-sm text-ink-subtle",
          "transition-colors duration-200 hover:border-line-strong hover:text-ink-muted",
          "h-9 w-9 justify-center sm:w-56 sm:justify-start sm:px-3 lg:w-64"
        )}
        aria-label="Search modules"
      >
        <Search className="h-4 w-4 shrink-0" />

        <span className="hidden flex-1 text-left sm:inline">Search…</span>

        <kbd className="hidden items-center gap-0.5 rounded-md border border-line bg-surface-sunken px-1.5 py-0.5 font-mono text-[10px] text-ink-subtle sm:inline-flex">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      {open && (
        <div className="animate-scale-in absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-surface shadow-pop">
          <div className="flex items-center gap-2 border-b border-line px-3.5">
            <Search className="h-4 w-4 shrink-0 text-ink-subtle" />

            <input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                // A new query means a new result list; highlight its top row.
                setActive(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActive((index) => Math.min(index + 1, matches.length - 1));
                }

                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActive((index) => Math.max(index - 1, 0));
                }

                if (event.key === "Enter" && matches[active]) {
                  window.location.href = matches[active].href;
                }
              }}
              placeholder="Jump to a module…"
              aria-label="Search modules"
              className="h-11 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
            />
          </div>

          <ul className="max-h-72 overflow-y-auto p-1.5">
            {matches.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-ink-muted">
                No modules match “{query}”.
              </li>
            ) : (
              matches.map((entry, index) => {
                const Icon = entry.icon;

                return (
                  <li key={entry.href}>
                    <Link
                      href={entry.href}
                      onClick={() => setOpen(false)}
                      onMouseEnter={() => setActive(index)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors duration-150",
                        index === active
                          ? "bg-surface-sunken"
                          : "hover:bg-surface-sunken"
                      )}
                    >
                      <Icon
                        className="h-4 w-4 shrink-0 text-ink-subtle"
                        aria-hidden="true"
                      />

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">
                          {entry.label}
                        </span>

                        {entry.description && (
                          <span className="block truncate text-xs text-ink-subtle">
                            {entry.description}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
