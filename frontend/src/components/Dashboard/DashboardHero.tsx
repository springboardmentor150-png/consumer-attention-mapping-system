"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Cpu,
  Flame,
  Sparkles,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RoleBadge } from "@/components/RoleBadge";
import { cn } from "@/lib/utils";

/**
 * The dashboard's opening panel.
 *
 * Carries the greeting, who is signed in, what the pipeline last did, and
 * the two or three things this role is most likely to do next — so the top
 * of the page answers "where am I and what now" before any figure is read.
 */
export function DashboardHero({
  greeting,
  email,
  role,
  headline,
  lastProcessed,
  sessionCount,
  quickActions,
}: {
  greeting: string;
  email: string;
  role: string;
  headline: string;
  lastProcessed: string | null | undefined;
  sessionCount: number;
  quickActions: {
    label: string;
    description: string;
    href: string;
    icon: LucideIcon;
  }[];
}) {
  return (
    <section className="animate-rise-in relative mb-6 overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
      {/* Aurora wash — two slow-drifting orbs behind a dot field. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-dots opacity-40" />
        <div className="animate-aurora absolute -left-24 -top-32 h-72 w-72 rounded-full bg-brand-base/25 blur-3xl" />
        <div className="animate-aurora absolute -right-16 top-0 h-64 w-64 rounded-full bg-analytics-base/20 blur-3xl [animation-delay:-8s]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-base/40 to-transparent" />
      </div>

      <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge variant="healthy" dot pulse>
              <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
              AI Engine Active
            </StatusBadge>

            <StatusBadge variant="analytics" outline>
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Computer Vision
            </StatusBadge>

            <RoleBadge role={role} />
          </div>

          <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-ink text-balance sm:text-[1.75rem]">
            {greeting}
            {email && (
              <>
                ,{" "}
                <span className="text-gradient-brand">
                  {email.split("@")[0]}
                </span>
              </>
            )}
          </h2>

          <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-ink-muted text-pretty sm:text-[0.9375rem]">
            {headline}
          </p>

          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
            <HeroFact
              label="Sessions analysed"
              value={sessionCount.toLocaleString()}
              icon={Flame}
            />

            <HeroFact
              label="Pipeline last run"
              value={formatProcessed(lastProcessed)}
              icon={UploadCloud}
            />
          </dl>
        </div>

        {/* ── Quick actions ─────────────────────────────────────────── */}
        {quickActions.length > 0 && (
          <div className="lg:border-l lg:border-line lg:pl-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-subtle">
              Quick actions
            </p>

            <ul className="mt-3.5 space-y-2">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <li key={action.href}>
                    <Link
                      href={action.href}
                      className={cn(
                        "group/action flex items-center gap-3 rounded-xl border border-line bg-surface/80 px-3.5 py-3",
                        "transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-muted hover:shadow-card-hover"
                      )}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-deep transition-transform duration-200 group-hover/action:scale-110">
                        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">
                          {action.label}
                        </span>
                        <span className="block truncate text-xs text-ink-subtle">
                          {action.description}
                        </span>
                      </span>

                      <ArrowRight
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 text-ink-subtle transition-transform duration-200 group-hover/action:translate-x-1"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function HeroFact({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden="true" />

      <div>
        <dt className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
          {label}
        </dt>
        <dd className="font-display text-sm font-semibold text-ink tabular-nums">
          {value}
        </dd>
      </div>
    </div>
  );
}

function formatProcessed(value: string | null | undefined) {
  if (!value) return "Not yet run";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.valueOf())) return "Not yet run";

  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
