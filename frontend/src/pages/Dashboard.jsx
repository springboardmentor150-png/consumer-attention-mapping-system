import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { Bar } from "react-chartjs-2";
import "../styles/dashboard.css";

import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
);

function Dashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  const canRunAI = role === "Admin" || role === "Store Manager";

  const [summary, setSummary] = useState({
    total_shoppers: 0,
    average_dwell: 0,
    most_viewed_zone: "-",
  });

  const [sessions, setSessions] = useState([]);
  const [runningAI, setRunningAI] = useState(false);

  const barData = {
    labels: ["Zone A", "Zone B", "Zone C"],
    datasets: [
      {
        label: "Attention Time (sec)",
        data: [
          sessions.reduce((sum, s) => sum + s.zone_a_time, 0),
          sessions.reduce((sum, s) => sum + s.zone_b_time, 0),
          sessions.reduce((sum, s) => sum + s.zone_c_time, 0),
        ],
        backgroundColor: ["#4F46E5", "#06B6D4", "#F59E0B"],
        borderRadius: 8,
      },
    ],
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/");
      return;
    }

    fetchSummary();
    fetchSessions();

    const interval = setInterval(() => {
      fetchSummary();
      fetchSessions();
    }, 3000);

    return () => clearInterval(interval);
  }, [navigate]);

  const fetchSummary = async () => {
    try {
      const response = await api.get("/analytics/summary");

      setSummary(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await api.get("/analytics/sessions");

      setSessions(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const runAIAnalysis = () => {
    setRunningAI(true);

    api.post("/analytics/run").catch((error) => {
      console.log(error);
      setRunningAI(false);
    });

    // Keep button disabled while AI is expected to run
    setTimeout(() => {
      setRunningAI(false);
    }, 35000);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    navigate("/");
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Consumer Attention Mapping System</h1>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Navigation */}
      <div className="top-nav">
        <input type="text" placeholder="🔍 Search..." className="search-bar" />

        <div className="nav-links">
          <span onClick={() => navigate("/stores")}>🏪 Stores</span>

          <span onClick={() => navigate("/shelves")}>📦 Shelves</span>

          <span
            onClick={() =>
              document.getElementById("analytics").scrollIntoView({
                behavior: "smooth",
              })
            }
          >
            📊 Analytics
          </span>

          <span onClick={() => navigate("/reports")}>📄 Reports</span>
        </div>
      </div>

      <div className="hello-section">
        <h2>Hello, {user?.email.split("@")[0]} 👋</h2>
        <p>Welcome back! Here's today's retail overview.</p>
      </div>

      <div className="cards">
        <div className="profile-card">
          <h2>👤 My Profile</h2>

          <p>
            <strong>Email</strong>
            <br />
            {user?.email}
          </p>

          <p>
            <strong>Role</strong>
            <br />
            {role}
          </p>
        </div>

        <div className="card" onClick={() => navigate("/stores")}>
          <h2>🏪 Stores</h2>

          <p>Manage all retail store locations.</p>

          <h4>Click to Open →</h4>
        </div>

        <div className="card" onClick={() => navigate("/shelves")}>
          <h2>📦 Shelves</h2>

          <p>Manage shelf layouts and zones.</p>

          <h4>Click to Open →</h4>
        </div>

        {(role === "Admin" ||
          role === "Store Manager" ||
          role === "Retail Analyst" ||
          role === "Marketing Manager") && (
          <div className="card" onClick={() => navigate("/shopper-analytics")}>
            <h2>👥 Shopper Analytics</h2>

            <p>
              View detailed shopper sessions, behavior segmentation, heatmaps
              and recommendations.
            </p>

            <h4>Click to Open →</h4>
          </div>
        )}
        <div className="card" onClick={() => navigate("/reports")}>
          <h2>📄 Reports</h2>

          <p>View consumer attention, product, shelf and marketing reports.</p>

          <h4>Click to Open →</h4>
        </div>
      </div>

      {/* Analytics Section */}

      <div className="analytics-section" id="analytics">
        <div className="analytics-header">
          <h2>📊 Shopper Analytics</h2>

          {canRunAI && (
            <button
              className="run-ai-btn"
              onClick={runAIAnalysis}
              disabled={runningAI}
            >
              {runningAI ? "⏳ Running..." : "▶ Run AI Analysis"}
            </button>
          )}
        </div>

        {/* Summary Cards */}

        <div className="summary-grid">
          <div className="analytics-card">
            <h3>Total Shoppers</h3>
            <p>{summary.total_shoppers}</p>
          </div>

          <div className="analytics-card">
            <h3>Average Dwell</h3>
            <p>{summary.average_dwell} sec</p>
          </div>

          <div className="analytics-card">
            <h3>Most Viewed Zone</h3>
            <p>{summary.most_viewed_zone}</p>
          </div>
        </div>

        {/* Charts */}

        <div className="charts-container">
          <div className="chart-card">
            <h3>Attention Distribution by Shelf Zone</h3>

            <Bar
              data={barData}
              options={{
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                  legend: {
                    display: false,
                  },
                },

                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
