'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { HourlyTrafficPoint } from '../../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

interface Props {
  data: HourlyTrafficPoint[];
  title?: string;
}

export default function DwellTimeChart({ data, title = 'Hourly Traffic Distribution' }: Props) {
  if (!data || data.length === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 220, color: '#4a6080', fontSize: 14, fontStyle: 'italic',
        background: 'rgba(13,21,38,0.5)', borderRadius: 12,
        border: '1px solid rgba(30,45,74,0.4)',
      }}>
        No traffic data available yet
      </div>
    );
  }

  const labels = data.map(p => `${String(p.hour).padStart(2, '0')}:00`);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Visitors',
        data: data.map(p => p.visitor_count),
        borderColor: 'rgba(99,102,241,1)',
        backgroundColor: 'rgba(99,102,241,0.12)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgba(99,102,241,1)',
        pointBorderColor: 'rgba(13,21,38,1)',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          afterLabel: (ctx: any) => {
            const item = data[ctx.dataIndex];
            return `Avg Dwell: ${item.avg_dwell_seconds.toFixed(1)}s`;
          },
        },
        backgroundColor: 'rgba(5,15,35,0.95)',
        borderColor: 'rgba(99,102,241,0.4)',
        borderWidth: 1,
        titleColor: '#e2e8f0',
        bodyColor: '#8ba3c7',
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(30,45,74,0.3)' },
        ticks: { color: '#4a6080', font: { size: 10 }, maxRotation: 0 },
        border: { color: 'rgba(30,45,74,0.5)' },
      },
      y: {
        grid: { color: 'rgba(30,45,74,0.3)' },
        ticks: { color: '#4a6080', font: { size: 11 } },
        border: { color: 'rgba(30,45,74,0.5)' },
        title: { display: true, text: 'Visitors', color: '#4a6080', font: { size: 11 } },
      },
    },
  };

  return (
    <div>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#8ba3c7', marginBottom: 16, letterSpacing: '0.02em' }}>
        {title}
      </h3>
      <div style={{ height: 200 }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
