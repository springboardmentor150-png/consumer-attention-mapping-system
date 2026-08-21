"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { Navbar } from "../../components/layout/Navbar";
import { Sidebar } from "../../components/layout/Sidebar";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { ROUTES } from "../../utils/constants";
import api from "../../services/api";
import heatmapService from "../../services/heatmapService";
import { HeatmapRecord } from "../../types";
import StoreHeatmap from "../../components/heatmaps/StoreHeatmap";
import ShelfHeatmap from "../../components/heatmaps/ShelfHeatmap";

export default function HeatmapsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [storeId, setStoreId] = useState<string>("");
  const [heatmaps, setHeatmaps] = useState<HeatmapRecord[]>([]);
  const [currentHeatmap, setCurrentHeatmap] = useState<HeatmapRecord | null>(null);
  const [heatmapType, setHeatmapType] = useState("traffic");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !authLoading && !isAuthenticated) router.replace(ROUTES.AUTH);
  }, [mounted, authLoading, isAuthenticated, router]);

  // Resolve store ID
  useEffect(() => {
    if (!mounted || !isAuthenticated) return;
    const resolve = async () => {
      let sid = localStorage.getItem("selected_store_id") || "";
      if (!sid) {
        try {
          const res = await api.get("/stores");
          const list = res.data;
          if (Array.isArray(list) && list.length > 0) {
            sid = list[0].id;
            localStorage.setItem("selected_store_id", sid);
          }
        } catch (_) {}
      }
      if (sid) {
        setStoreId(sid);
        fetchHeatmaps(sid);
      }
    };
    resolve();
  }, [mounted, isAuthenticated]); // eslint-disable-line

  const fetchHeatmaps = useCallback(async (sid: string, type?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const records = await heatmapService.getStoreHeatmaps(sid, type);
      setHeatmaps(records);
      if (records.length > 0) setCurrentHeatmap(records[0]);
    } catch (err: any) {
      // Not a fatal error — user just hasn't generated one yet
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleGenerate = async () => {
    if (!storeId) return;
    setIsGenerating(true);
    setError(null);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    try {
      const newHM = await heatmapService.generateHeatmap(
        storeId,
        heatmapType,
        weekAgo.toISOString(),
        now.toISOString()
      );
      setCurrentHeatmap(newHM);
      setHeatmaps((prev) => [newHM, ...prev]);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Heatmap generation failed";
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!mounted || authLoading || !isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020817" }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const typeLabels: Record<string, string> = {
    traffic: "Foot Traffic Density",
    attention: "Gaze & Attention Focus",
    dwell: "Dwell Time Intensity",
    engagement: "Engagement Hotspots",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#020817" }}>
      <Navbar />
      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 20, borderBottom: "1px solid rgba(30,45,74,0.6)" }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(135deg,#f0f4ff 0%,#f59e0b 70%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 4 }}>
                Dynamic Heatmaps & Attention Visualization
              </h1>
              <p style={{ color: "#4a6080", fontSize: 13 }}>
                OpenCV Jet Colormap Gaussian density maps overlaid on store & shelf grids
              </p>
              {storeId && <p style={{ color: "#2a4060", fontSize: 11, marginTop: 4 }}>Store ID: {storeId}</p>}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <select
                value={heatmapType}
                onChange={(e) => setHeatmapType(e.target.value)}
                style={{
                  background: "rgba(13,21,38,0.9)",
                  border: "1px solid rgba(30,45,74,0.6)",
                  color: "#8ba3c7",
                  padding: "8px 12px",
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {Object.entries(typeLabels).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !storeId}
                style={{
                  background: isGenerating ? "rgba(251,191,36,0.1)" : "linear-gradient(135deg,#f59e0b,#ef4444)",
                  border: "none",
                  color: "#fff",
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
                {isGenerating ? <><LoadingSpinner size="sm" /> Generating...</> : "🔥 Generate Heatmap"}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: 10, padding: "12px 16px", color: "#fb7185", fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Store Heatmap Component */}
          <StoreHeatmap
            storeId={storeId}
            externalHeatmap={currentHeatmap}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            heatmapType={heatmapType}
            onTypeChange={setHeatmapType}
          />

          {/* Shelf Heatmaps Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            <ShelfHeatmap shelfName="Aisle 1 — Drinks & Beverages" attentionScore={88} />
            <ShelfHeatmap shelfName="Aisle 3 — Snacks & Confectionery" attentionScore={92} />
            <ShelfHeatmap shelfName="Aisle 5 — Personal Care" attentionScore={64} />
          </div>

        </main>
      </div>
    </div>
  );
}
