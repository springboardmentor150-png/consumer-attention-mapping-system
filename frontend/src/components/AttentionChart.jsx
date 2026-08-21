import { useEffect, useState } from "react";
import api from "../services/api";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function AttentionChart() {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get("/analytics/attention");

      const analytics = response.data.data;

      const labels = analytics.map((item) => item.shelf);

      const durations = analytics.map((item) => item.duration);

      setChartData({
        labels,
        datasets: [
          {
            label: "Viewing Duration (seconds)",
            data: durations,
          },
        ],
      });
    } catch (error) {
      console.error("Analytics Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <h3>Loading Analytics...</h3>;
  }

  return (
    <div style={{ width: "90%", margin: "30px auto" }}>
      <h2>Today's Shelf Attention Report</h2>

      <Bar
        data={chartData}
        options={{
          responsive: true,
          plugins: {
            legend: {
              position: "top",
            },
          },
        }}
      />
    </div>
  );
}

export default AttentionChart;