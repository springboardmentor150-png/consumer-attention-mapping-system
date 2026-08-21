import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { getSummary } from "../api/reportApi";
import ExportButtons from "../components/Reports/ExportButtons";
import ReportFilters from "../components/Reports/ReportFilters";
import { SkeletonDashboard } from "../components/Skeleton";
import "../styles/Analytics.css";

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSummary()
      .then((res) => {
        setSummary(res.data);
      })
      .catch((err) => {
        console.error("Report summary error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <SkeletonDashboard />
      </DashboardLayout>
    );
  }

  const reportData = summary || {};

  return (
    <DashboardLayout>
      <main className="analytics-page" style={{ padding: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "8px" }}>Analytics Reports</h1>
        <p style={{ color: "#64748b", marginBottom: "20px" }}>Export and filter store attention and customer activity reports.</p>

        <ReportFilters />
        <ExportButtons />

        <div className="analytics-cards" style={{ marginTop: "24px" }}>
          <div className="analytics-card">
            <h3>Total Customers</h3>
            <h2>{reportData.total_customers ?? 0}</h2>
          </div>
          <div className="analytics-card">
            <h3>Average Dwell</h3>
            <h2>{reportData.average_dwell ? `${reportData.average_dwell}s` : "0s"}</h2>
          </div>
          <div className="analytics-card">
            <h3>Attention Score</h3>
            <h2>{reportData.attention_score ?? "0%"}</h2>
          </div>
          <div className="analytics-card">
            <h3>Most Viewed Shelf</h3>
            <h2>{reportData.most_viewed_shelf ?? "Shelf A"}</h2>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
