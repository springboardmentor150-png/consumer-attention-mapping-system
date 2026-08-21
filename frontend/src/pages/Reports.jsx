import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/reports.css";

function Reports() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  const canViewProductReports =
    role === "Admin" ||
    role === "Retail Analyst" ||
    role === "Marketing Manager";

  const [attentionReport, setAttentionReport] = useState(null);
  const [productReport, setProductReport] = useState(null);
  const [shelfReport, setShelfReport] = useState(null);
  const [conversionReport, setConversionReport] = useState(null);
  const [marketingReport, setMarketingReport] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");

      const attentionResponse = await api.get("/reports/attention");

      const shelfResponse = await api.get("/reports/shelves");

      setAttentionReport(attentionResponse.data);
      setShelfReport(shelfResponse.data);

      if (canViewProductReports) {
        const productResponse = await api.get("/reports/products");

        const conversionResponse = await api.get("/reports/conversion");

        const marketingResponse = await api.get("/reports/marketing");

        setProductReport(productResponse.data);
        setConversionReport(conversionResponse.data);
        setMarketingReport(marketingResponse.data);
      }
    } catch (err) {
      console.log(err);

      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        navigate("/");
        return;
      }

      if (err.response?.status === 403) {
        setError("You do not have permission to view this report.");
        return;
      }

      setError("Unable to load reports.");
    } finally {
      setLoading(false);
    }
  };

  const exportProductReport = async () => {
    try {
      const response = await api.get("/reports/export/products", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "text/csv" }),
      );

      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", "product_engagement_report.csv");

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.log(error);
      setError("Unable to export product report.");
    }
  };

  if (loading) {
    return (
      <div className="reports-page">
        <h1>📊 Reports</h1>
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="reports-page">
      {/* Header */}

      <div className="reports-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ← Dashboard
        </button>

        <div>
          <h1>📊 Retail Reports</h1>
          <p>Consumer attention and retail intelligence reports</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Consumer Attention Report */}

      {attentionReport && (
        <div className="report-section">
          <h2>👥 Consumer Attention Report</h2>

          <div className="report-summary-grid">
            <div className="report-card">
              <h3>Total Shoppers</h3>
              <p>{attentionReport.total_shoppers}</p>
            </div>

            <div className="report-card">
              <h3>Average Dwell</h3>
              <p>{attentionReport.average_dwell} sec</p>
            </div>

            <div className="report-card">
              <h3>Zone A Attention</h3>
              <p>{attentionReport.attention_by_zone["Zone A"]} sec</p>
            </div>

            <div className="report-card">
              <h3>Zone B Attention</h3>
              <p>{attentionReport.attention_by_zone["Zone B"]} sec</p>
            </div>

            <div className="report-card">
              <h3>Zone C Attention</h3>
              <p>{attentionReport.attention_by_zone["Zone C"]} sec</p>
            </div>
          </div>
        </div>
      )}

      {/* Shelf Performance */}

      {shelfReport && (
        <div className="report-section">
          <h2>📦 Shelf Performance Report</h2>

          <div className="zone-grid">
            <div className="zone-card">
              <h3>Zone A</h3>
              <p>{shelfReport.zones["Zone A"]} sec</p>
            </div>

            <div className="zone-card">
              <h3>Zone B</h3>
              <p>{shelfReport.zones["Zone B"]} sec</p>
            </div>

            <div className="zone-card">
              <h3>Zone C</h3>
              <p>{shelfReport.zones["Zone C"]} sec</p>
            </div>
          </div>
        </div>
      )}

      {/* Product Engagement */}

      {canViewProductReports && productReport && (
        <div className="report-section">
          <div className="report-title-row">
            <h2>🏆 Product Engagement Report</h2>

            <button className="export-btn" onClick={exportProductReport}>
              📥 Export CSV
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Attractiveness</th>
                  <th>Attention</th>
                  <th>Interaction</th>
                  <th>Pickup</th>
                  <th>Conversion</th>
                  <th>Repeat Engagement</th>
                </tr>
              </thead>

              <tbody>
                {productReport.products.map((product, index) => (
                  <tr key={index}>
                    <td>{product.product}</td>

                    <td>{product.attractiveness_score}</td>

                    <td>{product.attention_duration}</td>

                    <td>{product.interaction_frequency}</td>

                    <td>{product.pickup_rate}</td>

                    <td>{product.conversion_rate}%</td>

                    <td>{product.repeat_engagement}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conversion Report */}

      {canViewProductReports && conversionReport && (
        <div className="report-section">
          <h2>📈 Conversion Report</h2>

          <div className="report-card large-card">
            <h3>Average Conversion Rate</h3>

            <p>{conversionReport.average_conversion_rate}%</p>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Conversion Rate</th>
                </tr>
              </thead>

              <tbody>
                {conversionReport.products.map((product, index) => (
                  <tr key={index}>
                    <td>{product.product}</td>

                    <td>{product.conversion_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Marketing Effectiveness */}

      {canViewProductReports && marketingReport && (
        <div className="report-section">
          <h2>📣 Marketing Effectiveness Report</h2>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Attractiveness</th>
                  <th>Attention</th>
                  <th>Conversion</th>
                  <th>Pickup</th>
                </tr>
              </thead>

              <tbody>
                {marketingReport.products.map((product, index) => (
                  <tr key={index}>
                    <td>{product.product}</td>

                    <td>{product.attractiveness_score}</td>

                    <td>{product.attention_duration}</td>

                    <td>{product.conversion_rate}%</td>

                    <td>{product.pickup_rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;
