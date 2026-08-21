"use client";

import { ShelfAttractivenessItem } from "@/lib/api";
import { Sparkles, Clock, Touchpad, ShoppingBag, CheckCircle, RotateCcw, TrendingUp, Trophy, Download } from "lucide-react";

interface AttractivenessScoreCardProps {
  shelf: ShelfAttractivenessItem;
  rankBadge?: boolean;
}

export function AttractivenessScoreCard({ shelf, rankBadge = true }: AttractivenessScoreCardProps) {
  const breakdown = shelf.metric_breakdown;
  const score = shelf.attractiveness_score;

  const handleExportSingleShelf = () => {
    const headers = [
      "Rank",
      "Shelf ID",
      "Shelf Name",
      "Store ID",
      "Attractiveness Score",
      "Attention Duration (s)",
      "Interaction Count",
      "Unique Visitors",
      "Pickup Rate (%)",
      "Conversion Rate (%)",
      "Repeat Rate (%)",
      "Key Recommendations",
    ];
    const row = [
      shelf.rank,
      shelf.shelf_id,
      `"${shelf.shelf_name.replace(/"/g, '""')}"`,
      shelf.store_id || 1,
      shelf.attractiveness_score,
      shelf.attention_duration_seconds,
      shelf.interaction_count,
      shelf.unique_visitors,
      Math.round(shelf.pickup_rate * 1000) / 10,
      Math.round(shelf.purchase_conversion_rate * 1000) / 10,
      Math.round(shelf.repeat_engagement_rate * 1000) / 10,
      `"${(shelf.recommendations || []).join(' | ').replace(/"/g, '""')}"`,
    ];
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), row.join(",")].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `shelf_${shelf.shelf_id}_analytics_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Determine score tier color
  const getScoreColor = (val: number) => {
    if (val >= 80) return "from-emerald-400 to-cyan-400 text-emerald-400";
    if (val >= 50) return "from-cyan-400 to-purple-400 text-cyan-400";
    if (val >= 25) return "from-amber-400 to-orange-400 text-amber-400";
    return "from-slate-400 to-slate-500 text-slate-400";
  };

  const metricsConfig = [
    {
      key: "attention_duration",
      name: "Attention Duration",
      weight: "35%",
      icon: Clock,
      color: "#06b6d4",
      bgBadge: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
      data: breakdown?.attention_duration,
      rawLabel: breakdown?.attention_duration?.raw_value_seconds !== undefined
        ? `${breakdown.attention_duration.raw_value_seconds}s total dwell`
        : `${shelf.attention_duration_seconds}s`,
    },
    {
      key: "interaction_frequency",
      name: "Interaction Frequency",
      weight: "25%",
      icon: Touchpad,
      color: "#a855f7",
      bgBadge: "bg-purple-500/10 text-purple-300 border-purple-500/30",
      data: breakdown?.interaction_frequency,
      rawLabel: breakdown?.interaction_frequency?.raw_count !== undefined
        ? `${breakdown.interaction_frequency.raw_count} interactions`
        : `${shelf.interaction_count} visits`,
    },
    {
      key: "pickup_rate",
      name: "Product Pickup Rate",
      weight: "20%",
      icon: ShoppingBag,
      color: "#3b82f6",
      bgBadge: "bg-blue-500/10 text-blue-300 border-blue-500/30",
      data: breakdown?.pickup_rate,
      rawLabel: `${Math.round(shelf.pickup_rate * 100)}% pickup ratio`,
    },
    {
      key: "purchase_conversion",
      name: "Purchase Conversion Rate",
      weight: "15%",
      icon: CheckCircle,
      color: "#10b981",
      bgBadge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
      data: breakdown?.purchase_conversion,
      rawLabel: `${Math.round(shelf.purchase_conversion_rate * 100)}% conversion ratio`,
    },
    {
      key: "repeat_engagement",
      name: "Repeat Engagement Rate",
      weight: "5%",
      icon: RotateCcw,
      color: "#f59e0b",
      bgBadge: "bg-amber-500/10 text-amber-300 border-amber-500/30",
      data: breakdown?.repeat_engagement,
      rawLabel: `${Math.round(shelf.repeat_engagement_rate * 100)}% repeat interaction`,
    },
  ];

  return (
    <div className="rounded-3xl glass-card p-6 border border-white/10 space-y-6 relative overflow-hidden group">
      {/* Top Shelf Name & Overall Score Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            {rankBadge && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                <Trophy className="w-3 h-3 text-cyan-400" />
                RANK #{shelf.rank}
              </span>
            )}
            <span className="text-xs font-mono text-slate-400">
              SHELF ID: #{shelf.shelf_id}
            </span>
          </div>
          <h4 className="text-lg font-extrabold text-white tracking-tight">
            {shelf.shelf_name}
          </h4>
        </div>

        {/* Circular / Large Score Badge & Export Button */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={handleExportSingleShelf}
            className="p-3 rounded-2xl bg-white/[0.04] hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 transition-all flex items-center gap-2 text-xs font-semibold cursor-pointer shadow-sm"
            title={`Export analytics for ${shelf.shelf_name} (.csv)`}
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Export Shelf (.csv)</span>
          </button>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-white/10">
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Attractiveness Score
              </span>
              <div className="flex items-baseline justify-end gap-1">
                <span className="text-3xl font-black font-mono text-white bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
                  {score}
                </span>
                <span className="text-xs font-mono text-slate-400">/100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Metric Breakdown Progress Stack */}
      <div className="space-y-3.5 pt-2 border-t border-white/5">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Weighted Formula Metric Breakdown:</span>
          <span className="text-[11px] text-cyan-400">35% / 25% / 20% / 15% / 5%</span>
        </div>

        <div className="space-y-3">
          {metricsConfig.map((m) => {
            const Icon = m.icon;
            const points = m.data?.points_contributed ?? 0;
            const maxPoints = parseInt(m.weight, 10);
            const fillPct = maxPoints > 0 ? Math.min(100, Math.max(0, (points / maxPoints) * 100)) : 0;

            return (
              <div key={m.key} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="p-1.5 rounded-lg"
                      style={{ backgroundColor: `${m.color}20`, color: m.color }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-white">{m.name}</span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${m.bgBadge}`}>
                      Weight: {m.weight}
                    </span>
                  </div>

                  <div className="font-mono text-right">
                    <span className="text-sm font-bold text-white">
                      +{points.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-slate-500"> / {maxPoints} pts</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${fillPct}%`,
                      backgroundColor: m.color,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>{m.rawLabel}</span>
                  <span>{Math.round(fillPct)}% of metric quota</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actionable Rule-Based Recommendations Panel */}
      {shelf.recommendations && shelf.recommendations.length > 0 && (
        <div className="pt-2 border-t border-white/5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white font-mono uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Merchandising & Placement Insights:</span>
          </div>

          <div className="space-y-2">
            {shelf.recommendations.map((rec, rIdx) => {
              const isWarning = rec.toLowerCase().includes("low") || rec.toLowerCase().includes("reposition") || rec.toLowerCase().includes("investigate");
              const isSuccess = rec.toLowerCase().includes("strong performer") || rec.toLowerCase().includes("well");

              return (
                <div
                  key={rIdx}
                  className={`p-3 rounded-2xl text-xs flex items-start gap-2.5 border ${
                    isWarning
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-200"
                      : isSuccess
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
                      : "bg-cyan-500/10 border-cyan-500/20 text-cyan-200"
                  }`}
                >
                  <span className="text-base leading-none">
                    {isWarning ? "⚠️" : isSuccess ? "🚀" : "💡"}
                  </span>
                  <span className="leading-relaxed font-sans">{rec}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
