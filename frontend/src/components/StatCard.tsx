import { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { AccentIcon } from "@/components/ui/AccentIcon";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Sparkline } from "@/components/ui/Sparkline";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/tone";

/**
 * The KPI tile.
 *
 * One number, said once and said large, with the icon, trend and sparkline
 * arranged around it. Everything past the value is optional, so the same
 * component serves a bare count and a fully instrumented metric without
 * two layouts drifting apart.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "analytics",
  hint,
  trend,
  unit,
  series,
  decimals = 0,
  loading = false,
  footer,
  className,
  style,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  /** Semantic tone for the icon chip and sparkline — see src/lib/tone.ts. */
  accent?: Tone;
  /** Short qualifier under the value, e.g. "across 3 stores". */
  hint?: string;
  /** Usually a <TrendIndicator />. */
  trend?: ReactNode;
  /** Rendered small and muted after the value, e.g. "sec". */
  unit?: string;
  /** Values for the inline sparkline. Fewer than two points hides it. */
  series?: number[];
  /** Decimal places for a numeric value. */
  decimals?: number;
  loading?: boolean;
  /** Full-width slot below the sparkline. */
  footer?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <Card
      glow={accent}
      className={cn(
        "animate-rise-in stagger p-5",
        "hover:-translate-y-1 hover:shadow-card-hover",
        className
      )}
      style={style}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="pt-0.5 text-[0.8125rem] font-medium leading-tight text-ink-muted">
          {label}
        </p>

        <AccentIcon icon={Icon} variant={accent} />
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-display text-[2rem] font-bold leading-none tracking-tight text-ink tabular-nums",
            loading && "animate-pulse text-ink-subtle"
          )}
        >
          {loading ? (
            "—"
          ) : typeof value === "number" ? (
            <AnimatedNumber value={value} decimals={decimals} />
          ) : (
            value
          )}
        </span>

        {unit && !loading && (
          <span className="text-sm font-medium text-ink-subtle">{unit}</span>
        )}
      </div>

      {(hint || trend) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {trend}
          {hint && <span className="text-xs text-ink-subtle">{hint}</span>}
        </div>
      )}

      {series && series.length > 1 && (
        <Sparkline values={series} variant={accent} className="mt-4" />
      )}

      {footer && (
        <div className="mt-4 border-t border-line pt-3 text-xs text-ink-subtle">
          {footer}
        </div>
      )}
    </Card>
  );
}
