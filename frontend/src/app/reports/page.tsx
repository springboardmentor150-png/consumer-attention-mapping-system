"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { Navbar } from "../../components/layout/Navbar";
import { Sidebar } from "../../components/layout/Sidebar";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { ROUTES } from "../../utils/constants";
import api from "../../services/api";

interface ReportStat {
  label: string;
  value: string | number;
  sub: string;
  color: string;
  gradient: string;
}

interface SessionRow {
  id: string;
  store_id: string;
  camera_id: string;
  started_at: string;
  ended_at: string | null;
  total_frames_processed: number;
  unique_shoppers_count: number;
  avg_fps: number;
  status: string;
}

const PERIOD_OPTIONS = [
  { value: "today",   label: "Today" },
  { value: "week",    label: "This Week" },
  { value: "month",   label: "This Month" },
];

function fmt(dt: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function fmtDuration(start: string, end: string | null) {
  if (!end) return "In progress";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function ReportsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("today");
  const [stats, setStats] = useState<ReportStat[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !isAuthenticated) router.replace(ROUTES.AUTH);
  }, [mounted, authLoading, isAuthenticated, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const storeId = localStorage.getItem("selected_store_id") || "";

      // Fetch tracking sessions
      const sessRes = await api.get("/tracking/sessions");
      const allSessions: SessionRow[] = sessRes.data || [];
      setSessions(allSessions);

      // Build stats from sessions
      const totalShoppers  = allSessions.reduce((a, s) => a + (s.unique_shoppers_count || 0), 0);
      const totalFrames    = allSessions.reduce((a, s) => a + (s.total_frames_processed || 0), 0);
      const avgFps         = allSessions.length > 0
        ? (allSessions.reduce((a, s) => a + (s.avg_fps || 0), 0) / allSessions.length).toFixed(1)
        : "0";
      const completedSessions = allSessions.filter(s => s.status === "completed" || s.ended_at).length;

      const built: ReportStat[] = [
        { label: "Total Sessions",    value: allSessions.length, sub: "Tracking sessions run",  color: "#60a5fa", gradient: "linear-gradient(90deg,#3b82f6,#6366f1)" },
        { label: "Unique Shoppers",   value: totalShoppers,      sub: "Across all sessions",    color: "#34d399", gradient: "linear-gradient(90deg,#10b981,#06b6d4)" },
        { label: "Avg FPS",           value: avgFps,             sub: "Average processing FPS", color: "#c084fc", gradient: "linear-gradient(90deg,#8b5cf6,#ec4899)" },
        { label: "Frames Processed",  value: totalFrames.toLocaleString(), sub: "Total video frames analysed", color: "#fbbf24", gradient: "linear-gradient(90deg,#f59e0b,#f97316)" },
      ];
      setStats(built);

      // If we have a store ID fetch analytics for richer data
      if (storeId) {
        try {
          const dashRes = await api.get(`/analytics/dashboard/${storeId}`, { params: { period } });
          const d = dashRes.data?.data;
          if (d) {
            built[1] = { ...built[1], value: d.total_visitors ?? totalShoppers };
          }
          setStats([...built]);
        } catch { /* dashboard optional */ }
      }
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated, period]);

  const exportCSV = () => {
    const header = "Session ID,Status,Shoppers,Frames,FPS,Started,Ended,Duration\n";
    const rows = sessions.map(s =>
      `${s.id},${s.status || "unknown"},${s.unique_shoppers_count},${s.total_frames_processed},${s.avg_fps?.toFixed(1)},${fmt(s.started_at)},${fmt(s.ended_at)},${fmtDuration(s.started_at, s.ended_at)}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `cams_report_${period}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
              <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(135deg,#f0f4ff 0%,#c084fc 70%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 4 }}>
                Reports & Session Logs
              </h1>
              <p style={{ color: "#4a6080", fontSize: 13 }}>Tracking session history and export analytics</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {/* Period selector */}
              <div style={{ display: "flex", background: "rgba(13,21,38,0.8)", border: "1px solid rgba(30,45,74,0.5)", borderRadius: 10, overflow: "hidden" }}>
                {PERIOD_OPTIONS.map(p => (
                  <button key={p.value} onClick={() => setPeriod(p.value)} style={{ padding: "8px 16px", border: "none", background: period === p.value ? "rgba(99,102,241,0.2)" : "transparent", color: period === p.value ? "#a78bfa" : "#4a6080", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    {p.label}
                  </button>
                ))}
              </div>
              <button
                onClick={exportCSV}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, padding: "8px 16px", color: "#34d399", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Export CSV
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><LoadingSpinner size="md" /></div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
                {stats.map(stat => (
                  <div key={stat.label} style={{ background: "rgba(13,21,38,0.8)", border: "1px solid rgba(30,45,74,0.6)", borderRadius: 14, padding: "20px 22px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: stat.gradient }} />
                    <div style={{ fontSize: 30, fontWeight: 900, color: stat.color, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 6 }}>{stat.value}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#8ba3c7", marginBottom: 2 }}>{stat.label}</div>
                    <div style={{ fontSize: 11, color: "#2a3f60" }}>{stat.sub}</div>
                  </div>
                ))}
              </div>

              {/* How to get data hint */}
              {sessions.length === 0 && (
                <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 12, padding: 20, display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 24 }}>💡</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#a78bfa", marginBottom: 6 }}>No session data yet</div>
                    <div style={{ fontSize: 13, color: "#4a6080", lineHeight: 1.7 }}>
                      Run the tracking script to generate report data:<br/>
                      <code style={{ background: "rgba(30,45,74,0.5)", color: "#60a5fa", padding: "2px 8px", borderRadius: 4, fontSize: 12 }}>
                        python scripts/run_tracking.py --source 0
                      </code>
                    </div>
                  </div>
                </div>
              )}

              {/* Sessions Table */}
              <div style={{ background: "rgba(13,21,38,0.7)", border: "1px solid rgba(30,45,74,0.6)", borderRadius: 16, overflow: "hidden" }}>
                <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(30,45,74,0.5)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: "#e2e8f0" }}>Tracking Session Log ({sessions.length})</h2>
                  <button onClick={fetchData} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, background: "rgba(30,45,74,0.4)", border: "1px solid rgba(30,45,74,0.6)", color: "#60a5fa", cursor: "pointer", fontWeight: 600 }}>
                    ↻ Refresh
                  </button>
                </div>

                {sessions.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 24px" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                    <div style={{ fontSize: 14, color: "#8ba3c7", fontWeight: 600 }}>No tracking sessions recorded yet</div>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(30,45,74,0.5)" }}>
                          {["Session ID", "Status", "Shoppers", "Frames", "Avg FPS", "Started", "Duration"].map(h => (
                            <th key={h} style={{ textAlign: "left", padding: "12px 20px", fontSize: 11, fontWeight: 700, color: "#4a6080", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map((sess, i) => {
                          const status = sess.status || (sess.ended_at ? "completed" : "running");
                          const statusC = status === "completed" ? "#34d399" : status === "running" ? "#fbbf24" : "#60a5fa";
                          return (
                            <tr key={sess.id} style={{ borderBottom: "1px solid rgba(30,45,74,0.25)", background: i % 2 === 0 ? "transparent" : "rgba(30,45,74,0.06)" }}>
                              <td style={{ padding: "13px 20px", fontSize: 11, color: "#4a6080", fontFamily: "monospace" }}>{sess.id?.slice(0, 12)}...</td>
                              <td style={{ padding: "13px 20px" }}>
                                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: `${statusC}18`, color: statusC, border: `1px solid ${statusC}44` }}>
                                  {status}
                                </span>
                              </td>
                              <td style={{ padding: "13px 20px", fontSize: 14, fontWeight: 800, color: "#60a5fa" }}>{sess.unique_shoppers_count ?? 0}</td>
                              <td style={{ padding: "13px 20px", fontSize: 13, color: "#8ba3c7" }}>{(sess.total_frames_processed ?? 0).toLocaleString()}</td>
                              <td style={{ padding: "13px 20px", fontSize: 13, color: "#c084fc", fontWeight: 700 }}>{sess.avg_fps?.toFixed(1) ?? "—"}</td>
                              <td style={{ padding: "13px 20px", fontSize: 12, color: "#8ba3c7", whiteSpace: "nowrap" }}>{fmt(sess.started_at)}</td>
                              <td style={{ padding: "13px 20px", fontSize: 12, color: "#34d399", fontWeight: 600 }}>{fmtDuration(sess.started_at, sess.ended_at)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* System info footer */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ background: "rgba(13,21,38,0.7)", border: "1px solid rgba(30,45,74,0.5)", borderRadius: 14, padding: 20 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "#8ba3c7", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>Vision Pipeline</h3>
                  {[
                    { label: "Person Detector",  value: "YOLOv8n (ultralytics)",          ok: true },
                    { label: "Tracker",           value: "ByteTrack (supervision)",        ok: true },
                    { label: "Gaze Estimator",    value: "OpenCV Haar Cascade",            ok: true },
                    { label: "Dwell Calculator",  value: "Custom Python (no deps)",        ok: true },
                  ].map(item => (
                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(30,45,74,0.3)" }}>
                      <span style={{ fontSize: 12, color: "#4a6080" }}>{item.label}</span>
                      <span style={{ fontSize: 12, color: item.ok ? "#34d399" : "#fb7185", fontWeight: 600 }}>✓ {item.value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: "rgba(13,21,38,0.7)", border: "1px solid rgba(30,45,74,0.5)", borderRadius: 14, padding: 20 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "#8ba3c7", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>How to Run Tracking</h3>
                  {[
                    { label: "Step 1", cmd: "cd backend", desc: "Go to backend folder" },
                    { label: "Step 2", cmd: "python scripts/run_tracking.py --source 0", desc: "Run webcam tracking" },
                    { label: "Step 3", cmd: "Press 'q' to stop", desc: "Stop and save session" },
                  ].map(step => (
                    <div key={step.label} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{step.label} — {step.desc}</div>
                      <code style={{ fontSize: 11, color: "#60a5fa", background: "rgba(30,45,74,0.4)", padding: "4px 8px", borderRadius: 4, display: "block" }}>{step.cmd}</code>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  );
}
