"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { AccentIcon } from "@/components/ui/AccentIcon";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { tone, type Tone } from "@/lib/tone";

/**
 * Shared chrome for every chart panel: icon, title, description, legend and
 * the empty state.
 *
 * Charts differ only in their plot, so keeping the frame in one place is
 * what makes eight panels on the dashboard line up at exactly the same
 * header height, legend position and plot inset.
 */
export function ChartFrame({
  icon,
  variant = "analytics",
  title,
  description,
  action,
  legend,
  empty,
  height = "h-64 sm:h-72",
  footer,
  id,
  className,
  children,
}: {
  icon: LucideIcon;
  variant?: Tone;
  title: string;
  description?: string;
  action?: ReactNode;
  legend?: { name: string; color: string }[];
  /** When set, the plot is replaced by this empty state. */
  empty?: { title: string; description?: string; icon: LucideIcon } | null;
  height?: string;
  /** Rendered below the plot — usually a <ChartStats />. Hidden when empty. */
  footer?: ReactNode;
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card id={id} className={cn("animate-rise-in p-5 sm:p-6", className)}>
      <CardHeader
        icon={<AccentIcon icon={icon} variant={variant} />}
        title={title}
        description={description}
        action={action}
      />

      {empty ? (
        <EmptyState
          icon={empty.icon}
          title={empty.title}
          description={empty.description}
          variant={variant}
          compact
        />
      ) : (
        <>
          {legend && legend.length > 0 && (
            <ChartLegend items={legend} className="mb-4" />
          )}

          <div className={height}>{children}</div>

          {footer}
        </>
      )}
    </Card>
  );
}

/**
 * Custom legend.
 *
 * Placed above the plot rather than below it, so the series colours are
 * readable even when a bar is zero-height and the plot itself is blank.
 */
export function ChartLegend({
  items,
  className,
}: {
  items: { name: string; color: string; value?: string }[];
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-2", className)}>
      {items.map((item) => (
        <li
          key={item.name}
          className="inline-flex items-center gap-2 text-xs font-medium text-ink-muted"
        >
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rounded-[3px]"
            style={{ background: item.color }}
          />
          {item.name}
          {item.value && (
            <span className="tabular-nums text-ink-subtle">{item.value}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * A metric summary strip for the foot of a chart — "peak", "median" and so
 * on. Keeps derived figures out of the plot itself.
 */
export function ChartStats({
  items,
  className,
}: {
  items: { label: string; value: string; variant?: Tone }[];
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-3",
        className
      )}
    >
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
            {item.label}
          </dt>

          <dd
            className={cn(
              "mt-1 font-display text-lg font-semibold tabular-nums",
              item.variant ? tone(item.variant).text : "text-ink"
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
