import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AttentionChart() {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/analytics/attention')
      .then(res => {
        const data = res.data.data;
        const labels = data.map(item => item.shelf_id);
        const dwellTimes = data.map(item => item.avg_dwell_time_seconds);

        setChartData({
          labels,
          datasets: [
            {
              label: 'Avg Dwell Time (Seconds)',
              data: dwellTimes,
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
            },
          ],
        });
      })
      .catch(err => console.error("Error fetching attention analytics:", err));
  }, []);

  if (!chartData) return <p style={{ textAlign: 'center', marginTop: '20px' }}>Loading attention analytics...</p>;

  return (
    <div style={{ width: '80%', margin: '0 auto', paddingTop: '20px' }}>
      <h2 style={{ textAlign: 'center' }}>Store Shelf Dwell Time Analytics</h2>
      <Bar data={chartData} />
    </div>
  );
}