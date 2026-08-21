"use client";

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  isPositive?: boolean;
  color?: "cyan" | "purple" | "emerald" | "amber";
  subtitle?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  change,
  isPositive = true,
  color = "cyan",
  subtitle,
}: StatCardProps) {
  const colorMap = {
    cyan: {
      border: "hover:border-cyan-500/40",
      glow: "group-hover:shadow-cyan-500/10",
      iconBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      valueColor: "text-cyan-300",
    },
    purple: {
      border: "hover:border-purple-500/40",
      glow: "group-hover:shadow-purple-500/10",
      iconBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      valueColor: "text-purple-300",
    },
    emerald: {
      border: "hover:border-emerald-500/40",
      glow: "group-hover:shadow-emerald-500/10",
      iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      valueColor: "text-emerald-300",
    },
    amber: {
      border: "hover:border-amber-500/40",
      glow: "group-hover:shadow-amber-500/10",
      iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      valueColor: "text-amber-300",
    },
  };

  const scheme = colorMap[color];

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl glass-card p-5 border border-white/10 ${scheme.border} transition-all duration-300 shadow-xl ${scheme.glow}`}
    >
      {/* Background Accent Gradient Glow */}
      <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-cyan-500/5 blur-2xl group-hover:bg-cyan-500/15 transition-all duration-500 pointer-events-none" />

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <div className={`p-2.5 rounded-xl border ${scheme.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-3">
        <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
          {value}
        </span>

        {change && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
              isPositive
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {change}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80"></span>
          {subtitle}
        </p>
      )}
    </div>
  );
}
