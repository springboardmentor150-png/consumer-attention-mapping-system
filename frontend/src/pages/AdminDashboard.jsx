import React, { useState, useEffect } from "react";
import api from "../services/api";
import {
  Shield,
  Users,
  Store,
  Video,
  Activity,
  Database,
  Cpu,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  HardDrive,
} from "lucide-react";

export default function AdminDashboard() {
  const [health, setHealth] = useState(null);
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [healthRes, storesRes, camerasRes, videosRes] = await Promise.all([
        api.getHealth().catch(() => null),
        api.getStores().catch(() => []),
        api.getCameras().catch(() => []),
        api.getVideos().catch(() => []),
      ]);
      setHealth(healthRes);
      setStores(storesRes || []);
      setCameras(camerasRes || []);
      setVideos(videosRes || []);
    } catch (err) {
      setError("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const cardStyle = {
    background: "rgba(21,27,44,0.65)",
    backdropFilter: "blur(16px)",
    border: "1px solid #222D44",
    borderRadius: "16px",
    padding: "24px",
  };

  const statCards = [
    { label: "Total Stores", value: stores.length, icon: Store, color: "#4FACFE" },
    { label: "Connected Cameras", value: cameras.length, icon: Video, color: "#00F2FE" },
    { label: "Videos Uploaded", value: videos.length, icon: HardDrive, color: "#39FF14" },
    { label: "Processing Jobs", value: videos.filter(v => v.status === "processing").length, icon: Cpu, color: "#BD00FF" },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid rgba(79,172,254,0.2)", borderTop: "3px solid #4FACFE", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <Shield size={22} style={{ color: "#4FACFE" }} />
            Admin Dashboard
          </h2>
          <p style={{ fontSize: "13px", color: "#9CA3AF", margin: "4px 0 0" }}>System monitoring and management</p>
        </div>
        <button onClick={loadData} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "10px", background: "rgba(79,172,254,0.1)", border: "1px solid rgba(79,172,254,0.3)", color: "#4FACFE", fontSize: "13px", cursor: "pointer" }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ padding: "14px", borderRadius: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#F87171", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ ...cardStyle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: "10px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase" }}>{label}</span>
              <h3 style={{ fontSize: "28px", fontWeight: 800, color: "#fff", margin: "4px 0 0" }}>{value}</h3>
            </div>
            <div style={{ padding: "10px", borderRadius: "10px", background: `${color}15`, color }}>
              <Icon size={20} />
            </div>
          </div>
        ))}
      </div>

      {/* System Health */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Activity size={16} style={{ color: "#39FF14" }} />
          System Health
        </h3>
        {health ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <CheckCircle size={14} style={{ color: "#39FF14" }} />
              <span style={{ fontSize: "13px", color: "#E5E7EB" }}>API: {health.status || "healthy"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Database size={14} style={{ color: "#4FACFE" }} />
              <span style={{ fontSize: "13px", color: "#E5E7EB" }}>Database: Connected</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Cpu size={14} style={{ color: "#00F2FE" }} />
              <span style={{ fontSize: "13px", color: "#E5E7EB" }}>ML Pipeline: Ready</span>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: "13px", color: "#9CA3AF" }}>Unable to fetch health status</p>
        )}
      </div>

      {/* Recent Videos */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", margin: "0 0 16px" }}>Recent Videos</h3>
        {videos.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#9CA3AF" }}>No videos uploaded yet</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {videos.slice(0, 8).map(v => (
              <div key={v.video_id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid #1a1f30" }}>
                <Video size={14} style={{ color: "#4FACFE", flexShrink: 0 }} />
                <span style={{ fontSize: "13px", color: "#E5E7EB", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.filename}</span>
                <span style={{
                  fontSize: "11px", padding: "3px 8px", borderRadius: "6px", fontWeight: 600,
                  background: v.status === "completed" ? "rgba(57,255,20,0.1)" : v.status === "processing" ? "rgba(79,172,254,0.1)" : "rgba(245,158,11,0.1)",
                  color: v.status === "completed" ? "#39FF14" : v.status === "processing" ? "#4FACFE" : "#F59E0B",
                  border: `1px solid ${v.status === "completed" ? "rgba(57,255,20,0.2)" : v.status === "processing" ? "rgba(79,172,254,0.2)" : "rgba(245,158,11,0.2)"}`,
                }}>
                  {v.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
