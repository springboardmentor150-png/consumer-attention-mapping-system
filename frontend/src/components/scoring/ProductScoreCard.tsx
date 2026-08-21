"use client";

import React from "react";
import { ProductScoreDetail } from "../../types";

interface Props {
  product: ProductScoreDetail;
  rank?: number;
}

const GRADE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: "rgba(16,185,129,0.15)", text: "#34d399", border: "rgba(16,185,129,0.4)" },
  B: { bg: "rgba(59,130,246,0.15)", text: "#60a5fa", border: "rgba(59,130,246,0.4)" },
  C: { bg: "rgba(245,158,11,0.15)", text: "#fbbf24", border: "rgba(245,158,11,0.4)" },
  D: { bg: "rgba(249,115,22,0.15)", text: "#fb923c", border: "rgba(249,115,22,0.4)" },
  F: { bg: "rgba(239,68,68,0.15)", text: "#f87171", border: "rgba(239,68,68,0.4)" },
};

export default function ProductScoreCard({ product, rank }: Props) {
  const gradeMeta = GRADE_COLORS[product.grade] || GRADE_COLORS.C;

  const components = [
    { label: "Attention Duration (35%)", val: product.attention_duration_score, color: "#60a5fa" },
    { label: "Interaction Freq (25%)", val: product.interaction_frequency_score, color: "#34d399" },
    { label: "Pickup Rate (20%)", val: product.pickup_rate_score, color: "#c084fc" },
    { label: "Conversion Rate (15%)", val: product.conversion_rate_score, color: "#fbbf24" },
    { label: "Repeat Engagement (5%)", val: product.repeat_engagement_score, color: "#f472b6" },
  ];

  return (
    <div
      style={{
        background: "rgba(13,21,38,0.8)",
        border: "1px solid rgba(30,45,74,0.6)",
        borderRadius: 16,
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          {rank && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "#6366f1",
                background: "rgba(99,102,241,0.15)",
                padding: "2px 8px",
                borderRadius: 6,
                marginBottom: 6,
                display: "inline-block",
              }}
            >
              #{rank} Ranked
            </span>
          )}
          <h4 style={{ fontSize: 16, fontWeight: 900, color: "#f0f4ff", margin: "2px 0 4px" }}>
            {product.product_name}
          </h4>
          <span style={{ fontSize: 11, color: "#4a6080" }}>SKU: {product.sku} {product.shelf_name ? `• ${product.shelf_name}` : ""}</span>
        </div>

        <div
          style={{
            textAlign: "center",
            background: gradeMeta.bg,
            border: `1px solid ${gradeMeta.border}`,
            padding: "8px 14px",
            borderRadius: 12,
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 900, color: gradeMeta.text, lineHeight: 1 }}>
            {product.composite_score}
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, color: gradeMeta.text, marginTop: 2 }}>
            Grade {product.grade}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {components.map((c) => (
          <div key={c.label}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
              <span style={{ color: "#8ba3c7" }}>{c.label}</span>
              <span style={{ color: c.color, fontWeight: 700 }}>{c.val.toFixed(1)}%</span>
            </div>
            <div style={{ height: 6, background: "rgba(30,45,74,0.6)", borderRadius: 3, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(100, Math.max(0, c.val))}%`,
                  background: c.color,
                  borderRadius: 3,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingTop: 10,
          borderTop: "1px solid rgba(30,45,74,0.4)",
          fontSize: 11,
          color: "#4a6080",
        }}
      >
        <span>Viewers: <strong style={{ color: "#f0f4ff" }}>{product.total_viewers}</strong></span>
        <span>Interactions: <strong style={{ color: "#f0f4ff" }}>{product.total_interactions}</strong></span>
      </div>
    </div>
  );
}
