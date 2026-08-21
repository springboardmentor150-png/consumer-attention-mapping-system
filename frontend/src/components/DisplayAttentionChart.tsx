"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, PanelsTopLeft } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ChartFrame, ChartStats } from "@/components/charts/ChartFrame";
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

/**
 * Recorded gaze events per shelf zone.
 *
 * The two figures come straight from the analytics summary
 * (left_display_views / right_display_views) — the split shown beneath the
 * plot is arithmetic on those two numbers, not a separate measurement.
 */
export function DisplayAttentionChart({
  shelfAViews,
  shelfBViews,
  id,
}: {
  shelfAViews: number;
  shelfBViews: number;
  id?: string;
}) {
  const data = [
    { name: "Shelf A", views: shelfAViews, fill: CHART_COLORS.brand },
    { name: "Shelf B", views: shelfBViews, fill: CHART_COLORS.behavior },
  ];

  const total = shelfAViews + shelfBViews;
  const leader = shelfAViews >= shelfBViews ? "Shelf A" : "Shelf B";
  const gap = Math.abs(shelfAViews - shelfBViews);

  const share = (value: number) =>
    total === 0 ? "—" : `${Math.round((value / total) * 100)}%`;

  return (
    <ChartFrame
      id={id}
      icon={BarChart3}
      variant="brand"
      title="Shelf Attention"
      description="Recorded gaze events per shelf zone, from processed footage."
      action={
        <StatusBadge variant={total > 0 ? "brand" : "neutral"}>
          {total.toLocaleString()} {total === 1 ? "view" : "views"}
        </StatusBadge>
      }
      legend={
        total > 0
          ? data.map((series) => ({
              name: series.name,
              color: series.fill,
              value: share(series.views),
            }))
          : undefined
      }
      empty={
        total === 0
          ? {
              icon: PanelsTopLeft,
              title: "No gaze events recorded",
              description:
                "Process a video for this store and shelf attention will appear here.",
            }
          : null
      }
      footer={
        total > 0 ? (
          <ChartStats
            items={[
              { label: "Leading zone", value: leader, variant: "brand" },
              { label: "Gap", value: `${gap.toLocaleString()} views` },
              {
                label: "Split",
                value: `${share(shelfAViews)} / ${share(shelfBViews)}`,
              },
            ]}
          />
        ) : null
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 18, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="shelfA" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={CHART_COLORS.brand}
                stopOpacity={0.95}
              />
              <stop
                offset="100%"
                stopColor={CHART_COLORS.brand}
                stopOpacity={0.45}
              />
            </linearGradient>

            <linearGradient id="shelfB" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={CHART_COLORS.behavior}
                stopOpacity={0.95}
              />
              <stop
                offset="100%"
                stopColor={CHART_COLORS.behavior}
                stopOpacity={0.45}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="4 4"
            stroke={CHART_INK.grid}
            vertical={false}
          />

          <XAxis
            dataKey="name"
            tick={axisTick}
            tickLine={false}
            axisLine={{ stroke: CHART_INK.grid }}
            dy={6}
          />

          <YAxis
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={44}
            allowDecimals={false}
          />

          <Tooltip
            cursor={tooltipCursor}
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            itemStyle={tooltipItemStyle}
            formatter={formatValue((value) => value.toLocaleString(), "Views")}
          />

          <Bar
            dataKey="views"
            name="Views"
            radius={[10, 10, 4, 4]}
            maxBarSize={104}
            animationDuration={700}
          >
            {data.map((series, index) => (
              <Cell
                key={series.name}
                fill={index === 0 ? "url(#shelfA)" : "url(#shelfB)"}
              />
            ))}

            <LabelList
              dataKey="views"
              position="top"
              offset={10}
              className="fill-ink text-xs font-semibold"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
