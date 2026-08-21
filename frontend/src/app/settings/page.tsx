"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { Navbar } from "../../components/layout/Navbar";
import { Sidebar } from "../../components/layout/Sidebar";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { ROUTES } from "../../utils/constants";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !isAuthenticated) router.replace(ROUTES.AUTH);
  }, [mounted, authLoading, isAuthenticated, router]);

  if (!mounted || authLoading || !isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020817" }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#020817" }}>
      <Navbar />
      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ paddingBottom: 20, borderBottom: "1px solid rgba(30,45,74,0.6)" }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em", color: "#f0f4ff" }}>System Settings</h1>
            <p style={{ color: "#4a6080", fontSize: 13 }}>Vision pipeline thresholds, gaze calibration, and alert parameters</p>
          </div>

          <div style={{ background: "rgba(13,21,38,0.7)", border: "1px solid rgba(30,45,74,0.6)", borderRadius: 16, padding: 24, color: "#8ba3c7" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f4ff", marginBottom: 12 }}>Vision Pipeline Configuration</div>
            <p style={{ fontSize: 13, lineHeight: 1.6 }}>
              • YOLOv8 Person Detection Confidence: <strong>0.50</strong><br />
              • MediaPipe Gaze Pitch/Yaw Sensitivity: <strong>±25°</strong><br />
              • Attention Dwell Threshold: <strong>1.5 seconds</strong><br />
              • Heatmap Gaussian Blur Kernel: <strong>65x65 (Sigma 25.0)</strong>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
