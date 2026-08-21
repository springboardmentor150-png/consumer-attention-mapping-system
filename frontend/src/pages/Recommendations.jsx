import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Lightbulb, RefreshCw, CheckCircle, X, TrendingUp, Eye, MapPin, Package, AlertTriangle } from "lucide-react";

const TYPE_ICONS = {
  improve_shelf_visibility: Eye,
  promote_high_performer: TrendingUp,
  improve_zone_traffic: MapPin,
  improve_product_visibility: Package,
  promotional_placement: Lightbulb
};

const TYPE_LABELS = {
  improve_shelf_visibility: "Shelf Visibility",
  promote_high_performer: "High Performer",
  improve_zone_traffic: "Zone Traffic",
  improve_product_visibility: "Product Visibility",
  promotional_placement: "Promotional Placement"
};

const TYPE_COLORS = {
  improve_shelf_visibility: "#4FACFE",
  promote_high_performer: "#34d399",
  improve_zone_traffic: "#a78bfa",
  improve_product_visibility: "#fbbf24",
  promotional_placement: "#f87171"
};

export default function Recommendations() {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api.getStores().then(s => { setStores(s); if (s.length) setSelectedStore(s[0].store_id); });
  }, []);

  useEffect(() => { if (selectedStore) loadRecs(); }, [selectedStore]);

  const loadRecs = async () => {
    setLoading(true);
    try {
      const data = await api.getRecommendations(selectedStore);
      setRecs(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const generate = async () => {
    if (!selectedStore) return;
    setGenerating(true);
    setError("");
    try {
      const result = await api.generateRecommendations(selectedStore);
      setSuccess(`Generated ${result.generated} new recommendations`);
      await loadRecs();
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const dismiss = async (id) => {
    try {
      await api.dismissRecommendation(id);
      setRecs(prev => prev.filter(r => r.recommendation_id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  const grouped = recs.reduce((acc, rec) => {
    const type = rec.recommendation_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(rec);
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", margin: 0 }}>
            AI Recommendations
          </h2>
          <p style={{ color: "#9CA3AF", fontSize: "13px", margin: "4px 0 0" }}>
            Data-driven retail optimization from real analytics
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select value={selectedStore} onChange={e => setSelectedStore(e.target.value)} style={selectStyle}>
            {stores.map(s => <option key={s.store_id} value={s.store_id}>{s.store_name}</option>)}
          </select>
          <button onClick={loadRecs} style={iconBtnStyle}><RefreshCw size={16} /></button>
          <button
            onClick={generate}
            disabled={generating || !selectedStore}
            style={{
              padding: "8px 16px",
              borderRadius: "10px",
              border: "none",
              background: generating ? "#1F2937" : "linear-gradient(135deg,#34d399,#059669)",
              color: generating ? "#4B5563" : "#fff",
              fontWeight: 700,
              fontSize: "13px",
              cursor: generating ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Lightbulb size={14} />
            {generating ? "Generating..." : "Generate Recs"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: "13px", display: "flex", gap: "8px" }}>
          <AlertTriangle size={14} /> {error}
          <button onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>✕</button>
        </div>
      )}
      {success && (
        <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399", fontSize: "13px", display: "flex", gap: "8px" }}>
          <CheckCircle size={14} /> {success}
          <button onClick={() => setSuccess("")} style={{ marginLeft: "auto", background: "none", border: "none", color: "#34d399", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
        {Object.entries(TYPE_LABELS).map(([type, label]) => {
          const count = (grouped[type] || []).length;
          const Icon = TYPE_ICONS[type] || Lightbulb;
          const color = TYPE_COLORS[type] || "#6B7280";
          return (
            <div key={type} style={{ background: "rgba(21,27,44,0.65)", border: `1px solid ${color}30`, borderRadius: "12px", padding: "14px", textAlign: "center" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", color }}>
                <Icon size={16} />
              </div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#fff" }}>{count}</div>
              <div style={{ fontSize: "10px", color: "#9CA3AF", marginTop: "2px" }}>{label}</div>
            </div>
          );
        })}
      </div>

      {/* Recommendations */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#6B7280" }}>Loading recommendations...</div>
      ) : recs.length === 0 ? (
        <div style={{ background: "rgba(21,27,44,0.65)", border: "1px solid #222D44", borderRadius: "14px", padding: "48px", textAlign: "center", color: "#4B5563" }}>
          <Lightbulb size={40} style={{ marginBottom: "12px", opacity: 0.3 }} />
          <div style={{ fontSize: "14px", color: "#6B7280" }}>No recommendations yet.</div>
          <div style={{ fontSize: "12px", marginTop: "4px" }}>Process videos first, then click "Generate Recs"</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {recs.map(rec => {
            const Icon = TYPE_ICONS[rec.recommendation_type] || Lightbulb;
            const color = TYPE_COLORS[rec.recommendation_type] || "#6B7280";
            return (
              <div key={rec.recommendation_id} style={{
                background: "rgba(21,27,44,0.65)",
                border: `1px solid ${color}25`,
                borderLeft: `4px solid ${color}`,
                borderRadius: "12px",
                padding: "20px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                  <div style={{ display: "flex", gap: "12px", flex: 1 }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
                      <Icon size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "4px", background: `${color}15`, color, border: `1px solid ${color}30`, fontWeight: 600 }}>
                          {TYPE_LABELS[rec.recommendation_type] || rec.recommendation_type}
                        </span>
                        <span style={{ fontSize: "11px", color: "#6B7280" }}>
                          Confidence: {((rec.confidence || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>
                        {rec.recommendation_text}
                      </h4>
                      <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "0 0 8px", lineHeight: 1.6 }}>
                        <strong>Why:</strong> {rec.reason}
                      </p>
                      {rec.supporting_metric && (
                        <div style={{ fontSize: "11px", padding: "6px 10px", background: "rgba(11,15,25,0.6)", borderRadius: "6px", color: "#6B7280", display: "inline-block" }}>
                          📊 {rec.supporting_metric}
                        </div>
                      )}
                      {rec.expected_impact && (
                        <p style={{ fontSize: "12px", color: "#34d399", margin: "8px 0 0" }}>
                          <strong>Expected Impact:</strong> {rec.expected_impact}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => dismiss(rec.recommendation_id)}
                    style={{ padding: "6px", borderRadius: "6px", border: "1px solid #222D44", background: "transparent", color: "#6B7280", cursor: "pointer" }}
                    title="Dismiss"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const selectStyle = { background: "#151B2C", border: "1px solid #222D44", color: "#fff", padding: "8px 12px", borderRadius: "10px", fontSize: "13px", outline: "none" };
const iconBtnStyle = { padding: "8px", borderRadius: "8px", border: "1px solid #222D44", background: "rgba(21,27,44,0.65)", color: "#9CA3AF", cursor: "pointer", display: "flex", alignItems: "center" };
