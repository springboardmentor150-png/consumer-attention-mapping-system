import React, { useEffect, useState } from "react";

export default function App() {
  const [role, setRole] = useState("Store Manager");
  const [attentionData, setAttentionData] = useState(null);
  const [segments, setSegments] = useState(null);
  const [attractiveness, setAttractiveness] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [heatmapUrl, setHeatmapUrl] = useState("");

  const fetchAllData = () => {
    fetch("http://localhost:8000/api/analytics/attention")
      .then((res) => res.json())
      .then((data) => setAttentionData(data.data?.[0]))
      .catch((err) => console.error("Error fetching attention:", err));

    fetch("http://localhost:8000/api/analytics/segments")
      .then((res) => res.json())
      .then((data) => setSegments(data.segments))
      .catch((err) => console.error("Error fetching segments:", err));

    fetch("http://localhost:8000/api/analytics/attractiveness")
      .then((res) => res.json())
      .then((data) => setAttractiveness(data))
      .catch((err) => console.error("Error fetching score:", err));

    fetch("http://localhost:8000/api/recommendations")
      .then((res) => res.json())
      .then((data) => setRecommendations(data.recommendations || []))
      .catch((err) => console.error("Error fetching recommendations:", err));

    fetch("http://localhost:8000/api/heatmaps/store")
      .then((res) => res.json())
      .then((data) => setHeatmapUrl(data.heatmap_url))
      .catch((err) => console.error("Error fetching heatmap:", err));
  };

  useEffect(() => {
    fetchAllData();
    const timer = setInterval(fetchAllData, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleExport = () => {
    window.location.href = "http://localhost:8000/api/reports/export";
  };

  return (
    <div style={{ padding: "30px", fontFamily: "sans-serif", backgroundColor: "#0f172a", color: "#f8fafc", minHeight: "100vh" }}>
      
      {/* Top Header & Role Selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", borderBottom: "1px solid #334155", paddingBottom: "15px", flexWrap: "wrap", gap: "15px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px" }}>Consumer Attention Mapping Dashboard</h1>
          <p style={{ margin: "5px 0 0", color: "#94a3b8" }}>Milestone 4: Role-Based Analytics & Alert System</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          {/* Role Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ color: "#94a3b8", fontWeight: "bold" }}>View Role:</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                backgroundColor: "#1e293b",
                color: "#38bdf8",
                border: "1px solid #38bdf8",
                padding: "10px 14px",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: "14px",
                cursor: "pointer"
              }}
            >
              <option value="Store Manager">🏬 Store Manager</option>
              <option value="Retail Analyst">📊 Retail Analyst</option>
              <option value="Marketing Manager">🎯 Marketing Manager</option>
            </select>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            style={{
              backgroundColor: "#0284c7",
              color: "#ffffff",
              padding: "10px 18px",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              fontSize: "14px",
              cursor: "pointer"
            }}
          >
            📊 Export Report
          </button>
        </div>
      </div>

      {/* Role Banner */}
      <div style={{ backgroundColor: "#1e293b", border: "1px solid #334155", padding: "12px 20px", borderRadius: "8px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#38bdf8", fontWeight: "bold", fontSize: "16px" }}>
          Active View: {role}
        </span>
        <span style={{ color: "#94a3b8", fontSize: "14px" }}>
          {role === "Store Manager" && "Prioritizing immediate store alerts, conversion rate optimizations, and actionable tasks."}
          {role === "Retail Analyst" && "Deep-diving into foot-traffic heatmaps, shopper dwell dynamics, and segment distributions."}
          {role === "Marketing Manager" && "Monitoring shelf attractiveness scores, engagement trends, and promotion readiness."}
        </span>
      </div>

      {/* Real-Time Push Alerts & Recommendations */}
      {recommendations.map((rec, index) => (
        <div key={index} style={{ backgroundColor: "#1e293b", borderLeft: "5px solid #f59e0b", padding: "16px", borderRadius: "8px", marginBottom: "25px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ backgroundColor: "#f59e0b", color: "#000", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>ALERT</span>
            <h3 style={{ margin: 0, color: "#f59e0b", fontSize: "18px" }}>{rec.alert}</h3>
          </div>
          <p style={{ margin: "8px 0 0", color: "#cbd5e1", fontSize: "15px" }}><strong>Recommended Action:</strong> {rec.action}</p>
        </div>
      ))}

      {/* Role-Specific Metrics Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "25px" }}>
        
        {/* Attractiveness Score Card */}
        <div style={{ backgroundColor: "#1e293b", padding: "20px", borderRadius: "8px", border: role === "Marketing Manager" ? "1px solid #38bdf8" : "none" }}>
          <h3 style={{ marginTop: 0, color: "#38bdf8" }}>Shelf Attractiveness Score</h3>
          {attractiveness ? (
            <div>
              <span style={{ fontSize: "42px", fontWeight: "bold", color: "#38bdf8" }}>{attractiveness.attractiveness_score}</span>
              <span style={{ fontSize: "18px", color: "#94a3b8" }}> / 100</span>
              <div style={{ marginTop: "12px", color: "#cbd5e1", fontSize: "14px", lineHeight: "1.6" }}>
                <div>Attention Score: <strong>{attractiveness.metrics?.attention_duration_score}</strong></div>
                <div>Interaction Score: <strong>{attractiveness.metrics?.interaction_freq_score}</strong></div>
                {role === "Marketing Manager" && (
                  <div style={{ marginTop: "8px", color: "#4ade80" }}>
                    ✓ High engagement threshold met
                  </div>
                )}
              </div>
            </div>
          ) : <p>Loading score...</p>}
        </div>

        {/* Dwell Time & Shopper Analytics */}
        {(role === "Store Manager" || role === "Retail Analyst") && (
          <div style={{ backgroundColor: "#1e293b", padding: "20px", borderRadius: "8px", border: role === "Store Manager" ? "1px solid #38bdf8" : "none" }}>
            <h3 style={{ marginTop: 0, color: "#38bdf8" }}>Shelf Dwell Analytics</h3>
            {attentionData ? (
              <div style={{ lineHeight: "2", fontSize: "15px" }}>
                <p style={{ margin: 0 }}>Target Area: <strong>{attentionData.shelf_id}</strong></p>
                <p style={{ margin: 0 }}>Shopper Count: <strong>{attentionData.shopper_count}</strong></p>
                <p style={{ margin: 0 }}>Avg Dwell Duration: <strong>{attentionData.avg_dwell_time_seconds}s</strong></p>
                {role === "Store Manager" && (
                  <p style={{ margin: 0, color: "#f59e0b" }}>Queue/Congestion Risk: <strong>Low</strong></p>
                )}
              </div>
            ) : <p>Loading dwell analytics...</p>}
          </div>
        )}

        {/* Shopper Segments */}
        {(role === "Retail Analyst" || role === "Marketing Manager") && (
          <div style={{ backgroundColor: "#1e293b", padding: "20px", borderRadius: "8px", border: role === "Retail Analyst" ? "1px solid #38bdf8" : "none" }}>
            <h3 style={{ marginTop: 0, color: "#38bdf8" }}>Shopper Behavioral Segments</h3>
            {segments ? (
              <ul style={{ listStyle: "none", padding: 0, lineHeight: "2", fontSize: "15px" }}>
                <li>Explorers: <strong>{segments.Explorer}</strong></li>
                <li>Quick Buyers: <strong>{segments["Quick Buyer"]}</strong></li>
                <li>Comparison Shoppers: <strong>{segments["Comparison Shopper"]}</strong></li>
              </ul>
            ) : <p>Loading segments...</p>}
          </div>
        )}

      </div>

      {/* Spatial Heatmap */}
      {(role === "Retail Analyst" || role === "Store Manager") && (
        <div style={{ backgroundColor: "#1e293b", padding: "20px", borderRadius: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3 style={{ margin: 0, color: "#38bdf8" }}>Spatial Foot-Traffic Heatmap</h3>
            <span style={{ fontSize: "13px", color: "#94a3b8" }}>Updated in real-time</span>
          </div>
          {heatmapUrl ? (
            <img src={heatmapUrl} alt="Store Traffic Heatmap" style={{ width: "100%", maxHeight: "480px", objectFit: "contain", borderRadius: "6px" }} />
          ) : <p>Loading heatmap image...</p>}
        </div>
      )}

    </div>
  );
}