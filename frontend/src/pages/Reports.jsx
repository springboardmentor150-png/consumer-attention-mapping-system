import React, { useState, useEffect } from "react";
import api from "../services/api";
import { FileText, Download, Clock, CheckCircle, XCircle, RefreshCw, AlertCircle } from "lucide-react";

const REPORT_TYPES = [
  { id: "consumer_attention", label: "Consumer Attention", desc: "Shopper dwell & attention events" },
  { id: "product_engagement", label: "Product Engagement", desc: "Attractiveness scores & interactions" },
  { id: "shelf_performance", label: "Shelf Performance", desc: "Per-shelf attention analytics" },
  { id: "consumer_behavior", label: "Consumer Behavior", desc: "Segment distribution & reasons" },
  { id: "marketing", label: "Marketing Summary", desc: "Recommendations & insights" }
];

const FORMATS = [
  { id: "pdf", label: "PDF", icon: "📄" },
  { id: "excel", label: "Excel", icon: "📊" },
  { id: "csv", label: "CSV", icon: "📋" }
];

const STATUS_COLORS = {
  generating: "#fbbf24",
  completed: "#34d399",
  failed: "#f87171"
};

export default function Reports() {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [reports, setReports] = useState([]);
  const [reportType, setReportType] = useState("consumer_attention");
  const [format, setFormat] = useState("pdf");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api.getStores().then(s => { setStores(s); if (s.length) setSelectedStore(s[0].store_id); });
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await api.getReports(selectedStore);
      setReports(data);
    } catch { }
  };

  const generate = async () => {
    setGenerating(true);
    setError("");
    try {
      await api.generateReport({
        report_type: reportType,
        report_format: format,
        store_id: selectedStore || null,
        parameters: {}
      });
      setSuccess(`Report queued! Check the list below in a few seconds.`);
      setTimeout(loadReports, 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const download = (id) => {
    const url = api.downloadReport(id);
    const token = localStorage.getItem("token");
    const a = document.createElement("a");
    a.href = url;
    a.click();
  };

  const pollReport = async (id) => {
    // Poll until completed
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const r = await api.getReport(id);
      setReports(prev => prev.map(rep => rep.report_id === id ? r : rep));
      if (r.status !== "generating") break;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", margin: 0 }}>Reports</h2>
        <p style={{ color: "#9CA3AF", fontSize: "13px", margin: "4px 0 0" }}>
          Generate PDF, Excel, CSV analytics reports from real PostgreSQL data
        </p>
      </div>

      {error && <div style={errorStyle}><AlertCircle size={14} /> {error}</div>}
      {success && <div style={successStyle}><CheckCircle size={14} /> {success}</div>}

      {/* Generate form */}
      <div style={{ background: "rgba(21,27,44,0.65)", border: "1px solid #222D44", borderRadius: "14px", padding: "24px" }}>
        <h4 style={{ color: "#fff", fontWeight: 700, fontSize: "14px", margin: "0 0 20px" }}>Generate New Report</h4>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "20px" }}>
          <div>
            <label style={labelStyle}>Store</label>
            <select value={selectedStore} onChange={e => setSelectedStore(e.target.value)} style={selectStyle}>
              <option value="">All Stores</option>
              {stores.map(s => <option key={s.store_id} value={s.store_id}>{s.store_name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Report Type</label>
            <select value={reportType} onChange={e => setReportType(e.target.value)} style={selectStyle}>
              {REPORT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Format</label>
            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
              {FORMATS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  style={{
                    flex: 1, padding: "9px", borderRadius: "8px",
                    border: `1px solid ${format === f.id ? "rgba(79,172,254,0.5)" : "#222D44"}`,
                    background: format === f.id ? "rgba(79,172,254,0.1)" : "rgba(21,27,44,0.5)",
                    color: format === f.id ? "#4FACFE" : "#9CA3AF",
                    cursor: "pointer", fontSize: "12px", fontWeight: 600
                  }}
                >
                  {f.icon} {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Type cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", marginBottom: "20px" }}>
          {REPORT_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => setReportType(t.id)}
              style={{
                padding: "12px", borderRadius: "10px",
                border: `1px solid ${reportType === t.id ? "rgba(79,172,254,0.5)" : "#222D44"}`,
                background: reportType === t.id ? "rgba(79,172,254,0.1)" : "transparent",
                color: reportType === t.id ? "#4FACFE" : "#9CA3AF",
                cursor: "pointer", textAlign: "left"
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 700 }}>{t.label}</div>
              <div style={{ fontSize: "10px", opacity: 0.7, marginTop: "4px" }}>{t.desc}</div>
            </button>
          ))}
        </div>

        <button
          onClick={generate}
          disabled={generating}
          style={{
            padding: "12px 28px", borderRadius: "10px", border: "none",
            background: generating ? "#1F2937" : "linear-gradient(135deg,#4FACFE,#00F2FE)",
            color: generating ? "#4B5563" : "#0F1624",
            fontWeight: 700, fontSize: "14px",
            cursor: generating ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: "8px"
          }}
        >
          <FileText size={16} />
          {generating ? "Generating..." : `Generate ${format.toUpperCase()} Report`}
        </button>
      </div>

      {/* Reports list */}
      <div style={{ background: "rgba(21,27,44,0.65)", border: "1px solid #222D44", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #222D44", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h4 style={{ color: "#fff", fontWeight: 700, fontSize: "14px", margin: 0 }}>Generated Reports</h4>
          <button onClick={loadReports} style={iconBtnStyle}><RefreshCw size={14} /></button>
        </div>
        {reports.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#4B5563" }}>
            <FileText size={36} style={{ marginBottom: "12px", opacity: 0.3 }} />
            <div style={{ fontSize: "13px" }}>No reports generated yet</div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #222D44" }}>
                {["Type", "Format", "Status", "Generated At", ""].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", color: "#6B7280", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.report_id} style={{ borderBottom: "1px solid #1F2937" }}>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: "#fff", fontWeight: 600 }}>
                    {REPORT_TYPES.find(t => t.id === r.report_type)?.label || r.report_type}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "12px", color: "#9CA3AF", textTransform: "uppercase" }}>
                    {r.report_format}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 700,
                      background: `${STATUS_COLORS[r.status] || "#6B7280"}20`,
                      color: STATUS_COLORS[r.status] || "#6B7280",
                      border: `1px solid ${STATUS_COLORS[r.status] || "#6B7280"}40`
                    }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "12px", color: "#6B7280" }}>
                    {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {r.status === "completed" && (
                      <button
                        onClick={() => download(r.report_id)}
                        style={{
                          display: "flex", alignItems: "center", gap: "6px",
                          padding: "6px 12px", borderRadius: "8px", border: "none",
                          background: "rgba(52,211,153,0.15)", color: "#34d399",
                          fontSize: "12px", fontWeight: 600, cursor: "pointer"
                        }}
                      >
                        <Download size={12} /> Download
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const labelStyle = { fontSize: "12px", color: "#9CA3AF", marginBottom: "6px", display: "block" };
const selectStyle = { width: "100%", background: "#0F1624", border: "1px solid #222D44", color: "#fff", padding: "10px 12px", borderRadius: "8px", fontSize: "13px", outline: "none" };
const iconBtnStyle = { padding: "6px", borderRadius: "8px", border: "1px solid #222D44", background: "rgba(21,27,44,0.65)", color: "#9CA3AF", cursor: "pointer", display: "flex", alignItems: "center" };
const errorStyle = { padding: "12px 16px", borderRadius: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: "13px", display: "flex", gap: "8px" };
const successStyle = { padding: "12px 16px", borderRadius: "10px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399", fontSize: "13px", display: "flex", gap: "8px" };
