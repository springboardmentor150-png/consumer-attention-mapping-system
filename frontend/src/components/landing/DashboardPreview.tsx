import {
  Activity,
  Clock,
  Eye,
  Flame,
  LayoutDashboard,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Product shot for the hero — a scaled-down rendering of the real
 * dashboard's structure, drawn with the same tokens as the app itself.
 *
 * The figures shown are illustrative sample values, labelled as such in the
 * chrome, so the screenshot reads as a product preview rather than a claim
 * about a particular store.
 */
export function DashboardPreview({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "overflow-hidden rounded-2xl border border-line bg-surface shadow-pop",
        className
      )}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-line bg-surface-sunken/70 px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-critical-base/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning-base/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-healthy-base/60" />
        </span>

        <span className="mx-auto rounded-md bg-surface px-3 py-1 font-mono text-[10px] text-ink-subtle">
          cams.app/dashboard · sample data
        </span>
      </div>

      <div className="grid grid-cols-[auto_1fr]">
        {/* Rail */}
        <div className="hidden border-r border-line bg-surface-sunken/40 p-3 sm:block">
          <div className="space-y-2">
            {[LayoutDashboard, Flame, Users, Sparkles].map((Icon, index) => (
              <span
                key={index}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  index === 0
                    ? "bg-brand-soft text-brand-deep"
                    : "text-ink-subtle"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {/* KPI row */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MiniStat
              icon={Users}
              label="Customers"
              value="1,284"
              tone="analytics"
              trend="+12%"
            />
            <MiniStat
              icon={Clock}
              label="Avg dwell"
              value="8.4s"
              tone="behavior"
              trend="+4%"
            />
            <MiniStat
              icon={Eye}
              label="Shelf A views"
              value="742"
              tone="brand"
              trend="+21%"
            />
            <MiniStat
              icon={Activity}
              label="Attention"
              value="76"
              tone="ai"
              trend="+6%"
            />
          </div>

          {/* Plot + side panel */}
          <div className="mt-3 grid gap-3 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-xl border border-line p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-ink">
                  Attention over time
                </span>

                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[9px] font-medium text-brand-deep">
                  Live
                </span>
              </div>

              <svg viewBox="0 0 300 96" className="mt-3 w-full" fill="none">
                <defs>
                  <linearGradient id="preview-area" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--color-brand-base)"
                      stopOpacity="0.35"
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-brand-base)"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>

                {[24, 48, 72].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="300"
                    y2={y}
                    stroke="var(--color-line)"
                    strokeDasharray="3 4"
                  />
                ))}

                <path
                  d="M0 74 C 26 70, 40 46, 62 44 S 96 60, 118 50 S 152 22, 176 28 S 214 54, 238 38 S 274 14, 300 20 L300 96 L0 96 Z"
                  fill="url(#preview-area)"
                />

                <path
                  d="M0 74 C 26 70, 40 46, 62 44 S 96 60, 118 50 S 152 22, 176 28 S 214 54, 238 38 S 274 14, 300 20"
                  stroke="var(--color-brand-base)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                <path
                  d="M0 84 C 30 80, 52 74, 78 76 S 128 66, 156 70 S 216 58, 248 62 S 282 52, 300 56"
                  stroke="var(--color-analytics-base)"
                  strokeWidth="2"
                  strokeDasharray="5 4"
                  strokeLinecap="round"
                />

                <circle cx="300" cy="20" r="3.5" fill="var(--color-brand-base)" />
              </svg>
            </div>

            <div className="rounded-xl border border-line p-3.5">
              <span className="text-[11px] font-semibold text-ink">
                Shelf attractiveness
              </span>

              <div className="mt-3 space-y-3">
                {[
                  { label: "Shelf A", value: 84, bar: "bg-healthy-base" },
                  { label: "Shelf B", value: 61, bar: "bg-analytics-base" },
                  { label: "Endcap", value: 38, bar: "bg-warning-base" },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-ink-muted">{row.label}</span>
                      <span className="font-semibold tabular-nums text-ink">
                        {row.value}
                      </span>
                    </div>

                    <span className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                      <span
                        className={cn("rounded-full", row.bar)}
                        style={{ width: `${row.value}%` }}
                      />
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-lg bg-ai-soft/70 p-2.5">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-ai-strong">
                  <Sparkles className="h-3 w-3" />
                  AI recommendation
                </span>

                <p className="mt-1 text-[10px] leading-relaxed text-ink-muted">
                  Move high-margin SKUs to Shelf A eye level — highest gaze
                  retention this period.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tone,
  trend,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  tone: "analytics" | "behavior" | "brand" | "ai";
  trend: string;
}) {
  const chip = {
    analytics: "bg-analytics-soft text-analytics-strong",
    behavior: "bg-behavior-soft text-behavior-strong",
    brand: "bg-brand-soft text-brand-deep",
    ai: "bg-ai-soft text-ai-strong",
  }[tone];

  return (
    <div className="rounded-xl border border-line p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-medium text-ink-muted">{label}</span>

        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md",
            chip
          )}
        >
          <Icon className="h-3 w-3" />
        </span>
      </div>

      <p className="mt-1.5 font-display text-lg font-bold leading-none tracking-tight text-ink tabular-nums">
        {value}
      </p>

      <span className="mt-1.5 inline-block rounded bg-healthy-soft px-1 py-0.5 text-[9px] font-semibold text-healthy-strong">
        {trend}
      </span>
    </div>
  );
}
