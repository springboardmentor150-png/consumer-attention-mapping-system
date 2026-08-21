import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/shopperAnalytics.css";

function ShopperAnalytics() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  const canViewProductInsights =
    role === "Admin" ||
    role === "Retail Analyst" ||
    role === "Marketing Manager";

  const [sessions, setSessions] = useState([]);
  const [scores, setScores] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    fetchSessions();

    if (canViewProductInsights) {
      fetchScores();
      fetchRecommendations();
    }
  }, [canViewProductInsights]);

  const fetchSessions = async () => {
    try {
      const response = await api.get("/analytics/sessions");
      setSessions(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchScores = async () => {
    try {
      const response = await api.get("/analytics/product-scores");
      setScores(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await api.get("/analytics/recommendations");
      setRecommendations(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const explorers = sessions.filter((s) => s.segment === "Explorer").length;

  const quickBuyers = sessions.filter(
    (s) => s.segment === "Quick Buyer",
  ).length;

  const comparison = sessions.filter(
    (s) => s.segment === "Comparison Shopper",
  ).length;

  const regular = sessions.filter(
    (s) => s.segment === "Regular Shopper",
  ).length;

  return (
    <div className="shopper-page">
      {/* Header */}
      <div className="shopper-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ← Dashboard
        </button>

        <h1>👥 Shopper Analytics</h1>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Sessions</h3>
          <p>{sessions.length}</p>
        </div>

        <div className="stat-card">
          <h3>Explorers</h3>
          <p>{explorers}</p>
        </div>

        <div className="stat-card">
          <h3>Quick Buyers</h3>
          <p>{quickBuyers}</p>
        </div>

        <div className="stat-card">
          <h3>Comparison Shoppers</h3>
          <p>{comparison}</p>
        </div>

        <div className="stat-card">
          <h3>Regular Shoppers</h3>
          <p>{regular}</p>
        </div>
      </div>

      {/* Product Attractiveness Scores */}
      {canViewProductInsights && (
        <div className="section-card">
          <h2>🏆 Product Attractiveness Scores</h2>

          <div className="score-grid">
            {scores.map((item) => (
              <div className="score-card" key={item.id}>
                <h3>{item.product_name}</h3>

                <h1>{item.attractiveness_score}</h1>

                <p>/100</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Heatmap */}
      <div className="section-card">
        <h2>🔥 Store Heatmap</h2>

        <img
          src={`http://127.0.0.1:8000/heatmaps/store?${Date.now()}`}
          alt="Heatmap"
          className="heatmap"
        />
      </div>

      {/* Shopper Table */}
      <div className="section-card">
        <h2>🧑 Recent Shopper Sessions</h2>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Segment</th>
              <th>Dwell</th>
              <th>Zone A</th>
              <th>Zone B</th>
              <th>Zone C</th>
              <th>Most Viewed</th>
            </tr>
          </thead>

          <tbody>
            {sessions.map((session) => (
              <tr key={session.id}>
                <td>{session.shopper_id}</td>

                <td>{session.segment}</td>

                <td>{session.dwell_time}</td>

                <td>{session.zone_a_time}</td>

                <td>{session.zone_b_time}</td>

                <td>{session.zone_c_time}</td>

                <td>{session.most_viewed_zone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI Recommendations */}
      {canViewProductInsights && (
        <div className="section-card">
          <h2>💡 AI Recommendations</h2>

          <div className="recommendation-list">
            {recommendations.map((item) => (
              <div key={item.product} className="recommendation-card">
                <h3>{item.product}</h3>

                <p>⭐ Score: {item.score}/100</p>

                <p>🔥 Priority: {item.priority}</p>

                <p>📂 Category: {item.category}</p>

                <div className="recommendation-text">
                  {Array.isArray(item.recommendation) ? (
                    <ul>
                      {item.recommendation.map((message, index) => (
                        <li key={index}>{message}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{item.recommendation}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ShopperAnalytics;
