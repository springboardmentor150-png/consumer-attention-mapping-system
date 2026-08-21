"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { Navbar } from "../../components/layout/Navbar";
import { Sidebar } from "../../components/layout/Sidebar";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { ROUTES } from "../../utils/constants";
import api from "../../services/api";
import behaviorService from "../../services/behaviorService";
import { StoreSegmentSummary, SegmentDistribution } from "../../types";
import SegmentPieChart from "../../components/behavior/SegmentPieChart";
import ShopperSegmentCard from "../../components/behavior/ShopperSegmentCard";
import JourneyPathViewer from "../../components/behavior/JourneyPathViewer";

export default function BehaviorPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [storeId, setStoreId] = useState<string>("");
  const [segmentSummary, setSegmentSummary] = useState<StoreSegmentSummary | null>(null);
  const [distribution, setDistribution] = useState<SegmentDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !authLoading && !isAuthenticated) router.replace(ROUTES.AUTH);
  }, [mounted, authLoading, isAuthenticated, router]);

  // Resolve store ID once mounted
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
        fetchSegments(sid);
      }
    };
    resolve();
  }, [mounted, isAuthenticated]); // eslint-disable-line

  const fetchSegments = useCallback(async (sid: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const summary = await behaviorService.getSegmentSummary(sid, "week");
      setSegmentSummary(summary);
      setDistribution(summary.segments || []);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Failed to load behavior data";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleClassify = async () => {
    if (!storeId) return;
    setIsClassifying(true);
    setError(null);
    try {
      await behaviorService.classifyStoreSessions(storeId);
      await fetchSegments(storeId);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Classification failed";
      setError(msg);
    } finally {
      setIsClassifying(false);
    }
  };

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

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 20, borderBottom: "1px solid rgba(30,45,74,0.6)" }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(135deg,#f0f4ff 0%,#a78bfa 70%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 4 }}>
                Behavioral Intelligence & Shopper Journeys
              </h1>
              <p style={{ color: "#4a6080", fontSize: 13 }}>
                KMeans & Rule-based shopper taxonomy: Explorers, Quick Buyers, Comparison Shoppers, Impulse Buyers, Brand Loyals
              </p>
              {storeId && <p style={{ color: "#2a4060", fontSize: 11, marginTop: 4 }}>Store ID: {storeId}</p>}
            </div>

            <button
              onClick={handleClassify}
              disabled={isClassifying || isLoading || !storeId}
              style={{
                background: isClassifying ? "rgba(99,102,241,0.05)" : "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.3)",
                color: "#a78bfa",
                padding: "8px 16px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: isClassifying || !storeId ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                opacity: !storeId ? 0.5 : 1,
              }}
            >
              {isClassifying ? <><LoadingSpinner size="sm" /> Classifying...</> : "↻ Refresh Behavior Analysis"}
            </button>
          </div>

          {error && (
            <div style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: 10, padding: "12px 16px", color: "#fb7185", fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}

          {!storeId && !isLoading && (
            <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 10, padding: "12px 16px", color: "#fbbf24", fontSize: 13 }}>
              ⚠️ No store found. Please create a store at <strong>/stores</strong> first.
            </div>
          )}

          {/* Summary KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            <div style={{ background: "rgba(13,21,38,0.8)", border: "1px solid rgba(30,45,74,0.6)", borderRadius: 14, padding: "20px 22px", position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#3b82f6,#6366f1)" }} />
              <div style={{ fontSize: 30, fontWeight: 900, color: "#60a5fa" }}>{isLoading ? "—" : segmentSummary?.total_sessions ?? 0}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#8ba3c7" }}>Shopper Sessions Analyzed</div>
            </div>

            <div style={{ background: "rgba(13,21,38,0.8)", border: "1px solid rgba(30,45,74,0.6)", borderRadius: 14, padding: "20px 22px", position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#10b981,#06b6d4)" }} />
              <div style={{ fontSize: 24, fontWeight: 900, color: "#34d399", textTransform: "capitalize" }}>
                {isLoading ? "—" : segmentSummary?.most_common_segment?.replace(/_/g, " ") || "None"}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#8ba3c7" }}>Dominant Store Persona</div>
            </div>

            <div style={{ background: "rgba(13,21,38,0.8)", border: "1px solid rgba(30,45,74,0.6)", borderRadius: 14, padding: "20px 22px", position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#8b5cf6,#ec4899)" }} />
              <div style={{ fontSize: 30, fontWeight: 900, color: "#c084fc" }}>5 Persona Types</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#8ba3c7" }}>Active Taxonomy Categories</div>
            </div>
          </div>

          {/* Chart and Grid */}
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <LoadingSpinner size="lg" />
            </div>
          ) : distribution.length === 0 ? (
            <div style={{ background: "rgba(13,21,38,0.6)", border: "1px dashed rgba(30,45,74,0.6)", borderRadius: 14, padding: 40, textAlign: "center", color: "#4a6080" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🧠</div>
              <div style={{ fontWeight: 700, color: "#8ba3c7", marginBottom: 8 }}>No behavioral segment data available yet.</div>
              <div style={{ fontSize: 13 }}>
                Run <strong style={{ color: "#a78bfa" }}>python scripts/seed_milestone3.py</strong> in your backend terminal to seed data,
                then click <strong style={{ color: "#a78bfa" }}>↻ Refresh Behavior Analysis</strong> above.
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
              <div style={{ background: "rgba(13,21,38,0.7)", border: "1px solid rgba(30,45,74,0.6)", borderRadius: 16, padding: 24 }}>
                <SegmentPieChart data={distribution} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                {distribution.map((seg) => (
                  <ShopperSegmentCard key={seg.segment_type} segment={seg} />
                ))}
              </div>
            </div>
          )}

          {/* Sample Journey Analysis */}
          <JourneyPathViewer
            sessionId="sample_demo_session_101"
            metrics={{
              total_distance: 68.4,
              avg_speed: 1.2,
              direction_changes: 8,
              coverage_area: 145.2,
              path_duration_seconds: 240,
            }}
            zones={["Entrance", "Zone A (Electronics)", "Zone C (Snacks)", "Checkout"]}
            pathEntropy={0.72}
          />

        </main>
      </div>
    </div>
  );
}
