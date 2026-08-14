import React from "react";
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

function AttentionChart({ records }) {
  // Merge records by shopper
  const shopperMap = {};

  records.forEach((record) => {
    if (record.total_attention_duration > 0) {
      if (!shopperMap[record.shopper_id]) {
        shopperMap[record.shopper_id] = 0;
      }

      shopperMap[record.shopper_id] +=
        record.total_attention_duration;
    }
  });

  const labels = Object.keys(shopperMap);

  const durations = Object.values(shopperMap);

  const data = {
    labels: labels.map((id) => `Shopper ${id}`),

    datasets: [
      {
        label: "Attention Duration (sec)",
        data: durations,
        backgroundColor: "#1976d2",
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: "top",
      },

      title: {
        display: true,
        text: "Total Attention per Shopper",
        font: {
          size: 18,
        },
      },
    },

    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Seconds",
        },
      },
    },
  };

  return (
    <div style={{ height: "420px" }}>
      <Bar data={data} options={options} />
    </div>
  );
}

export default AttentionChart;