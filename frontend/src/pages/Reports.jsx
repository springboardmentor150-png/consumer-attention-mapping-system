import React, { useEffect, useState } from "react";
import { Download } from "react-bootstrap-icons";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import "../styles/dashboard.css";
import "../styles/reports.css";

const REPORTS = [
  {
    id: 1,
    name: "Weekly Attention Summary",
    store: "Store #1 - MG Road",
    date: "22 Jul 2026",
    status: "ready"
  },
  {
    id: 2,
    name: "Camera Uptime Report",
    store: "Store #3 - FC Road",
    date: "21 Jul 2026",
    status: "ready"
  },
  {
    id: 3,
    name: "Shelf Engagement Report",
    store: "Store #2 - Kothrud",
    date: "20 Jul 2026",
    status: "ready"
  },
  {
    id: 4,
    name: "Monthly Consumer Insights",
    store: "All Stores",
    date: "18 Jul 2026",
    status: "ready"
  }
];

const CSV_REPORT_URL =
  "http://127.0.0.1:8000/api/reports/products/csv";

const PDF_REPORT_URL =
  "http://127.0.0.1:8000/api/reports/products/pdf";

const Reports = () => {
  const role = localStorage.getItem("role") || "User";

const canExportCSV =
  role === "Admin" ||
  role === "Store Manager" ||
  role === "Retail Analyst";

const canExportPDF =
  role === "Admin" ||
  role === "Store Manager" ||
  role === "Marketing Manager";
  const [range, setRange] = useState("7d");
  const [store, setStore] = useState("all");
  const [summary, setSummary] = useState({
  total_records: 0,
  average_attention: 0,
  maximum_attention: 0
});
const [topShopper, setTopShopper] = useState(null);
const [topProduct, setTopProduct] = useState(null);
const [summaryLoading, setSummaryLoading] = useState(true);

useEffect(() => {
  const fetchReportInsights = async () => {
    try {
      const [
        summaryResponse,
        shopperResponse,
        productResponse
      ] = await Promise.all([
        fetch("http://127.0.0.1:8000/dashboard-summary"),
        fetch("http://127.0.0.1:8000/top-shopper"),
        fetch("http://127.0.0.1:8000/api/reports/top-product")
      ]);

      if (!summaryResponse.ok) {
        throw new Error("Failed to load report summary");
      }

      if (!shopperResponse.ok) {
        throw new Error("Failed to load top shopper");
      }

      if (!productResponse.ok) {
        throw new Error("Failed to load top product");
      }

      const summaryData = await summaryResponse.json();
      const shopperData = await shopperResponse.json();
      const productData = await productResponse.json();

      setSummary(summaryData);
      setTopShopper(shopperData);
      setTopProduct(productData);

    } catch (error) {
      console.error(
        "Report insights error:",
        error
      );
    } finally {
      setSummaryLoading(false);
    }
  };

  fetchReportInsights();
}, []);
  const getRangeLabel = () => {
  switch (range) {
    case "30d":
      return "Last 30 days";

    case "90d":
      return "Last 90 days";

    default:
      return "Last 7 days";
  }
};

const getStoreLabel = () => {
  switch (store) {
    case "1":
      return "Store #1 - MG Road";

    case "2":
      return "Store #2 - Kothrud";

    case "3":
      return "Store #3 - FC Road";

    default:
      return "All Stores";
  }
};

  // Export CSV
  const handleExportAll = async () => {
    const url =
      `${CSV_REPORT_URL}?range=${range}&store=${store}`;

  await downloadAuthenticatedFile(url);
};
  // Export PDF
  const handleExportPDF = async () => {
    const url =
      `${PDF_REPORT_URL}?range=${range}&store=${store}`;

  await downloadAuthenticatedFile(url);
};
const downloadAuthenticatedFile = async (url) => {
  try {
    const token = localStorage.getItem("access_token");

    if (!token) {
      alert("Please login again.");
      return;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        alert("Your session has expired. Please login again.");
      } else if (response.status === 403) {
        alert("You do not have permission to download this report.");
      } else {
        alert("Failed to download report.");
      }

      return;
    }

    const blob = await response.blob();

    const downloadUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = downloadUrl;

    const contentDisposition =
      response.headers.get("content-disposition");

    let filename = "report";

    if (contentDisposition) {
      const match = contentDisposition.match(
        /filename="?([^"]+)"?/i
      );

      if (match && match[1]) {
        filename = match[1];
      }
    }

    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(downloadUrl);

  } catch (error) {
    console.error("Report download error:", error);
    alert("Unable to download the report.");
  }
};

  // Download individual report
 const handleDownloadReport = async (report) => {
  if (report.status !== "ready") {
    return;
  }

  let url;

  switch (report.id) {
    case 1:
      url =
        `http://127.0.0.1:8000/api/reports/attention/csv?range=${range}&store=${store}`;
      break;

    case 2:
      url =
        `http://127.0.0.1:8000/api/reports/camera-uptime/csv?range=${range}&store=${store}`;
      break;

    case 3:
      url =
        `http://127.0.0.1:8000/api/reports/shelf-engagement/csv?range=${range}&store=${store}`;
      break;

    case 4:
      url =
        `http://127.0.0.1:8000/api/reports/consumer-insights/csv?range=${range}&store=${store}`;
      break;

    default:
      url =
        `${CSV_REPORT_URL}?range=${range}&store=${store}`;
      break;
  }

  await downloadAuthenticatedFile(url);
};
  return (
    <div className="dashboard-container">

      <Sidebar />

      <div className="dashboard-content">

        <Navbar />

        {/* Page Header */}

        <div className="page-header">
          <h2>Reports</h2>

          <p>
            Generate and download analytics reports for your stores.
          </p>
          <span className="reports-role-badge">
            Role: {role}
          </span>
        </div>

        {/* Report Toolbar */}

        <div className="reports-toolbar">

          <div className="reports-filters">

            {/* Date Range */}

            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
            >
              <option value="7d">
                Last 7 days
              </option>

              <option value="30d">
                Last 30 days
              </option>

              <option value="90d">
                Last 90 days
              </option>
            </select>

            {/* Store */}

            <select
              value={store}
              onChange={(e) => setStore(e.target.value)}
            >
              <option value="all">
                All Stores
              </option>

              <option value="1">
                Store #1 - MG Road
              </option>

              <option value="2">
                Store #2 - Kothrud
              </option>

              <option value="3">
                Store #3 - FC Road
              </option>
            </select>

          </div>

          {/* Export Buttons */}

          <div className="reports-export-buttons">

            {canExportCSV && (
              <button
                type="button"
                className="btn-export"
                onClick={handleExportAll}
          >
                <Download style={{ marginRight: 8 }} />
                Export CSV
              </button>
)}

            {canExportPDF && (
              <button
                type="button"
                className="btn-export"
                onClick={handleExportPDF}
  >
                <Download style={{ marginRight: 8 }} />
                Export PDF
              </button>
)}

          </div>

        </div>
        {/* Report Configuration */}
{/* Report Summary */}

<div className="report-summary-grid">

  <div className="report-summary-card">
    <span className="report-summary-label">
      Attention Records
    </span>

    <strong>
      {summaryLoading
        ? "..."
        : summary.total_records}
    </strong>

    <p>
      Total recorded interactions
    </p>
  </div>
  {/* Report Insights */}

<div className="report-insights-grid">

  <div className="report-insight-card">

    <span className="report-summary-label">
      Top Shopper
    </span>

    <strong>
      {topShopper?.shopper_id
        ? `Shopper #${topShopper.shopper_id}`
        : "..."}
    </strong>

    <p>
      {topShopper?.attention_duration
        ? `${Number(
            topShopper.attention_duration
          ).toFixed(2)} sec attention`
        : "No shopper data available"}
    </p>

  </div>

  <div className="report-insight-card">

    <span className="report-summary-label">
      Top Product
    </span>

    <strong>
      {topProduct?.product_name || "..."}
    </strong>

    <p>
      {topProduct
        ? `Attractiveness Score: ${topProduct.attractiveness_score}`
        : "No product data available"}
    </p>

  </div>

</div>

  <div className="report-summary-card">
    <span className="report-summary-label">
      Average Attention
    </span>

    <strong>
      {summaryLoading
        ? "..."
        : `${Number(
            summary.average_attention || 0
          ).toFixed(2)} sec`}
    </strong>

    <p>
      Average consumer attention
    </p>
  </div>

  <div className="report-summary-card">
    <span className="report-summary-label">
      Maximum Attention
    </span>

    <strong>
      {summaryLoading
        ? "..."
        : `${Number(
            summary.maximum_attention || 0
          ).toFixed(2)} sec`}
    </strong>

    <p>
      Highest recorded attention
    </p>
  </div>

</div>


  <div className="report-config-card">

  <div className="report-config-item">
    <span className="report-config-label">
      Report Period
    </span>

    <strong>
      {getRangeLabel()}
    </strong>
  </div>

  <div className="report-config-divider"></div>

  <div className="report-config-item">
    <span className="report-config-label">
      Selected Store
    </span>

    <strong>
      {getStoreLabel()}
    </strong>
  </div>

  <div className="report-config-divider"></div>

  <div className="report-config-item">
    <span className="report-config-label">
      Ready Reports
    </span>

    <strong>
      {
        REPORTS.filter(
          (report) => report.status === "ready"
        ).length
      }
    </strong>
  </div>

  <div className="report-config-divider"></div>

  <div className="report-config-item">
    <span className="report-config-label">
      Processing
    </span>

    <strong>
      {
        REPORTS.filter(
          (report) => report.status === "processing"
        ).length
      }
    </strong>
  </div>

</div>

        {/* Reports Table */}

        <div className="reports-card">

          <table className="reports-table">

            <thead>

              <tr>
                <th>Report</th>
                <th>Store</th>
                <th>Generated</th>
                <th>Status</th>
                <th>Action</th>
              </tr>

            </thead>

            <tbody>

              {REPORTS.map((report) => (

                <tr key={report.id}>

                  <td>
                    {report.name}
                  </td>

                  <td>
                    {report.store}
                  </td>

                  <td>
                    {report.date}
                  </td>

                  <td>

                    <span
                      className={`report-status ${report.status}`}
                    >
                      {report.status === "ready"
                        ? "Ready"
                        : "Processing"}
                    </span>

                  </td>

                  <td>

                    {report.status === "ready" ? (

                      <button
                        type="button"
                        className="report-link"
                        onClick={() =>
                          handleDownloadReport(report)
                        }
                      >
                        Download
                      </button>

                    ) : (

                      <span className="report-processing">
                        Processing...
                      </span>

                    )}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
};

export default Reports;