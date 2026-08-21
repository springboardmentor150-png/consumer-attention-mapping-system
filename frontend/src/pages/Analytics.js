import React, { useEffect, useState } from "react";

import {
  getSummary,
  getShelfPerformance,
  getProductScores,
  getRecommendations,
  getHeatmapURL,
} from "../services/analyticsService";

import "../App.css";

function Analytics() {

  const [summary, setSummary] = useState(null);
  const [shelves, setShelves] = useState([]);
  const [products, setProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {

    try {
      const data = await getSummary();
      setSummary(data);
    } catch (error) {
      console.error("Summary API Error:", error);
    }

    try {
      const data = await getShelfPerformance();
      setShelves(data);
    } catch (error) {
      console.error("Shelf API Error:", error);
    }

    try {
      const data = await getProductScores();
      setProducts(data);
    } catch (error) {
      console.error("Product API Error:", error);
    }

    try {
      const data = await getRecommendations();
      setRecommendations(data);
    } catch (error) {
      console.error("Recommendation API Error:", error);
    }
  };

  return (
    <div className="dashboard">

      {/* ===================================== */}
      {/* HEADER */}
      {/* ===================================== */}

      <header className="dashboard-header">

        <div>
          <p className="dashboard-label">
            AI RETAIL INTELLIGENCE
          </p>

          <h1>
            Consumer Attention
            <span> Analytics</span>
          </h1>

          <p className="dashboard-subtitle">
            Real-time shopper behavior and store performance insights
          </p>
        </div>

        <div className="live-indicator">
          <span></span>
          Analytics Connected
        </div>

      </header>


      {/* ===================================== */}
      {/* SUMMARY CARDS */}
      {/* ===================================== */}

      <section className="summary-grid">

        <div className="summary-card">

          <div className="card-icon blue">
            👥
          </div>

          <div>
            <p>Total Visitors</p>

            <h2>
              {summary
                ? summary.total_visitors
                : "--"}
            </h2>

            <span>
              Tracked sessions
            </span>
          </div>

        </div>


        <div className="summary-card">

          <div className="card-icon purple">
            ⏱
          </div>

          <div>
            <p>Average Dwell</p>

            <h2>
              {summary
                ? `${summary.average_dwell_time}s`
                : "--"}
            </h2>

            <span>
              Shopper attention
            </span>
          </div>

        </div>


        <div className="summary-card">

          <div className="card-icon orange">
            🏆
          </div>

          <div>
            <p>Top Shelf</p>

            <h2>
              {summary
                ? `Shelf ${summary.top_shelf}`
                : "--"}
            </h2>

            <span>
              Highest traffic
            </span>
          </div>

        </div>


        <div className="summary-card">

          <div className="card-icon green">
            👤
          </div>

          <div>
            <p>Current People</p>

            <h2>
              {summary
                ? summary.current_people
                : "--"}
            </h2>

            <span>
              Currently detected
            </span>
          </div>

        </div>

      </section>


      {/* ===================================== */}
      {/* SHELF PERFORMANCE */}
      {/* ===================================== */}

      <section className="dashboard-section">

        <div className="section-heading">

          <div>
            <p className="section-label">
              STORE ANALYTICS
            </p>

            <h2>
              Shelf Performance
            </h2>
          </div>

          <span className="section-info">
            Shopper traffic by shelf
          </span>

        </div>


        <div className="shelf-grid">

          {shelves.map((shelf) => (

            <div
              className="shelf-card"
              key={shelf.shelf_id}
            >

              <div className="shelf-top">

                <div>
                  <span className="shelf-number">
                    0{shelf.shelf_id}
                  </span>

                  <h3>
                    Shelf {shelf.shelf_id}
                  </h3>
                </div>

                <span className="traffic-value">
                  {shelf.percentage}%
                </span>

              </div>


              <div className="traffic-bar">

                <div
                  className="traffic-fill"
                  style={{
                    width: `${shelf.percentage}%`
                  }}
                ></div>

              </div>


              <div className="shelf-stats">

                <div>
                  <span>Visitors</span>
                  <strong>
                    {shelf.visitors}
                  </strong>
                </div>

                <div>
                  <span>Avg. Dwell</span>
                  <strong>
                    {shelf.average_dwell_time}s
                  </strong>
                </div>

              </div>

            </div>

          ))}

        </div>

      </section>


      {/* ===================================== */}
      {/* HEATMAP */}
      {/* ===================================== */}

      <section className="dashboard-section">

        <div className="section-heading">

          <div>
            <p className="section-label">
              SPATIAL INTELLIGENCE
            </p>

            <h2>
              Store Attention Heatmap
            </h2>
          </div>

          <span className="heatmap-legend">
            🔵 Low &nbsp; 🟡 Medium &nbsp; 🔴 High
          </span>

        </div>


        <div className="heatmap-container">

          <img
            src={getHeatmapURL()}
            alt="Store Attention Heatmap"
          />

        </div>

      </section>


      {/* ===================================== */}
      {/* PRODUCT ATTRACTIVENESS */}
      {/* ===================================== */}

      <section className="dashboard-section">

        <div className="section-heading">

          <div>
            <p className="section-label">
              PRODUCT INTELLIGENCE
            </p>

            <h2>
              Product Attractiveness
            </h2>
          </div>

          <span className="section-info">
            Score out of 100
          </span>

        </div>


        <div className="product-list">

          {products.map((product) => (

            <div
              className="product-row"
              key={product.product_id}
            >

              <div className="product-info">

                <div className="product-number">
                  {product.product_id}
                </div>

                <div>
                  <h3>
                    {product.product_name}
                  </h3>

                  <p>
                    Attention {product.attention_duration}s
                    &nbsp; • &nbsp;
                    Pickup {product.pickup_rate}%
                    &nbsp; • &nbsp;
                    Conversion {product.conversion_rate}%
                  </p>
                </div>

              </div>


              <div className="score-section">

                <div className="score-bar">

                  <div
                    className="score-fill"
                    style={{
                      width: `${Math.min(
                        product.attractiveness_score,
                        100
                      )}%`
                    }}
                  ></div>

                </div>

                <strong>
                  {product.attractiveness_score}
                </strong>

              </div>

            </div>

          ))}

        </div>

      </section>


      {/* ===================================== */}
      {/* RECOMMENDATIONS */}
      {/* ===================================== */}

      <section className="dashboard-section">

        <div className="section-heading">

          <div>
            <p className="section-label">
              AI DECISION SUPPORT
            </p>

            <h2>
              Optimization Recommendations
            </h2>
          </div>

        </div>


        <div className="recommendation-grid">

          {recommendations.map((item) => (

            <div
              className={`recommendation-card ${item.priority.toLowerCase()}`}
              key={item.product_id}
            >

              <div className="recommendation-header">

                <div>

                  <span className="recommendation-product">
                    {item.product_name}
                  </span>

                  <h3>
                    {item.priority} Priority
                  </h3>

                </div>

                <span className="recommendation-score">
                  {item.attractiveness_score}
                </span>

              </div>


              <p>
                {item.recommendation}
              </p>

            </div>

          ))}

        </div>

      </section>


      {/* ===================================== */}
      {/* FOOTER */}
      {/* ===================================== */}

      <footer className="dashboard-footer">

        <span>
          Consumer Attention Mapping System
        </span>

        <span>
          AI-powered retail analytics
        </span>

      </footer>

    </div>
  );
}

export default Analytics;