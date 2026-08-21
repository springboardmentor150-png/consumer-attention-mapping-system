import { Bar } from 'react-chartjs-2';
import { useEffect, useState } from 'react';
import { getShelfRanking } from '../services/analyticsService';

export default function ShelfRanking() {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    getShelfRanking().then((res) => {
      setChartData({
        labels: res.data.map((item) => `Shelf ${item.shelf}`),
        datasets: [
          {
            label: 'Attention',
            data: res.data.map((item) => item.attention),
            backgroundColor: '#2563eb',
          },
        ],
      });
    });
  }, []);

  return (
    <section className="panel-card">
      <div className="panel-header">
        <h2>Shelf Ranking</h2>
      </div>
      <div className="chart-wrapper">
        <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
      </div>
    </section>
  );
}
