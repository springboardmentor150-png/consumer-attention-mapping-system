"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Hourglass, Timer } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ChartFrame, ChartStats } from "@/components/charts/ChartFrame";
import { dwellDistribution } from "@/lib/analyticsDerived";
import type { AnalyticsSession } from "@/lib/api";
import {
  CHART_COLORS,
  CHART_INK,
  axisTick,
  tooltipCursor,
  tooltipItemStyle,
  tooltipLabelStyle,
  tooltipStyle,
  formatValue,
} from "@/lib/chartTheme";

// Longer dwell reads as deeper engagement, so the bands warm from teal
// through emerald as they lengthen. Ordered to match dwellDistribution().
const BAND_COLORS = [
  CHART_COLORS.analytics,
  CHART_COLORS.behavior,
  CHART_COLORS.brand,
  CHART_COLORS.warning,
  CHART_COLORS.ai,
];

/**
 * How long shoppers lingered, as a histogram over fixed bands.
 *
 * Fixed bands rather than quantiles, so the shape stays comparable between
 * two runs of very different sizes.
 */
export function DwellDistribution({
  sessions,
  id,
}: {
  sessions: AnalyticsSession[];
  id?: string;
}) {
  const data = useMemo(() => dwellDistribution(sessions), [sessions]);
  const total = data.reduce((sum, band) => sum + band.shoppers, 0);

  const longest = useMemo(
    () =>
      sessions.reduce(
        (best, session) => Math.max(best, session.dwell_time),
        0
      ),
    [sessions]
  );

  const busiest = data.reduce(
    (best, band) => (band.shoppers > best.shoppers ? band : best),
    data[0] ?? { band: "—", shoppers: 0 }
  );

  const engaged = data
    .slice(2)
    .reduce((sum, band) => sum + band.shoppers, 0);

  return (
    <ChartFrame
      id={id}
      icon={Hourglass}
      variant="brand"
      title="Dwell Time Distribution"
      description="Session counts per dwell band — the shape of how long shoppers stayed."
      height="h-64"
      action={
        <StatusBadge variant={total > 0 ? "brand" : "neutral"}>
          {total.toLocaleString()} sessions
        </StatusBadge>
      }
      empty={
        total === 0
          ? {
              icon: Timer,
              title: "No dwell measurements yet",
              description:
                "Dwell time is recorded per shopper session once footage has been processed.",
            }
          : null
      }
      footer={
        total > 0 ? (
          <ChartStats
            items={[
              {
                label: "Most common",
                value: busiest.band,
                variant: "brand",
              },
              {
                label: "Longest dwell",
                value: `${longest.toFixed(2)} sec`,
              },
              {
                label: "Engaged (5s+)",
                value: `${Math.round((engaged / total) * 100)}%`,
                variant: "healthy",
              },
            ]}
          />
        ) : null
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid
            strokeDasharray="4 4"
            stroke={CHART_INK.grid}
            vertical={false}
          />

          <XAxis
            dataKey="band"
            tick={axisTick}
            tickLine={false}
            axisLine={{ stroke: CHART_INK.grid }}
            dy={6}
          />

          <YAxis
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={40}
            allowDecimals={false}
          />

          <Tooltip
            cursor={tooltipCursor}
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            itemStyle={tooltipItemStyle}
            formatter={formatValue((value) => `${value} sessions`, "Shoppers")}
          />

          <Bar
            dataKey="shoppers"
            name="Shoppers"
            radius={[8, 8, 3, 3]}
            maxBarSize={72}
            animationDuration={700}
          >
            {data.map((band, index) => (
              <Cell
                key={band.band}
                fill={BAND_COLORS[index % BAND_COLORS.length]}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
