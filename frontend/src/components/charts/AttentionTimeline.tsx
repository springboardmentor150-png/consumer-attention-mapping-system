"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Clock } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ChartFrame, ChartStats } from "@/components/charts/ChartFrame";
import { attentionTimeline, peakHour } from "@/lib/analyticsDerived";
import type { AnalyticsSession } from "@/lib/api";
import {
  CHART_COLORS,
  CHART_INK,
  axisTick,
  lineCursor,
  tooltipItemStyle,
  tooltipLabelStyle,
  tooltipStyle,
} from "@/lib/chartTheme";

/**
 * Shopper volume and average dwell over time.
 *
 * Both series come from the same session rows, bucketed by the hour they
 * were recorded (see lib/analyticsDerived.ts) — sessions as a filled area,
 * dwell as a line on its own axis, because seconds and counts do not share
 * a scale.
 */
export function AttentionTimeline({
  sessions,
  id,
}: {
  sessions: AnalyticsSession[];
  id?: string;
}) {
  const data = useMemo(() => attentionTimeline(sessions), [sessions]);
  const peak = useMemo(() => peakHour(sessions), [sessions]);

  const averageDwell =
    sessions.length === 0
      ? 0
      : sessions.reduce((sum, session) => sum + session.dwell_time, 0) /
        sessions.length;

  return (
    <ChartFrame
      id={id}
      icon={Activity}
      variant="analytics"
      title="Attention Over Time"
      description="Shopper sessions and average dwell, bucketed by the hour they were captured."
      height="h-72 sm:h-80"
      action={
        <StatusBadge variant={data.length > 0 ? "analytics" : "neutral"}>
          {data.length} {data.length === 1 ? "interval" : "intervals"}
        </StatusBadge>
      }
      legend={
        data.length > 0
          ? [
              { name: "Sessions", color: CHART_COLORS.analytics },
              { name: "Avg dwell (s)", color: CHART_COLORS.brand },
            ]
          : undefined
      }
      empty={
        data.length < 2
          ? {
              icon: Clock,
              title: "Not enough history yet",
              description:
                "A trend needs sessions from at least two intervals. Process more footage to build one.",
            }
          : null
      }
      footer={
        data.length >= 2 ? (
          <ChartStats
            items={[
              {
                label: "Peak interval",
                value: peak ? peak.label : "—",
                variant: "analytics",
              },
              {
                label: "Busiest volume",
                value: peak ? `${peak.sessions} sessions` : "—",
              },
              {
                label: "Average dwell",
                value: `${averageDwell.toFixed(2)} sec`,
                variant: "brand",
              },
            ]}
          />
        ) : null
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="sessionsArea" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={CHART_COLORS.analytics}
                stopOpacity={0.3}
              />
              <stop
                offset="60%"
                stopColor={CHART_COLORS.analytics}
                stopOpacity={0.07}
              />
              <stop
                offset="100%"
                stopColor={CHART_COLORS.analytics}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="4 4"
            stroke={CHART_INK.grid}
            vertical={false}
          />

          <XAxis
            dataKey="label"
            tick={axisTick}
            tickLine={false}
            axisLine={{ stroke: CHART_INK.grid }}
            minTickGap={24}
            dy={6}
          />

          <YAxis
            yAxisId="sessions"
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={40}
            allowDecimals={false}
          />

          <YAxis
            yAxisId="dwell"
            orientation="right"
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={44}
            unit="s"
          />

          <Tooltip
            cursor={lineCursor}
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            itemStyle={tooltipItemStyle}
          />

          <Area
            yAxisId="sessions"
            type="monotone"
            dataKey="sessions"
            name="Sessions"
            stroke={CHART_COLORS.analytics}
            strokeWidth={2.5}
            fill="url(#sessionsArea)"
            activeDot={{ r: 4, strokeWidth: 2, stroke: CHART_INK.surface }}
            animationDuration={800}
          />

          <Line
            yAxisId="dwell"
            type="monotone"
            dataKey="dwell"
            name="Avg dwell (s)"
            stroke={CHART_COLORS.brand}
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: CHART_INK.surface }}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
