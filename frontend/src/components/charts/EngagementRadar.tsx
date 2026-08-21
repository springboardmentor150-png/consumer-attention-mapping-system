"use client";

import { useMemo } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Radar as RadarIcon, Compass } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { engagementProfile } from "@/lib/analyticsDerived";
import type { AnalyticsSession } from "@/lib/api";
import {
  CHART_INK,
  SERIES,
  axisTick,
  tooltipItemStyle,
  tooltipLabelStyle,
  tooltipStyle,
  formatValue,
} from "@/lib/chartTheme";

/**
 * Comparative engagement shape per frame region.
 *
 * Dwell, gaze shifts, shelf visits, path length and session count are on
 * different units, so each axis is normalised against the strongest region
 * on that axis — 100 means "the best region here", not "100 seconds". The
 * absolute values stay in the session table below.
 */
export function EngagementRadar({
  sessions,
  id,
}: {
  sessions: AnalyticsSession[];
  id?: string;
}) {
  const { axes, regions } = useMemo(
    () => engagementProfile(sessions),
    [sessions]
  );

  return (
    <ChartFrame
      id={id}
      icon={RadarIcon}
      variant="behavior"
      title="Zone Engagement Profile"
      description="Each axis is scaled against the strongest zone, so the shapes compare directly."
      height="h-64"
      action={
        <StatusBadge variant={regions.length > 0 ? "behavior" : "neutral"}>
          {regions.length} {regions.length === 1 ? "zone" : "zones"}
        </StatusBadge>
      }
      legend={regions.map((region, index) => ({
        name: region,
        color: SERIES[index % SERIES.length],
      }))}
      empty={
        axes.length === 0
          ? {
              icon: Compass,
              title: "No zone activity recorded",
              description:
                "Zone profiles are built from session rows. Process footage to compare zones.",
            }
          : null
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={axes} outerRadius="72%">
          <PolarGrid stroke={CHART_INK.grid} />

          <PolarAngleAxis dataKey="metric" tick={axisTick} />

          <PolarRadiusAxis
            domain={[0, 100]}
            tick={false}
            axisLine={false}
            tickCount={5}
          />

          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            itemStyle={tooltipItemStyle}
            formatter={formatValue((value) => `${value} / 100 relative`)}
          />

          {regions.map((region, index) => (
            <Radar
              key={region}
              name={region}
              dataKey={region}
              stroke={SERIES[index % SERIES.length]}
              fill={SERIES[index % SERIES.length]}
              fillOpacity={0.16}
              strokeWidth={2}
              animationDuration={800}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
