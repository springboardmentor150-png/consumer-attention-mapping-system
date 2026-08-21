"use client";

import React from "react";

interface Props {
  sessionId?: string;
  metrics?: {
    total_distance: number;
    avg_speed: number;
    direction_changes: number;
    coverage_area: number;
    path_duration_seconds: number;
  };
  zones?: string[];
  pathEntropy?: number;
}

export default function JourneyPathViewer({
  sessionId = "N/A",
  metrics = { total_distance: 0, avg_speed: 0, direction_changes: 0, coverage_area: 0, path_duration_seconds: 0 },
  zones = [],
  pathEntropy = 0,
}: Props) {
  return (
    <div
      style={{
        background: "rgba(13,21,38,0.7)",
        border: "1px solid rgba(30,45,74,0.6)",
        borderRadius: 16,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#f0f4ff" }}>
          Shopper Journey Analytics
        </h3>
        <span
          style={{
            fontSize: 11,
            color: "#60a5fa",
            background: "rgba(59,130,246,0.1)",
            padding: "4px 10px",
            borderRadius: 6,
            fontFamily: "monospace",
          }}
        >
          Session #{sessionId.slice(0, 8)}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <div style={{ background: "rgba(5,15,35,0.6)", padding: 12, borderRadius: 10 }}>
          <div style={{ fontSize: 11, color: "#4a6080" }}>Total Distance</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#60a5fa" }}>
            {metrics.total_distance}m
          </div>
        </div>
        <div style={{ background: "rgba(5,15,35,0.6)", padding: 12, borderRadius: 10 }}>
          <div style={{ fontSize: 11, color: "#4a6080" }}>Avg Walking Speed</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#34d399" }}>
            {metrics.avg_speed} m/s
          </div>
        </div>
        <div style={{ background: "rgba(5,15,35,0.6)", padding: 12, borderRadius: 10 }}>
          <div style={{ fontSize: 11, color: "#4a6080" }}>Direction Changes</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fbbf24" }}>
            {metrics.direction_changes}
          </div>
        </div>
        <div style={{ background: "rgba(5,15,35,0.6)", padding: 12, borderRadius: 10 }}>
          <div style={{ fontSize: 11, color: "#4a6080" }}>Path Entropy</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#c084fc" }}>
            {pathEntropy}
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#8ba3c7", marginBottom: 8 }}>
          Zone Sequence Visited
        </div>
        {zones.length === 0 ? (
          <span style={{ fontSize: 12, color: "#4a6080" }}>No specific zone sequence recorded.</span>
        ) : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {zones.map((z, idx) => (
              <React.Fragment key={idx}>
                <span
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    borderRadius: 6,
                    background: "rgba(99,102,241,0.15)",
                    color: "#a78bfa",
                    border: "1px solid rgba(99,102,241,0.3)",
                    fontWeight: 600,
                  }}
                >
                  {z}
                </span>
                {idx < zones.length - 1 && <span style={{ color: "#4a6080", fontSize: 12 }}>→</span>}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
