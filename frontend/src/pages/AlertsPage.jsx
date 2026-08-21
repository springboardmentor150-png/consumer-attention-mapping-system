import React, { useState, useEffect } from "react";
import api from "../services/api";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  RefreshCw,
  Check,
  X,
} from "lucide-react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all, active, acknowledged, resolved

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await api.getAlerts({ status: filter === "all" ? undefined : filter });
      setAlerts(data || []);
    } catch {
      setError("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAlerts(); }, [filter]);

  const handleAcknowledge = async (id) => {
    try {
      await api.acknowledgeAlert(id);
      loadAlerts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResolve = async (id) => {
    try {
      await api.resolveAlert(id);
      loadAlerts();
    } catch (err) {
      setError(err.message);
    }
  };

  const severityConfig = {
    critical: { icon: AlertTriangle, color: "#EF4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" },
    warning: { icon: AlertCircle, color: "#F59E0B", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)" },
    info: { icon: Info, color: "#4FACFE", bg: "rgba(79,172,254,0.1)", border: "rgba(79,172,254,0.3)" },
  };

  const statusColors = {
    active: "#EF4444",
    acknowledged: "#F59E0B",
    resolved: "#39FF14",
  };

  const cardStyle = {
    background: "rgba(21,27,44,0.65)",
    backdropFilter: "blur(16px)",
    border: "1px solid #222D44",
    borderRadius: "16px",
    padding: "24px",
  };

  const filterBtnStyle = (isActive) => ({
    padding: "6px 14px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    border: isActive ? "1px solid rgba(79,172,254,0.5)" : "1px solid #222D44",
    background: isActive ? "rgba(79,172,254,0.15)" : "rgba(21,27,44,0.5)",
    color: isActive ? "#4FACFE" : "#9CA3AF",
    transition: "all 0.2s",
  });

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
            <Bell size={22} style={{ color: "#F59E0B" }} />
            Alerts
          </h2>
          <p style={{ fontSize: "13px", color: "#9CA3AF", margin: "4px 0 0" }}>{alerts.length} alerts</p>
        </div>
        <button onClick={loadAlerts} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid #222D44", color: "#9CA3AF", fontSize: "13px", cursor: "pointer" }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ padding: "14px", borderRadius: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#F87171", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "8px" }}>
        {["all", "active", "acknowledged", "resolved"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={filterBtnStyle(filter === f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Alert List */}
      {alerts.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", padding: "60px" }}>
          <CheckCircle size={48} style={{ color: "#39FF14", marginBottom: "12px" }} />
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>No Alerts</h3>
          <p style={{ fontSize: "13px", color: "#6B7280" }}>Everything looks good! No alerts for the selected filter.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {alerts.map(alert => {
            const sev = severityConfig[alert.severity] || severityConfig.info;
            const SevIcon = sev.icon;
            return (
              <div key={alert.alert_id} style={{
                ...cardStyle,
                borderColor: sev.border,
                padding: "18px",
                display: "flex",
                alignItems: "flex-start",
                gap: "14px",
                transition: "transform 0.2s",
              }}>
                <div style={{ padding: "8px", borderRadius: "8px", background: sev.bg, color: sev.color, flexShrink: 0 }}>
                  <SevIcon size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase" }}>{alert.alert_type}</span>
                    <span style={{
                      fontSize: "10px", padding: "2px 8px", borderRadius: "4px", fontWeight: 600,
                      color: statusColors[alert.status] || "#9CA3AF",
                      background: `${statusColors[alert.status] || "#9CA3AF"}15`,
                    }}>
                      {alert.status}
                    </span>
                  </div>
                  <p style={{ fontSize: "14px", color: "#E5E7EB", margin: "0 0 8px", lineHeight: 1.5 }}>{alert.message}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "#6B7280" }}>
                    <Clock size={11} />
                    {alert.created_at ? new Date(alert.created_at).toLocaleString() : "N/A"}
                  </div>
                </div>
                {alert.status === "active" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }}>
                    <button onClick={() => handleAcknowledge(alert.alert_id)} title="Acknowledge" style={{ padding: "6px 10px", borderRadius: "6px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#F59E0B", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Check size={12} /> Ack
                    </button>
                    <button onClick={() => handleResolve(alert.alert_id)} title="Resolve" style={{ padding: "6px 10px", borderRadius: "6px", background: "rgba(57,255,20,0.1)", border: "1px solid rgba(57,255,20,0.2)", color: "#39FF14", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                      <CheckCircle size={12} /> Resolve
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
