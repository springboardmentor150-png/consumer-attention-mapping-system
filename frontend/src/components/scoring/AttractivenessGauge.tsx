"use client";

import React from "react";

interface Props {
  score?: number;
  label?: string;
}

export default function AttractivenessGauge({ score = 78.5, label = "Average Attractiveness" }: Props) {
  const getGrade = (s: number) => (s >= 80 ? "A" : s >= 65 ? "B" : s >= 50 ? "C" : s >= 35 ? "D" : "F");
  const grade = getGrade(score);

  return (
    <div
      style={{
        background: "rgba(13,21,38,0.8)",
        border: "1px solid rgba(30,45,74,0.6)",
        borderRadius: 14,
        padding: "20px 22px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#8ba3c7" }}>{label}</span>
        <div style={{ fontSize: 32, fontWeight: 900, color: "#60a5fa", marginTop: 4 }}>
          {score.toFixed(1)} <span style={{ fontSize: 18, color: "#a78bfa" }}>/ 100</span>
        </div>
      </div>

      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: "50%",
          background: "linear-gradient(135deg,#3b82f6,#6366f1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontSize: 24,
          fontWeight: 900,
        }}
      >
        {grade}
      </div>
    </div>
  );
}
