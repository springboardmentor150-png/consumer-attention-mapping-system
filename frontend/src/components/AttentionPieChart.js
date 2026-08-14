import React from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Pie } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

function AttentionPieChart({ records }) {
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
        data: durations,

        backgroundColor: [
          "#1976d2",
          "#43a047",
          "#fb8c00",
          "#8e24aa",
          "#e53935",
          "#00acc1",
          "#3949ab",
          "#7cb342",
          "#f4511e",
          "#5e35b1",
        ],

        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,

    plugins: {
      title: {
        display: true,
        text: "Attention Distribution",
        font: {
          size: 18,
        },
      },

      legend: {
        position: "bottom",

        labels: {
          boxWidth: 12,
          font: {
            size: 11,
          },
        },
      },
    },
  };

  return <Pie data={data} options={options} />;
}

export default AttentionPieChart;