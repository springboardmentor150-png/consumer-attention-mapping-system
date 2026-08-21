"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Eye, PieChart as PieIcon } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ChartFrame, ChartLegend } from "@/components/charts/ChartFrame";
import { focusBreakdown } from "@/lib/analyticsDerived";
import type { AnalyticsSession } from "@/lib/api";
import {
  SERIES,
  tooltipItemStyle,
  tooltipLabelStyle,
  tooltipStyle,
  formatValue,
} from "@/lib/chartTheme";

/**
 * What shoppers looked at, as a share of all sessions.
 *
 * A donut rather than a pie so the total sits in the hole, where it reads
 * as the denominator for every slice around it.
 */
export function FocusBreakdown({
  sessions,
  id,
}: {
  sessions: AnalyticsSession[];
  id?: string;
}) {
  const data = useMemo(() => focusBreakdown(sessions), [sessions]);
  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  const legend = data.map((slice, index) => ({
    name: slice.name,
    color: SERIES[index % SERIES.length],
    value: total === 0 ? "" : `${Math.round((slice.value / total) * 100)}%`,
  }));

  return (
    <ChartFrame
      id={id}
      icon={Eye}
      variant="ai"
      title="Focus Distribution"
      description="Where shopper attention landed across every recorded session."
      height="h-64"
      action={
        <StatusBadge variant={total > 0 ? "ai" : "neutral"}>
          {total.toLocaleString()} sessions
        </StatusBadge>
      }
      empty={
        data.length === 0
          ? {
              icon: PieIcon,
              title: "No focus data yet",
              description:
                "Focus is written per session by the vision pipeline. Process a clip to populate it.",
            }
          : null
      }
      footer={<ChartLegend items={legend} className="mt-4 justify-center" />}
    >
      <div className="relative h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={tooltipLabelStyle}
              itemStyle={tooltipItemStyle}
              formatter={formatValue(
                (value) =>
                  `${value} (${Math.round((value / total) * 100)}%)`
              )}
            />

            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={data.length > 1 ? 3 : 0}
              cornerRadius={6}
              stroke="var(--color-surface)"
              strokeWidth={2}
              animationDuration={800}
            >
              {data.map((slice, index) => (
                <Cell
                  key={slice.name}
                  fill={SERIES[index % SERIES.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Total, centred in the donut hole. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-bold tabular-nums tracking-tight text-ink">
            {total.toLocaleString()}
          </span>

          <span className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
            Sessions
          </span>
        </div>
      </div>
    </ChartFrame>
  );
}
