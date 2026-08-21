"use client";

import React, { useState } from "react";
import useRecommendations from "../../hooks/useRecommendations";
import RecommendationCard from "./RecommendationCard";
import { LoadingSpinner } from "../common/LoadingSpinner";

interface Props {
  storeId?: string;
}

export default function RecommendationPanel({ storeId = "" }: Props) {
  const { recommendations, isGenerating, generateRecs, dismissRec } = useRecommendations(storeId);
  const [filter, setFilter] = useState<string>("all");

  const handleGenerate = () => {
    const sid = storeId || localStorage.getItem("selected_store_id") || "";
    if (sid) {
      generateRecs(sid);
    }
  };

  const filteredRecs = recommendations.filter((r) => {
    if (filter === "all") return true;
    const pStr = (typeof r.priority === "string" ? r.priority : (r.priority as any)?.value || "").toLowerCase();
    return pStr === filter;
  });

  const highPriorityCount = recommendations.filter((r) => {
    const pStr = (typeof r.priority === "string" ? r.priority : (r.priority as any)?.value || "").toLowerCase();
    return pStr === "high";
  }).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 900, color: "#f0f4ff", display: "flex", alignItems: "center", gap: 10 }}>
            Automated Store Recommendations
            {highPriorityCount > 0 && (
              <span style={{ fontSize: 11, background: "rgba(239,68,68,0.2)", color: "#f87171", border: "1px solid rgba(239,68,68,0.4)", padding: "2px 8px", borderRadius: 6, fontWeight: 800 }}>
                {highPriorityCount} High Priority
              </span>
            )}
          </h3>
          <p style={{ fontSize: 12, color: "#4a6080", marginTop: 2 }}>
            AI rule-engine advice based on product engagement and foot traffic metrics
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ display: "flex", background: "rgba(13,21,38,0.8)", border: "1px solid rgba(30,45,74,0.5)", borderRadius: 10, overflow: "hidden" }}>
            {["all", "high", "medium", "low"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                style={{
                  padding: "8px 14px",
                  border: "none",
                  background: filter === tab ? "rgba(99,102,241,0.2)" : "transparent",
                  color: filter === tab ? "#a78bfa" : "#4a6080",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{
              background: "linear-gradient(135deg,#10b981,#06b6d4)",
              border: "none",
              color: "#ffffff",
              padding: "8px 16px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              opacity: isGenerating ? 0.7 : 1,
            }}
          >
            {isGenerating ? <LoadingSpinner size="sm" /> : "⚡ Run Rule Engine"}
          </button>
        </div>
      </div>

      {isGenerating ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredRecs.length === 0 ? (
        <div style={{ background: "rgba(13,21,38,0.6)", border: "1px dashed rgba(30,45,74,0.6)", borderRadius: 16, textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
          <div style={{ fontSize: 14, color: "#8ba3c7", fontWeight: 700 }}>
            No recommendations in this category
          </div>
          <p style={{ fontSize: 12, color: "#4a6080", marginTop: 4 }}>
            Click &quot;Run Rule Engine&quot; to evaluate product scores and shelf layouts
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {filteredRecs.map((r) => (
            <RecommendationCard key={r.id} recommendation={r} onDismiss={dismissRec} />
          ))}
        </div>
      )}
    </div>
  );
}
