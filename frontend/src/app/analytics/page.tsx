"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { Navbar } from "../../components/layout/Navbar";
import { Sidebar } from "../../components/layout/Sidebar";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import useAnalytics from "../../hooks/useAnalytics";
import AttentionBarChart from "../../components/analytics/AttentionBarChart";
import DwellTimeChart from "../../components/analytics/DwellTimeChart";
import ShelfAttentionCard from "../../components/analytics/ShelfAttentionCard";
import { ROUTES } from "../../utils/constants";

function StatCard({ title, value, sub, color, gradient }: any) {
  return (
    <div style={{
      background: "rgba(13,21,38,0.8)", border: "1px solid rgba(30,45,74,0.6)",
      borderRadius: 14, padding: "22px 24px", position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: gradient || "linear-gradient(90deg,#6366f1,#8b5cf6)",
      }} />
      <div style={{ fontSize: 11, color: "#4a6080", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: color || "#f0f4ff", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 6 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "#2a3f60" }}>{sub}</div>
    </div>
  );
}

function formatDwell(seconds: number) {
  if (!seconds) return "0s";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [storeId, setStoreId] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !isAuthenticated) router.replace(ROUTES.AUTH);
    const sid = localStorage.getItem("selected_store_id") || "";
    setStoreId(sid);
  }, [mounted, isAuthenticated, authLoading, router]);

  const { dashboardData, shelfRankings, zoneTraffic, hourlyTraffic, isLoading, error } = useAnalytics(storeId);

  if (!mounted || authLoading || !isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020817" }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const maxAttention = shelfRankings.length > 0 ? shelfRankings[0].total_attention_seconds : 1;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#020817" }}>
      <Navbar />
      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Page Header */}
          <div style={{ paddingBottom: 20, borderBottom: "1px solid rgba(30,45,74,0.6)" }}>
            <h1 style={{
              fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em",
              background: "linear-gradient(135deg, #f0f4ff 0%, #a78bfa 70%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              marginBottom: 6,
            }}>
              Analytics Dashboard
            </h1>
            <p style={{ color: "#4a6080", fontSize: 13 }}>
              Consumer Attention Intelligence — Real-time shelf engagement and shopper behaviour
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{
              background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)",
              borderRadius: 10, padding: "12px 16px", color: "#fb7185", fontSize: 13,
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
              <LoadingSpinner size="lg" />
            </div>
          )}

          {!isLoading && (
            <>
              {/* Row 1 — Stat Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                <StatCard
                  title="Total Visitors Today"
                  value={(dashboardData?.total_visitors ?? 0).toLocaleString()}
                  sub="Unique shoppers tracked via CV pipeline"
                  gradient="linear-gradient(90deg,#3b82f6,#6366f1)"
                  color="#60a5fa"
                />
                <StatCard
                  title="Avg Dwell Time"
                  value={formatDwell(dashboardData?.avg_dwell_time_seconds ?? 0)}
                  sub="Average time spent per shopper session"
                  gradient="linear-gradient(90deg,#10b981,#06b6d4)"
                  color="#34d399"
                />
                <StatCard
                  title="Top Performing Shelf"
                  value={shelfRankings[0]?.shelf_name ?? "N/A"}
                  sub={shelfRankings[0] ? `${shelfRankings[0].unique_viewers} viewers · ${shelfRankings[0].avg_dwell_seconds.toFixed(1)}s avg` : "No data yet"}
                  gradient="linear-gradient(90deg,#8b5cf6,#ec4899)"
                  color="#c084fc"
                />
              </div>

              {/* Row 2 — Full-Width Attention Bar Chart */}
              <div style={{
                background: "rgba(13,21,38,0.7)", border: "1px solid rgba(30,45,74,0.6)",
                borderRadius: 16, padding: 24,
              }}>
                <AttentionBarChart data={shelfRankings} title="Shelf Attention Rankings — All Shelves" />
              </div>

              {/* Row 3 — Line Chart + Zone Traffic Table */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div style={{
                  background: "rgba(13,21,38,0.7)", border: "1px solid rgba(30,45,74,0.6)",
                  borderRadius: 16, padding: 24,
                }}>
                  <DwellTimeChart data={hourlyTraffic} title="Hourly Traffic Distribution" />
                </div>

                <div style={{
                  background: "rgba(13,21,38,0.7)", border: "1px solid rgba(30,45,74,0.6)",
                  borderRadius: 16, padding: 24,
                }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#8ba3c7", marginBottom: 16 }}>Zone Traffic Summary</h3>
                  {zoneTraffic.length === 0 ? (
                    <div style={{ color: "#4a6080", fontSize: 13, fontStyle: "italic", textAlign: "center", paddingTop: 40 }}>
                      No zone data available yet
                    </div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          {["Zone", "Visitors", "Avg Time"].map(h => (
                            <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "#4a6080", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid rgba(30,45,74,0.5)" }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {zoneTraffic.map((zone, i) => (
                          <tr key={zone.zone_id} style={{ borderBottom: "1px solid rgba(30,45,74,0.3)" }}>
                            <td style={{ padding: "10px 12px", fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{zone.zone_name}</td>
                            <td style={{ padding: "10px 12px", fontSize: 13, color: "#60a5fa", fontWeight: 700 }}>{zone.total_visitors}</td>
                            <td style={{ padding: "10px 12px", fontSize: 13, color: "#34d399", fontWeight: 700 }}>{formatDwell(zone.avg_time_seconds)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Row 4 — Top Performing Shelf Cards */}
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#e2e8f0", marginBottom: 16 }}>
                  Top Performing Shelves
                </h2>
                {shelfRankings.length === 0 ? (
                  <div style={{
                    textAlign: "center", padding: "40px 24px",
                    background: "rgba(13,21,38,0.5)", borderRadius: 16,
                    border: "1px dashed rgba(30,45,74,0.5)",
                    color: "#4a6080", fontSize: 14,
                  }}>
                    No shelf data yet — run <code style={{ color: "#60a5fa" }}>python scripts/run_tracking.py</code> and let it collect data
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                    {shelfRankings.map((shelf, i) => (
                      <ShelfAttentionCard
                        key={shelf.shelf_id}
                        shelf={shelf}
                        rank={i + 1}
                        maxAttention={maxAttention}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  );
}
