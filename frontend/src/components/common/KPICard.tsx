import React from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change: number; // positive or negative percentage change
  changeLabel: string;
}

export function KPICard({ title, value, icon, change, changeLabel }: KPICardProps) {
  const isPositive = change >= 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-md relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
      {/* Subtle hover accent light */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="flex flex-col gap-4 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {title}
          </span>
          <div className="p-2 bg-slate-950 border border-slate-800/80 rounded-xl group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-none">
            {value}
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded leading-none ${
                isPositive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {isPositive ? (
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              {Math.abs(change)}%
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {changeLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
