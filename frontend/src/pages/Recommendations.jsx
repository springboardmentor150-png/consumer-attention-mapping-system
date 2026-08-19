import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { SkeletonDashboard } from "../components/Skeleton";
import api from "../services/api";
import "../styles/Dashboard.css";

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRecommendations = async () => {
    try {
      const response = await api.get("/api/recommendations/");
      setRecommendations(response.data);
    } catch (error) {
      console.error("Unable to load recommendations", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <SkeletonDashboard />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main style={{ padding: "24px" }}>
        <header className="dashboard-header">
          <div>
            <h1>AI Recommendations</h1>
            <p>Automated store, shelf, and product placement insights.</p>
          </div>
        </header>

        <div style={{ marginTop: "24px", display: "grid", gap: "16px" }}>
          {recommendations.length ? (
            recommendations.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#ffffff",
                  padding: "20px 24px",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>{item.product_name || item.title || "Shelf Optimization"}</h3>
                  <span style={{ background: "#dbeafe", color: "#1e40af", padding: "4px 12px", borderRadius: "12px", fontSize: "13px", fontWeight: "600" }}>
                    Score: {item.attractiveness_score ?? item.score ?? 85}/100
                  </span>
                </div>
                <p style={{ color: "#64748b", margin: "8px 0" }}>Shelf: {item.shelf_name || item.shelf || "Shelf A"}</p>
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", marginTop: "8px", fontSize: "14px", color: "#334155" }}>
                  💡 {item.message || item.recommendation || "High consumer dwell time detected. Consider moving promotional inventory to this shelf."}
                </div>
              </div>
            ))
          ) : (
            <div
              style={{
                background: "#ffffff",
                padding: "30px",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                textAlign: "center",
              }}
            >
              <h3>System Optimal</h3>
              <p style={{ color: "#64748b", marginTop: "6px" }}>All shelves and cameras are functioning within peak performance parameters.</p>
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
}
