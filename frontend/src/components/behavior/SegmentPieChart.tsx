"use client";

import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { SegmentDistribution } from "../../types";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  data: SegmentDistribution[];
  title?: string;
}

const COLOR_MAP: Record<string, string> = {
  explorer: "#3b82f6",
  quick_buyer: "#10b981",
  comparison_shopper: "#f59e0b",
  impulse_buyer: "#ef4444",
  brand_loyal: "#8b5cf6",
};

export default function SegmentPieChart({ data = [], title = "Shopper Segments Breakdown" }: Props) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 32, color: "#4a6080" }}>
        <p style={{ fontSize: 14 }}>No behavioral segment data available yet.</p>
      </div>
    );
  }

  const labels = data.map(
    (d) => d.segment_type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
  const percentages = data.map((d) => d.percentage);
  const bgColors = data.map((d) => COLOR_MAP[d.segment_type] || "#6366f1");

  const chartData = {
    labels,
    datasets: [
      {
        data: percentages,
        backgroundColor: bgColors,
        borderColor: "rgba(13, 21, 38, 0.9)",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "#8ba3c7",
          font: { size: 12, weight: 600 },
          padding: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => ` ${context.label}: ${context.raw}%`,
        },
      },
    },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      {title && (
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#f0f4ff" }}>{title}</h3>
      )}
      <div style={{ position: "relative", flex: 1, minHeight: 260 }}>
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
}
