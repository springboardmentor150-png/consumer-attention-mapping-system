"use client";

import React from "react";

interface Props {
  shelfName?: string;
  attentionScore?: number;
}

export default function ShelfHeatmap({ shelfName = "Shelf A", attentionScore = 75 }: Props) {
  return (
    <div
      style={{
        background: "rgba(13,21,38,0.7)",
        border: "1px solid rgba(30,45,74,0.6)",
        borderRadius: 14,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h4 style={{ fontSize: 14, fontWeight: 800, color: "#f0f4ff" }}>{shelfName} Attention</h4>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#34d399" }}>{attentionScore}% Score</span>
      </div>

      <div
        style={{
          height: 120,
          background: "linear-gradient(90deg, rgba(59,130,246,0.2) 0%, rgba(245,158,11,0.5) 50%, rgba(239,68,68,0.8) 100%)",
          borderRadius: 10,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontWeight: 800,
          fontSize: 13,
          boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)",
        }}
      >
        Shelf Gaze Gradient
      </div>
    </div>
  );
}
