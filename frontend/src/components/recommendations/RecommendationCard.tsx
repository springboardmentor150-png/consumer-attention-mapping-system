"use client";

import React from "react";
import { RecommendationItem } from "../../types";

interface Props {
  recommendation: RecommendationItem;
  onDismiss?: (id: string) => void;
}

const PRIORITY_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  high: { border: "rgba(239,68,68,0.5)", bg: "rgba(239,68,68,0.1)", text: "#f87171" },
  medium: { border: "rgba(245,158,11,0.5)", bg: "rgba(245,158,11,0.1)", text: "#fbbf24" },
  low: { border: "rgba(16,185,129,0.5)", bg: "rgba(16,185,129,0.1)", text: "#34d399" },
};

export default function RecommendationCard({ recommendation, onDismiss }: Props) {
  const pStr = (typeof recommendation.priority === "string" ? recommendation.priority : (recommendation.priority as any)?.value || "medium").toLowerCase();
  const pMeta = PRIORITY_COLORS[pStr] || PRIORITY_COLORS.medium;

  return (
    <div
      style={{
        background: "rgba(13,21,38,0.85)",
        borderLeft: `4px solid ${pMeta.text}`,
        borderTop: "1px solid rgba(30,45,74,0.6)",
        borderRight: "1px solid rgba(30,45,74,0.6)",
        borderBottom: "1px solid rgba(30,45,74,0.6)",
        borderRadius: 14,
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <h4 style={{ fontSize: 16, fontWeight: 900, color: "#f0f4ff", flex: 1, paddingRight: 12 }}>
          {recommendation.title}
        </h4>
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: pMeta.text,
            background: pMeta.bg,
            border: `1px solid ${pMeta.border}`,
            padding: "3px 8px",
            borderRadius: 6,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {pStr} Priority
        </span>
      </div>

      <p style={{ fontSize: 13, color: "#8ba3c7", lineHeight: 1.5 }}>
        {recommendation.description}
      </p>

      <div
        style={{
          fontSize: 11,
          fontStyle: "italic",
          color: "#4a6080",
          background: "rgba(5,15,35,0.5)",
          padding: "6px 10px",
          borderRadius: 6,
        }}
      >
        Trigger: {recommendation.trigger_reason}
      </div>

      <div
        style={{
          background: "rgba(59,130,246,0.08)",
          border: "1px solid rgba(59,130,246,0.25)",
          borderRadius: 10,
          padding: "10px 14px",
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 800, color: "#60a5fa", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>
          💡 Suggested Action
        </div>
        <div style={{ fontSize: 12, color: "#f0f4ff", fontWeight: 600 }}>
          {recommendation.suggested_action}
        </div>
      </div>

      {recommendation.expected_impact && (
        <div style={{ fontSize: 12, color: "#34d399", fontWeight: 700 }}>
          ✨ Impact: {recommendation.expected_impact}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 10,
          borderTop: "1px solid rgba(30,45,74,0.4)",
          fontSize: 11,
          color: "#4a6080",
        }}
      >
        <span>Generated: {new Date(recommendation.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
        {onDismiss && (
          <button
            onClick={() => onDismiss(recommendation.id)}
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#f87171",
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
