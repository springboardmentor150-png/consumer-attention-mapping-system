"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { Navbar } from "../../components/layout/Navbar";
import { Sidebar } from "../../components/layout/Sidebar";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { ROUTES } from "../../utils/constants";
import api from "../../services/api";
import scoringService from "../../services/scoringService";
import recommendationService from "../../services/recommendationService";
import { StoreScoreReport, ProductScoreDetail, RecommendationItem } from "../../types";
import AttractivenessGauge from "../../components/scoring/AttractivenessGauge";
import ProductScoreCard from "../../components/scoring/ProductScoreCard";
import RecommendationPanel from "../../components/recommendations/RecommendationPanel";

export default function RecommendationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [storeId, setStoreId] = useState<string>("");
  const [scoreReport, setScoreReport] = useState<StoreScoreReport | null>(null);
  const [topProducts, setTopProducts] = useState<ProductScoreDetail[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isRunningEngine, setIsRunningEngine] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !authLoading && !isAuthenticated) router.replace(ROUTES.AUTH);
  }, [mounted, authLoading, isAuthenticated, router]);

  // Resolve store ID and load initial data
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
        // Load existing recommendations without forcing regeneration
        try {
          const recs = await recommendationService.getStoreRecommendations(sid);
          setRecommendations(Array.isArray(recs) ? recs : []);
        } catch (_) {}
      }
    };
    resolve();
  }, [mounted, isAuthenticated]); // eslint-disable-line

  const handleCalculateScores = async () => {
    if (!storeId) return;
    setIsCalculating(true);
    setError(null);
    try {
      const report = await scoringService.calculateStoreScores(storeId, "week");
      setScoreReport(report);
      setTopProducts((report.top_performers || []).map((r) => r.product));
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Scoring failed";
      setError(msg);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleRunEngine = async () => {
    if (!storeId) return;
    setIsRunningEngine(true);
    setError(null);
    try {
      const result = await recommendationService.generateRecommendations(storeId);
      setRecommendations(result.recommendations || []);
      if (!scoreReport) {
        // Also refresh scores
        try {
          const report = await scoringService.calculateStoreScores(storeId, "week");
          setScoreReport(report);
          setTopProducts((report.top_performers || []).map((r) => r.product));
        } catch (_) {}
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Rule engine failed";
      setError(msg);
    } finally {
      setIsRunningEngine(false);
    }
  };

  const handleDismiss = async (recId: string) => {
    try {
      await recommendationService.dismissRecommendation(recId);
      setRecommendations((prev) => prev.filter((r) => r.id !== recId));
    } catch (_) {}
  };

  if (!mounted || authLoading || !isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020817" }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const filteredRecs = recommendations.filter((r) =>
    priorityFilter === "all" ? true : r.priority === priorityFilter
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#020817" }}>
      <Navbar />
      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 28 }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 20, borderBottom: "1px solid rgba(30,45,74,0.6)" }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(135deg,#f0f4ff 0%,#10b981 70%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 4 }}>
                Product Attractiveness & Recommendations
              </h1>
              <p style={{ color: "#4a6080", fontSize: 13 }}>
                Multi-metric weighted scoring (Attention 35%, Interaction 25%, Pickup 20%, Conversion 15%, Repeat 5%) & AI rule engine
              </p>
              {storeId && <p style={{ color: "#2a4060", fontSize: 11, marginTop: 4 }}>Store ID: {storeId}</p>}
            </div>

            <button
              onClick={handleCalculateScores}
              disabled={isCalculating || !storeId}
              style={{
                background: "linear-gradient(135deg,#3b82f6,#6366f1)",
                border: "none",
                color: "#ffffff",
                padding: "8px 16px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: isCalculating || !storeId ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                opacity: !storeId ? 0.5 : 1,
              }}
            >
              {isCalculating ? <><LoadingSpinner size="sm" /> Calculating...</> : "⚡ Calculate Product Scores"}
            </button>
          </div>

          {error && (
            <div style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: 10, padding: "12px 16px", color: "#fb7185", fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Top Scoring Bar */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
            <AttractivenessGauge score={scoreReport?.avg_composite_score ?? 0} label="Store Average Attractiveness Score" />
            <div style={{ background: "rgba(13,21,38,0.8)", border: "1px solid rgba(30,45,74,0.6)", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-around" }}>
              {["A", "B", "C", "D", "F"].map((g) => {
                const count = scoreReport?.score_distribution?.[g] ?? 0;
                const colors: Record<string, string> = { A: "#34d399", B: "#60a5fa", C: "#fbbf24", D: "#fb923c", F: "#f87171" };
                return (
                  <div key={g} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#4a6080", fontWeight: 700 }}>Grade {g}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: colors[g] || "#f0f4ff", marginTop: 2 }}>{count}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Product Score Cards Grid */}
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#f0f4ff", marginBottom: 14 }}>
              Top Product Attractiveness Rankings
            </h3>
            {topProducts.length === 0 ? (
              <div style={{ background: "rgba(13,21,38,0.6)", border: "1px dashed rgba(30,45,74,0.6)", borderRadius: 14, padding: 32, textAlign: "center", color: "#4a6080" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>
                <div style={{ fontWeight: 700, color: "#8ba3c7", marginBottom: 6 }}>No product scores calculated yet</div>
                <div style={{ fontSize: 13 }}>
                  First run <strong style={{ color: "#a78bfa" }}>python scripts/seed_milestone3.py</strong>, then click <strong style={{ color: "#60a5fa" }}>⚡ Calculate Product Scores</strong>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {topProducts.slice(0, 6).map((p, idx) => (
                  <ProductScoreCard key={p.product_id || idx} product={p} rank={idx + 1} />
                ))}
              </div>
            )}
          </div>

          {/* Recommendations Section */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#f0f4ff", margin: 0 }}>Automated Store Recommendations</h3>
                <p style={{ color: "#4a6080", fontSize: 12, margin: "4px 0 0" }}>AI rule-engine advice based on product engagement and foot traffic metrics</p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Priority filter pills */}
                {(["all", "high", "medium", "low"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setPriorityFilter(f)}
                    style={{
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      border: priorityFilter === f ? "1px solid #6366f1" : "1px solid rgba(30,45,74,0.4)",
                      background: priorityFilter === f ? "rgba(99,102,241,0.15)" : "transparent",
                      color: priorityFilter === f ? "#a78bfa" : "#4a6080",
                    }}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}

                <button
                  onClick={handleRunEngine}
                  disabled={isRunningEngine || !storeId}
                  style={{
                    background: "linear-gradient(135deg,#10b981,#059669)",
                    border: "none",
                    color: "#fff",
                    padding: "6px 14px",
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: isRunningEngine || !storeId ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    opacity: !storeId ? 0.5 : 1,
                  }}
                >
                  {isRunningEngine ? <><LoadingSpinner size="sm" /> Running...</> : "⚡ Run Rule Engine"}
                </button>
              </div>
            </div>

            {filteredRecs.length === 0 ? (
              <div style={{ background: "rgba(13,21,38,0.6)", border: "1px dashed rgba(30,45,74,0.6)", borderRadius: 14, padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>✨</div>
                <div style={{ fontWeight: 700, color: "#8ba3c7", marginBottom: 8 }}>
                  {priorityFilter !== "all" ? `No ${priorityFilter} priority recommendations` : "No recommendations yet"}
                </div>
                <div style={{ color: "#4a6080", fontSize: 13 }}>
                  Click <strong style={{ color: "#34d399" }}>⚡ Run Rule Engine</strong> to evaluate product scores and shelf layouts
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredRecs.map((rec) => (
                  <RecommendationCard key={rec.id} rec={rec} onDismiss={handleDismiss} />
                ))}
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}

// Inline recommendation card
function RecommendationCard({ rec, onDismiss }: { rec: RecommendationItem; onDismiss: (id: string) => void }) {
  const priorityColors: Record<string, { bg: string; border: string; badge: string; text: string }> = {
    high:   { bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.2)", badge: "rgba(239,68,68,0.15)", text: "#f87171" },
    medium: { bg: "rgba(251,191,36,0.06)", border: "rgba(251,191,36,0.2)", badge: "rgba(251,191,36,0.15)", text: "#fbbf24" },
    low:    { bg: "rgba(59,130,246,0.06)", border: "rgba(59,130,246,0.2)", badge: "rgba(59,130,246,0.15)", text: "#60a5fa" },
  };
  const prio = (rec.priority as string) || "medium";
  const col = priorityColors[prio] || priorityColors.medium;

  return (
    <div style={{ background: col.bg, border: `1px solid ${col.border}`, borderRadius: 12, padding: "16px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ background: col.badge, color: col.text, fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 6, letterSpacing: "0.05em" }}>
            {prio.toUpperCase()}
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#f0f4ff" }}>{rec.title}</span>
        </div>
        <button
          onClick={() => onDismiss(rec.id)}
          style={{ background: "transparent", border: "none", color: "#4a6080", fontSize: 16, cursor: "pointer", lineHeight: 1 }}
        >
          ×
        </button>
      </div>
      <p style={{ color: "#8ba3c7", fontSize: 13, margin: "0 0 8px", lineHeight: 1.6 }}>{rec.description}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
        <div style={{ background: "rgba(5,15,35,0.4)", borderRadius: 8, padding: "8px 12px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#4a6080", marginBottom: 4 }}>TRIGGER</div>
          <div style={{ fontSize: 12, color: "#8ba3c7" }}>{rec.trigger_reason}</div>
        </div>
        <div style={{ background: "rgba(5,15,35,0.4)", borderRadius: 8, padding: "8px 12px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#4a6080", marginBottom: 4 }}>ACTION</div>
          <div style={{ fontSize: 12, color: "#8ba3c7" }}>{rec.suggested_action}</div>
        </div>
      </div>
      {rec.expected_impact && (
        <div style={{ fontSize: 12, color: "#34d399", fontWeight: 700, marginTop: 10 }}>
          ✨ {rec.expected_impact}
        </div>
      )}
    </div>
  );
}
