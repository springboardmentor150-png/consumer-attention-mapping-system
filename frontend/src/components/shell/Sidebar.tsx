"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, LogOut, Settings, X } from "lucide-react";
import { Logo, LogoMark } from "@/components/ui/Logo";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RoleBadge } from "@/components/RoleBadge";
import { NAV_GROUPS } from "@/lib/nav";
import { can } from "@/lib/permissions";
import { dashboardConfig, hasSection } from "@/lib/dashboardConfig";
import { cn } from "@/lib/utils";

/**
 * Primary navigation.
 *
 * One component serves three presentations — expanded rail, collapsed
 * icon rail, and mobile drawer — because they share the same entries and
 * the same active-state logic; splitting them would mean maintaining the
 * permission filtering three times.
 */
export function Sidebar({
  role,
  email,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  onLogout,
}: {
  role: string;
  email: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const config = dashboardConfig(role);

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    entries: group.entries.filter(
      (entry) =>
        can(role, entry.capability) &&
        // Anchor entries are only offered when this role's dashboard
        // actually renders the panel they point at.
        (!entry.section || hasSection(config, entry.section))
    ),
  })).filter((group) => group.entries.length > 0);

  return (
    <>
      {/* Scrim — mobile only. */}
      <div
        onClick={onCloseMobile}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <aside
        aria-label="Main navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-line bg-surface",
          "transition-[width,transform] duration-300 ease-out",
          collapsed ? "w-[4.5rem]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* ── Brand ─────────────────────────────────────────────────── */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-line",
            collapsed ? "justify-center px-3" : "justify-between pl-5 pr-3"
          )}
        >
          <Link
            href="/dashboard"
            onClick={onCloseMobile}
            className="flex min-w-0 items-center gap-2.5 rounded-lg"
            aria-label="CAMS — go to dashboard"
          >
            {collapsed ? <LogoMark /> : <Logo />}
          </Link>

          {!collapsed && (
            <>
              <button
                type="button"
                onClick={onToggleCollapsed}
                aria-label="Collapse sidebar"
                className="hidden h-8 w-8 items-center justify-center rounded-lg text-ink-subtle transition-colors duration-200 hover:bg-surface-sunken hover:text-ink lg:flex"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close navigation"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-subtle transition-colors duration-200 hover:bg-surface-sunken hover:text-ink lg:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* ── Entries ───────────────────────────────────────────────── */}
        <nav className="scrollbar-subtle flex-1 overflow-y-auto px-3 py-5">
          {groups.map((group, groupIndex) => (
            <div key={group.label} className={cn(groupIndex > 0 && "mt-7")}>
              {!collapsed && (
                <p className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-subtle">
                  {group.label}
                </p>
              )}

              {collapsed && groupIndex > 0 && (
                <div className="mx-2 mb-3 h-px bg-line" aria-hidden="true" />
              )}

              <ul className="space-y-1">
                {group.entries.map((entry) => {
                  const Icon = entry.icon;
                  // Anchors are never "the current page" — only routes are.
                  const isActive =
                    !entry.href.includes("#") && pathname === entry.href;

                  return (
                    <li key={entry.href}>
                      <Link
                        href={entry.href}
                        onClick={onCloseMobile}
                        aria-current={isActive ? "page" : undefined}
                        title={collapsed ? entry.label : undefined}
                        className={cn(
                          "group/nav relative flex items-center rounded-xl text-sm font-medium",
                          "transition-colors duration-200",
                          collapsed
                            ? "h-11 justify-center"
                            : "gap-3 px-2.5 py-2.5",
                          isActive
                            ? "bg-brand-soft text-brand-deep"
                            : "text-ink-muted hover:bg-surface-sunken hover:text-ink"
                        )}
                      >
                        {/* Active rail, anchored to the left edge. */}
                        <span
                          aria-hidden="true"
                          className={cn(
                            "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-base",
                            "transition-all duration-300",
                            isActive
                              ? "opacity-100"
                              : "scale-y-0 opacity-0"
                          )}
                        />

                        <Icon
                          className={cn(
                            "h-[18px] w-[18px] shrink-0 transition-transform duration-200",
                            "group-hover/nav:scale-110",
                            isActive ? "text-brand-base" : "text-ink-subtle"
                          )}
                          strokeWidth={1.9}
                        />

                        {!collapsed && (
                          <span className="min-w-0 flex-1 truncate">
                            {entry.label}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* ── Pipeline status ───────────────────────────────────────── */}
        {!collapsed && (
          <div className="mx-3 mb-3 rounded-xl border border-line bg-gradient-to-br from-brand-soft/60 to-behavior-soft/40 p-3.5">
            <div className="flex items-center gap-2">
              <StatusBadge variant="healthy" dot pulse size="sm">
                AI Active
              </StatusBadge>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              Vision pipeline ready. Upload footage to refresh attention
              analytics.
            </p>
          </div>
        )}

        {/* ── Account ───────────────────────────────────────────────── */}
        <div
          className={cn(
            "shrink-0 border-t border-line",
            collapsed ? "p-3" : "p-3.5"
          )}
        >
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <Avatar email={email} />

              <button
                type="button"
                onClick={onLogout}
                aria-label="Sign out"
                title="Sign out"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-subtle transition-colors duration-200 hover:bg-critical-soft hover:text-critical-strong"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 rounded-xl px-1 py-1">
                <Avatar email={email} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.8125rem] font-medium text-ink">
                    {email || "Signed in"}
                  </p>

                  <div className="mt-1">
                    <RoleBadge role={role} size="sm" />
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  href="/dashboard#reports"
                  onClick={onCloseMobile}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-line px-2 py-1.5 text-xs font-medium text-ink-muted transition-colors duration-200 hover:border-line-strong hover:text-ink"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Reports
                </Link>

                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-line px-2 py-1.5 text-xs font-medium text-ink-muted transition-colors duration-200 hover:border-critical-soft hover:bg-critical-soft hover:text-critical-strong"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>

        {/* Expand handle, only while collapsed. */}
        {collapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Expand sidebar"
            className="absolute -right-3 top-20 hidden h-6 w-6 items-center justify-center rounded-full border border-line bg-surface text-ink-subtle shadow-card transition-colors duration-200 hover:text-ink lg:flex"
          >
            <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
          </button>
        )}
      </aside>
    </>
  );
}

function Avatar({ email }: { email: string }) {
  const initial = email.trim().charAt(0).toUpperCase() || "U";

  return (
    <span
      aria-hidden="true"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-base to-teal-base font-display text-sm font-bold text-white shadow-brand"
    >
      {initial}
    </span>
  );
}
