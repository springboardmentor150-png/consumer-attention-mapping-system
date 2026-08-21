"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";

import { useState, useEffect } from "react";

interface DisplayAttentionChartProps {
  leftDisplayViews: number;
  rightDisplayViews: number;
  centerViews?: number;
  aisleViews?: number;
}

export function DisplayAttentionChart({
  leftDisplayViews,
  rightDisplayViews,
  centerViews = 142,
  aisleViews = 98,
}: DisplayAttentionChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = [
    { name: "Left Display", views: leftDisplayViews, color: "#06b6d4", glow: "rgba(6, 182, 212, 0.5)" },
    { name: "Center Aisle", views: centerViews, color: "#a855f7", glow: "rgba(168, 85, 247, 0.5)" },
    { name: "Right Display", views: rightDisplayViews, color: "#3b82f6", glow: "rgba(59, 130, 246, 0.5)" },
    { name: "Promo Endcap", views: aisleViews, color: "#10b981", glow: "rgba(168, 85, 247, 0.5)" },
  ];

  if (!mounted) {
    return (
      <div className="rounded-2xl glass-card p-6 border border-white/10 relative overflow-hidden h-[340px] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl glass-card p-6 border border-white/10 relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            Display Attention Distribution
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Gaze vector fixations mapped across store shelf display zones
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400"></span> Left
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-500"></span> Center
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span> Right
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(13, 17, 28, 0.95)",
                borderColor: "rgba(6, 182, 212, 0.3)",
                borderRadius: "12px",
                boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.6)",
                color: "#fff",
                fontSize: "12px",
                padding: "8px 12px",
              }}
              cursor={{ fill: "rgba(255, 255, 255, 0.03)" }}
            />
            <Bar dataKey="views" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
