import { Line } from 'react-chartjs-2';
import { useEffect, useState } from 'react';
import { getAttentionHistory } from '../services/analyticsService';

export default function AttentionChart() {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    getAttentionHistory().then((res) => {
      setChartData({
        labels: res.data.labels,
        datasets: [
          {
            label: 'Attention',
            data: res.data.values,
            borderColor: '#14b8a6',
            backgroundColor: 'rgba(20, 184, 166, 0.2)',
            tension: 0.3,
          },
        ],
      });
    });
  }, []);

  return (
    <section className="panel-card">
      <div className="panel-header">
        <h2>Attention Trend</h2>
      </div>
      <div className="chart-wrapper">
        <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
      </div>
    </section>
  );
}
