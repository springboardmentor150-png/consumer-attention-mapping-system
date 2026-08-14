import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import AttentionChart from "../components/AttentionChart";
import AttentionPieChart from "../components/AttentionPieChart";
import RecentActivity from "../components/RecentActivity";
import Loader from "../components/Loader";
import Notification from "../components/Notification";
import {
  PeopleFill,

  EyeFill,
  BarChartFill,
} from "react-bootstrap-icons";

import "../styles/dashboard.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const [records, setRecords] = useState([]);
  const [products, setProducts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [heatmapVersion, setHeatmapVersion] = useState(Date.now());
  const [attentionTrend, setAttentionTrend] = useState([]);
  const [attentionSummary, setAttentionSummary] = useState({
    total_records: 0,
    total_attention: 0,
    average_attention: 0,
    maximum_attention: 0,
    minimum_attention: 0,
  });

  const getRoleDescription = () => {
    switch (userRole) {
      case "Store Manager":
        return "Monitor store operations, shelf performance, and product activity.";
      case "Retail Analyst":
        return "Analyze consumer attention, engagement, and product performance.";
      case "Marketing Manager":
        return "Track product attractiveness, customer engagement, and marketing opportunities.";
      default:
        return "Monitor consumer attention and product performance.";
    }
  };

  // Initial data load
  useEffect(() => {
    const role = localStorage.getItem("user_role") || "Store Manager";
    setUserRole(role);

    const token = localStorage.getItem("access_token");

    const fetchDashboardData = async () => {
      try {
        const [recordsResponse, productsResponse, trendResponse] =
          await Promise.all([
            fetch("http://127.0.0.1:8000/attention-records", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

    fetch("http://127.0.0.1:8000/api/product-score", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

    fetch("http://127.0.0.1:8000/api/analytics/attention-trend", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),
  ]);

        const recordsData = await recordsResponse.json();
        const productsData = await productsResponse.json();
        const trendData = await trendResponse.json();

        if (!recordsResponse.ok) {
          throw new Error("Failed to load attention records");
        }

        if (!productsResponse.ok) {
          throw new Error("Failed to load product scores");
        }

        setRecords(recordsData);
        setAttentionTrend(trendData.trend || []);
        setProducts(productsData.products || []);

        const lowScoreProducts = (productsData.products || [])
          .filter((product) => product.attractiveness_score < 40)
          .map((product) => ({
            product_id: product.product_id,
            product_name: product.product_name,
            attractiveness_score: product.attractiveness_score,
            message: "Product score is below the recommended threshold.",
          }));

        setAlerts(lowScoreProducts);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Automatically refresh heatmap every 5 seconds
  useEffect(() => {
    const heatmapInterval = setInterval(() => {
      setHeatmapVersion(Date.now());
    }, 5000);

    return () => {
      clearInterval(heatmapInterval);
    };
  }, []);

  // Refresh attention summary every 5 seconds
  useEffect(() => {
    const fetchAttentionSummary = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/analytics/attention-summary",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`
            }
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load attention summary");
        }

        const data = await response.json();
        setAttentionSummary(data);
      } catch (error) {
        console.error("Attention summary error:", error);
      }
    };

    fetchAttentionSummary();

    const summaryInterval = setInterval(() => {
      fetchAttentionSummary();
    }, 5000);

    return () => {
      clearInterval(summaryInterval);
    };
  }, []);

  // Refresh attention trend every 5 seconds
  useEffect(() => {
    const fetchAttentionTrend = async () => {
      try {
        const response = await fetch(
            "http://127.0.0.1:8000/api/analytics/attention-trend",
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("access_token")}`
                }
            }
        );

        if (!response.ok) {
          throw new Error("Failed to refresh attention trend");
        }

        const data = await response.json();
        setAttentionTrend(data.trend || []);
      } catch (error) {
        console.error("Attention trend refresh error:", error);
      }
    };

    const trendInterval = setInterval(() => {
      fetchAttentionTrend();
    }, 5000);

    return () => {
      clearInterval(trendInterval);
    };
  }, []);

  const attentionChartData = {
  labels: attentionTrend.map(
    (_, index) => `Record ${index + 1}`
  ),

  datasets: [
    {
      label: "Attention Duration (seconds)",
      data: attentionTrend.map(
        (item) =>
          Number(item.attention_duration) || 0
      ),

      borderColor: "rgba(15, 118, 110, 1)",
      backgroundColor: "rgba(15, 118, 110, 0.12)",
      borderWidth: 3,
      pointRadius: 3,
      pointHoverRadius: 6,
      tension: 0.35,
      fill: true
    }
  ]
};

  const attentionChartOptions = {
  responsive: true,
  maintainAspectRatio: false,

  interaction: {
    mode: "index",
    intersect: false
  },

  plugins: {
    legend: {
      position: "top"
    },

    tooltip: {
      callbacks: {
        label: (context) =>
          ` ${Number(
            context.raw || 0
          ).toFixed(2)} seconds`
      }
    }
  },

  scales: {
    y: {
      beginAtZero: true,

      grid: {
        color: "rgba(148, 163, 184, 0.2)"
      },

      title: {
        display: true,
        text: "Attention Duration (seconds)"
      }
    },

    x: {
      grid: {
        display: false
      },

      title: {
        display: true,
        text: "Attention Records"
      }
    }
  }
};

  const topProducts = [...products]
    .sort(
      (a, b) =>
        Number(b.attractiveness_score || 0) -
        Number(a.attractiveness_score || 0)
    )
    .slice(0, 3);
const productComparisonData = {
  labels: products.map(
    (product) => product.product_name
  ),

  datasets: [
    {
      label: "Views",
      data: products.map(
        (product) => Number(product.views || 0)
      ),
      backgroundColor: "rgba(37, 99, 235, 0.75)",
      borderColor: "rgba(37, 99, 235, 1)",
      borderWidth: 1,
      borderRadius: 6
    },
    {
      label: "Pickups",
      data: products.map(
        (product) => Number(product.pickups || 0)
      ),
      backgroundColor: "rgba(15, 118, 110, 0.75)",
      borderColor: "rgba(15, 118, 110, 1)",
      borderWidth: 1,
      borderRadius: 6
    },
    {
      label: "Purchases",
      data: products.map(
        (product) => Number(product.purchases || 0)
      ),
      backgroundColor: "rgba(245, 158, 11, 0.75)",
      borderColor: "rgba(245, 158, 11, 1)",
      borderWidth: 1,
      borderRadius: 6
    }
  ]
};

 const productComparisonOptions = {
  responsive: true,
  maintainAspectRatio: false,

  plugins: {
    legend: {
      position: "top"
    },

    tooltip: {
      mode: "index",
      intersect: false
    }
  },

  scales: {
    y: {
      beginAtZero: true,

      grid: {
        color: "rgba(148, 163, 184, 0.2)"
      },

      title: {
        display: true,
        text: "Count"
      }
    },

    x: {
      grid: {
        display: false
      },

      title: {
        display: true,
        text: "Products"
      }
    }
  }
};
  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="dashboard-content">
        <Navbar />

        <div className="dashboard-header">
          <h2>
            {userRole === "Store Manager"
              ? "Store Manager Dashboard"
              : userRole === "Retail Analyst"
              ? "Retail Analytics Dashboard"
              : userRole === "Marketing Manager"
              ? "Marketing Dashboard"
              : "Dashboard"}
          </h2>

          <p>{getRoleDescription()}</p>
        </div>

        <div className="role-banner">
          <span>Dashboard Role</span>
          <strong>{userRole}</strong>
        </div>

        <Notification alerts={alerts} />

        {/* Summary Cards */}
        <div className="stats-grid">
          <StatCard
            title="Total Attention"
            value={`${attentionSummary.total_attention} sec`}
            change="Recorded"
            color="#0F766E"
            icon={<EyeFill />}
          />

          <StatCard
            title="Average Attention"
            value={`${attentionSummary.average_attention} sec`}
            change="Per Interaction"
            color="#2563EB"
            icon={<BarChartFill />}
          />

          <StatCard
            title="Maximum Attention"
            value={`${attentionSummary.maximum_attention} sec`}
            change="Highest Recorded"
            color="#F59E0B"
            icon={<EyeFill />}
          />

          <StatCard
            title="Attention Records"
            value={attentionSummary.total_records}
            change="Interactions"
            color="#8B5CF6"
            icon={<PeopleFill />}
          />

          {userRole === "Store Manager" && (
            <>
              <StatCard
                title="Total Products"
                value={products.length}
                change="Tracked"
                color="#0F766E"
                icon={<BarChartFill />}
              />

              <StatCard
                title="Total Views"
                value={products.reduce(
                  (sum, product) => sum + product.views,
                  0
                )}
                change="Customer Views"
                color="#2563EB"
                icon={<EyeFill />}
              />

              <StatCard
                title="Total Pickups"
                value={products.reduce(
                  (sum, product) => sum + product.pickups,
                  0
                )}
                change="Product Interactions"
                color="#F59E0B"
                icon={<PeopleFill />}
              />

              <StatCard
                title="Total Purchases"
                value={products.reduce(
                  (sum, product) => sum + product.purchases,
                  0
                )}
                change="Conversions"
                color="#8B5CF6"
                icon={<BarChartFill />}
              />
            </>
          )}

          {userRole === "Retail Analyst" && (
            <>
              <StatCard
                title="Consumers"
                value={records.length}
                change="Attention Records"
                color="#0F766E"
                icon={<PeopleFill />}
              />

              <StatCard
                title="Total Attention"
                value={`${records
                  .reduce(
                    (sum, record) =>
                      sum + (record.total_attention_duration || 0),
                    0
                  )
                  .toFixed(1)} sec`}
                change="Recorded"
                color="#2563EB"
                icon={<EyeFill />}
              />

              <StatCard
                title="Products Analyzed"
                value={products.length}
                change="Analytics"
                color="#F59E0B"
                icon={<BarChartFill />}
              />

              <StatCard
                title="Avg Product Score"
                value={
                  products.length > 0
                    ? (
                        products.reduce(
                          (sum, product) =>
                            sum + product.attractiveness_score,
                          0
                        ) / products.length
                      ).toFixed(1)
                    : "0"
                }
                change="Attractiveness"
                color="#8B5CF6"
                icon={<BarChartFill />}
              />
            </>
          )}

          {userRole === "Marketing Manager" && (
            <>
              <StatCard
                title="Products Analyzed"
                value={products.length}
                change="Marketing Data"
                color="#0F766E"
                icon={<BarChartFill />}
              />

              <StatCard
                title="Total Purchases"
                value={products.reduce(
                  (sum, product) => sum + product.purchases,
                  0
                )}
                change="Conversions"
                color="#2563EB"
                icon={<BarChartFill />}
              />

              <StatCard
                title="Avg Conversion"
                value={
                  products.length > 0
                    ? (
                        products.reduce(
                          (sum, product) => sum + product.conversion_rate,
                          0
                        ) / products.length
                      ).toFixed(1) + "%"
                    : "0%"
                }
                change="Purchase Rate"
                color="#F59E0B"
                icon={<EyeFill />}
              />

              <StatCard
                title="Low Score Products"
                value={
                  products.filter(
                    (product) => product.attractiveness_score < 40
                  ).length
                }
                change="Needs Attention"
                color="#DC2626"
                icon={<PeopleFill />}
              />
            </>
          )}
        </div>

        {/* Loading */}
        {loading ? (
          <Loader label="Loading attention and product data..." />
        ) : error ? (
          <div className="dashboard-error">{error}</div>
        ) : (
          <>
            {/* Attention Charts */}
            {records.length === 0 ? (
              <div className="coming-soon-card">
                <p>
                  No attention records yet — data will appear here once
                  cameras start reporting.
                </p>
              </div>
            ) : (
              <>
                {/* Existing Charts */}
                <div className="charts-grid">
                  <div className="chart-card">
                    <AttentionChart records={records} />
                  </div>

                  <div className="chart-card chart-card-pie">
                    <AttentionPieChart records={records} />
                  </div>
                </div>

                <div className="activity-section">
                  <RecentActivity />
                </div>

                {/* Attention Trend */}
                <div className="attention-trend-section">
                  <div className="attention-trend-card">
                    <div className="attention-trend-header">
                      <div>
                        <h3>Attention Trend</h3>
                        <p>
                          Consumer attention duration across recorded
                          interactions.
                        </p>
                      </div>
                    </div>

                    <div className="attention-trend-chart">
                      {attentionTrend.length > 0 ? (
                        <Line
                          data={attentionChartData}
                          options={attentionChartOptions}
                        />
                      ) : (
                        <p className="no-data-message">
                          No attention trend data available.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Top Performing Products */}
                <div className="top-products-section">
                  <div className="top-products-card">
                    <div className="top-products-header">
                      <div>
                        <h3>Top Performing Products</h3>
                        <p>
                          Products ranked by consumer attractiveness score.
                        </p>
                      </div>
                    </div>

                    <div className="top-products-list">
                      {topProducts.length > 0 ? (
                        topProducts.map((product, index) => (
                          <div
                            className="top-product-row"
                            key={product.product_id}
                          >
                            <div className="top-product-rank">
                              #{index + 1}
                            </div>

                            <div className="top-product-info">
                              <strong>{product.product_name}</strong>
                              <span>
                                {product.views} views •{" "}
                                {product.pickups} pickups •{" "}
                                {product.purchases} purchases
                              </span>
                            </div>

                            <div className="top-product-attention">
                              <span>
                                {Number(
                                  product.attention_duration || 0
                                ).toFixed(2)}{" "}
                                sec attention
                              </span>
                            </div>

                            <div className="top-product-score">
                              <strong>
                                {Number(
                                  product.attractiveness_score || 0
                                ).toFixed(1)}
                              </strong>
                              <span>Score</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="no-data-message">
                          No product data available.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Product Performance Comparison */}
                <div className="product-comparison-section">
                  <div className="product-comparison-card">
                    <div className="product-comparison-header">
                      <div>
                        <h3>Product Performance Comparison</h3>
                        <p>Compare product views, pickups, and purchases.</p>
                      </div>
                    </div>

                    <div className="product-comparison-chart">
                      {products.length > 0 ? (
                        <Bar
                          data={productComparisonData}
                          options={productComparisonOptions}
                        />
                      ) : (
                        <p className="no-data-message">
                          No product data available.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Product Recommendations */}
                <div className="recommendations-section">
                  <div className="recommendations-card">
                    <div className="recommendations-header">
                      <div>
                        <h3>Product Recommendations</h3>
                        <p>
                          AI-assisted recommendations based on consumer
                          behavior.
                        </p>
                      </div>
                    </div>

                    <div className="recommendations-list">
                      {products.length > 0 ? (
                        products.map((product) => (
                          <div
                            className="recommendation-product"
                            key={product.product_id}
                          >
                            <div className="recommendation-product-header">
                              <strong>{product.product_name}</strong>

                              <span className="recommendation-score">
                                Score:{" "}
                                {Number(
                                  product.attractiveness_score || 0
                                ).toFixed(1)}
                              </span>
                            </div>

                            <div className="recommendation-items">
                              {Array.isArray(product.recommendation) &&
                              product.recommendation.length > 0 ? (
                                product.recommendation.map(
                                  (recommendation, index) => (
                                    <div
                                      className="recommendation-item"
                                      key={index}
                                    >
                                      <span className="recommendation-dot">
                                        •
                                      </span>
                                      <span>{recommendation}</span>
                                    </div>
                                  )
                                )
                              ) : (
                                <div className="recommendation-item">
                                  <span className="recommendation-dot">
                                    •
                                  </span>
                                  <span>
                                    Product performance is currently stable.
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="no-data-message">
                          No recommendations available.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Heatmap */}
                <div className="heatmap-section">
                  <div className="heatmap-card">
                    <div className="heatmap-header">
                      <div>
                        <h3>Consumer Attention Heatmap</h3>
                        <p>
                          Visual representation of consumer attention across
                          the retail area.
                        </p>
                      </div>
                    </div>

                    <div className="heatmap-image-container">
                      <img
                        src={`http://127.0.0.1:8000/heatmap-image?t=${heatmapVersion}`}
                        alt="Consumer attention heatmap"
                        className="heatmap-image"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Role-Specific Insights */}
            <div className="role-insights">
              {userRole === "Store Manager" && (
                <div className="insight-card">
                  <h3>Store Operations Insights</h3>
                  <p>
                    Monitor product activity and identify shelves that may
                    need better placement or visibility.
                  </p>

                  <ul>
                    <li>
                      Total products tracked:{" "}
                      <strong>{products.length}</strong>
                    </li>

                    <li>
                      Total product views:{" "}
                      <strong>
                        {products.reduce(
                          (sum, product) => sum + product.views,
                          0
                        )}
                      </strong>
                    </li>

                    <li>
                      Total product pickups:{" "}
                      <strong>
                        {products.reduce(
                          (sum, product) => sum + product.pickups,
                          0
                        )}
                      </strong>
                    </li>
                  </ul>
                </div>
              )}

              {userRole === "Retail Analyst" && (
                <div className="insight-card">
                  <h3>Consumer Analytics Insights</h3>
                  <p>
                    Analyze customer attention and engagement patterns
                    across products.
                  </p>

                  <ul>
                    <li>
                      Attention records: <strong>{records.length}</strong>
                    </li>

                    <li>
                      Products analyzed: <strong>{products.length}</strong>
                    </li>

                    <li>
                      Average product score:{" "}
                      <strong>
                        {products.length > 0
                          ? (
                              products.reduce(
                                (sum, product) =>
                                  sum + product.attractiveness_score,
                                0
                              ) / products.length
                            ).toFixed(1)
                          : "0"}
                      </strong>
                    </li>
                  </ul>
                </div>
              )}

              {userRole === "Marketing Manager" && (
                <div className="insight-card">
                  <h3>Marketing Insights</h3>
                  <p>
                    Identify products that require promotional attention
                    and improve customer conversion.
                  </p>

                  <ul>
                    <li>
                      Total purchases:{" "}
                      <strong>
                        {products.reduce(
                          (sum, product) => sum + product.purchases,
                          0
                        )}
                      </strong>
                    </li>

                    <li>
                      Low-score products:{" "}
                      <strong>
                        {
                          products.filter(
                            (product) => product.attractiveness_score < 40
                          ).length
                        }
                      </strong>
                    </li>

                    <li>
                      Products tracked: <strong>{products.length}</strong>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Product Recommendations */}
            <div className="product-section">
              <div className="section-header">
                <h3>Product Attention & Recommendations</h3>
                <p>Real-time product performance insights</p>
              </div>

              {products.length === 0 ? (
                <div className="coming-soon-card">
                  <p>No product data available.</p>
                </div>
              ) : (
                <div className="product-grid">
                  {products.map((product) => (
                    <div className="product-card" key={product.product_id}>
                      {/* Product Header */}
                      <div className="product-card-header">
                        <h4>{product.product_name}</h4>

                        <span
                          className={
                            product.attractiveness_score < 40
                              ? "score-badge low"
                              : "score-badge"
                          }
                        >
                          Score: {product.attractiveness_score}
                        </span>
                      </div>

                      {/* Product Metrics */}
                      <div className="product-metrics">
                        <div>
                          <span>Views</span>
                          <strong>{product.views}</strong>
                        </div>

                        <div>
                          <span>Pickups</span>
                          <strong>{product.pickups}</strong>
                        </div>

                        <div>
                          <span>Purchases</span>
                          <strong>{product.purchases}</strong>
                        </div>
                      </div>

                      {/* Rates */}
                      <div className="product-rates">
                        <div>
                          <span>Pickup Rate</span>
                          <strong>{product.pickup_rate}%</strong>
                        </div>

                        <div>
                          <span>Conversion</span>
                          <strong>{product.conversion_rate}%</strong>
                        </div>

                        <div>
                          <span>Attention</span>
                          <strong>{product.attention_duration}s</strong>
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div className="recommendation-box">
                        <strong>Recommendations</strong>

                        <ul>
                          {product.recommendation &&
                          product.recommendation.length > 0 ? (
                            product.recommendation.map(
                              (recommendation, index) => (
                                <li key={index}>{recommendation}</li>
                              )
                            )
                          ) : (
                            <li>No recommendations available.</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;