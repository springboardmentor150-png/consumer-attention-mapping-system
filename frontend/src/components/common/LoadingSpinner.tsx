"use client";

import React from "react";

interface LoadingSpinnerProps { size?: "sm" | "md" | "lg"; }

export function LoadingSpinner({ size = "md" }: LoadingSpinnerProps) {
  const dim = { sm: 24, md: 36, lg: 52 }[size];
  const border = { sm: 2, md: 3, lg: 4 }[size];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div style={{ position: "relative", width: dim, height: dim }}>
        {/* Outer ring */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: `${border}px solid rgba(59,130,246,0.1)`,
        }} />
        {/* Spinning arc */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: `${border}px solid transparent`,
          borderTopColor: "#3b82f6",
          borderRightColor: "rgba(59,130,246,0.4)",
          animation: "spin 0.8s linear infinite",
        }} />
        {/* Inner dot */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: Math.max(4, dim * 0.2),
          height: Math.max(4, dim * 0.2),
          borderRadius: "50%",
          background: "#3b82f6",
          boxShadow: "0 0 8px rgba(59,130,246,0.8)",
        }} />
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
