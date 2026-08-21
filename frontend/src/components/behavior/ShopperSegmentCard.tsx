"use client";

import React from "react";
import { SegmentDistribution } from "../../types";

interface Props {
  segment: SegmentDistribution;
}

const DESCRIPTIONS: Record<string, { desc: string; icon: string; color: string }> = {
  explorer: {
    desc: "Browses entire store with long dwell time and high path coverage.",
    icon: "🗺️",
    color: "#3b82f6",
  },
  quick_buyer: {
    desc: "Fast entry-to-exit journey targeting specific essential items.",
    icon: "⚡",
    color: "#10b981",
  },
  comparison_shopper: {
    desc: "Studies shelf options carefully with high gaze shifts across products.",
    icon: "🔍",
    color: "#f59e0b",
  },
  impulse_buyer: {
    desc: "Medium dwell time with unplanned stops at promotional displays.",
    icon: "🎁",
    color: "#ef4444",
  },
  brand_loyal: {
    desc: "Direct path to specific preferred brands with repeat visits.",
    icon: "⭐",
    color: "#8b5cf6",
  },
};

function formatDwell(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function ShopperSegmentCard({ segment }: Props) {
  const meta = DESCRIPTIONS[segment.segment_type] || {
    desc: "Behavioral segment based on trajectory and gaze data.",
    icon: "👤",
    color: "#6366f1",
  };

  const title = segment.segment_type
    .replace("_", " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div
      style={{
        background: "rgba(13,21,38,0.8)",
        border: "1px solid rgba(30,45,74,0.6)",
        borderRadius: 14,
        padding: "20px 22px",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: meta.color,
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 24 }}>{meta.icon}</span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: meta.color,
            background: `${meta.color}15`,
            border: `1px solid ${meta.color}40`,
            padding: "4px 10px",
            borderRadius: 8,
          }}
        >
          {segment.percentage}% of Shoppers
        </span>
      </div>

      <div>
        <h4 style={{ fontSize: 16, fontWeight: 900, color: "#f0f4ff", marginBottom: 4 }}>
          {title}
        </h4>
        <p style={{ fontSize: 12, color: "#8ba3c7", lineHeight: 1.5 }}>{meta.desc}</p>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 10,
          borderTop: "1px solid rgba(30,45,74,0.4)",
          fontSize: 12,
        }}
      >
        <span style={{ color: "#4a6080" }}>Shopper Count: <strong style={{ color: "#f0f4ff" }}>{segment.count}</strong></span>
        <span style={{ color: "#4a6080" }}>Avg Dwell: <strong style={{ color: "#34d399" }}>{formatDwell(segment.avg_dwell_seconds)}</strong></span>
      </div>
    </div>
  );
}
