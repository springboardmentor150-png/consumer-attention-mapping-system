"use client";

import React, { useState } from "react";
import { HeatmapRecord } from "../../types";
import { LoadingSpinner } from "../common/LoadingSpinner";

interface Props {
  storeId?: string;
  // External control props (from parent page)
  externalHeatmap?: HeatmapRecord | null;
  onGenerate?: () => void;
  isGenerating?: boolean;
  heatmapType?: string;
  onTypeChange?: (type: string) => void;
}

const HEATMAP_TYPES = [
  { value: "traffic",    label: "Foot Traffic Density" },
  { value: "attention",  label: "Gaze & Attention Focus" },
  { value: "dwell",      label: "Dwell Time Intensity" },
  { value: "engagement", label: "Product Engagement" },
];

export default function StoreHeatmap({
  storeId = "",
  externalHeatmap,
  onGenerate,
  isGenerating = false,
  heatmapType,
  onTypeChange,
}: Props) {
  const [localType, setLocalType] = useState("traffic");

  const currentType = heatmapType ?? localType;
  const handleTypeChange = (val: string) => {
    if (onTypeChange) onTypeChange(val);
    else setLocalType(val);
  };

  const currentHeatmap = externalHeatmap ?? null;

  return (
    <div
      style={{
        background: "rgba(13,21,38,0.7)",
        border: "1px solid rgba(30,45,74,0.6)",
        borderRadius: 16,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#f0f4ff", marginBottom: 2 }}>
            Store Attention & Traffic Heatmap
          </h3>
          <p style={{ fontSize: 12, color: "#4a6080" }}>
            Visualizing high-dwell areas (warm tones) vs low interaction zones (cool tones)
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <select
            value={currentType}
            onChange={(e) => handleTypeChange(e.target.value)}
            style={{
              background: "rgba(5,15,35,0.8)",
              border: "1px solid rgba(30,45,74,0.6)",
              color: "#f0f4ff",
              padding: "8px 12px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {HEATMAP_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          {onGenerate && (
            <button
              onClick={onGenerate}
              disabled={isGenerating || !storeId}
              style={{
                background: isGenerating
                  ? "rgba(251,191,36,0.1)"
                  : "linear-gradient(135deg,#f59e0b,#ef4444)",
                border: "none",
                color: "#ffffff",
                padding: "8px 16px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: isGenerating || !storeId ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                opacity: !storeId ? 0.5 : 1,
              }}
            >
              {isGenerating ? (
                <><LoadingSpinner size="sm" /> Generating...</>
              ) : (
                "🔥 Generate Heatmap"
              )}
            </button>
          )}
        </div>
      </div>

      {/* Heatmap Display Area */}
      <div
        style={{
          position: "relative",
          minHeight: 400,
          background: "rgba(5,15,35,0.9)",
          borderRadius: 12,
          border: "1px dashed rgba(30,45,74,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {isGenerating ? (
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            <LoadingSpinner size="lg" />
            <span style={{ fontSize: 13, color: "#8ba3c7", fontWeight: 600 }}>
              Generating OpenCV Gaussian Heatmap...
            </span>
          </div>
        ) : currentHeatmap ? (
          <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <img
              src={currentHeatmap.image_url}
              alt="Store Heatmap Overlay"
              style={{ width: "100%", height: "auto", maxHeight: 500, objectFit: "contain", borderRadius: 12 }}
              onError={(e) => {
                // Fallback if image fails to load
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: 48, color: "#4a6080" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗺️</div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#8ba3c7" }}>
              No heatmap rendered yet
            </p>
            <p style={{ fontSize: 12, marginTop: 4 }}>
              Select a heatmap type above and click &quot;Generate Heatmap&quot;
            </p>
          </div>
        )}
      </div>

      {currentHeatmap && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
            color: "#4a6080",
            borderTop: "1px solid rgba(30,45,74,0.4)",
            paddingTop: 12,
          }}
        >
          <span>Data points analyzed: <strong style={{ color: "#60a5fa" }}>{currentHeatmap.data_points_count}</strong></span>
          <span>Resolution: <strong style={{ color: "#8ba3c7" }}>{currentHeatmap.resolution_width}x{currentHeatmap.resolution_height}</strong></span>
          <span>Generated: <strong style={{ color: "#34d399" }}>{new Date(currentHeatmap.generated_at).toLocaleString()}</strong></span>
        </div>
      )}
    </div>
  );
}
