'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { ShelfAttentionSummary } from '../../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Props {
  data: ShelfAttentionSummary[];
  title?: string;
}

const COLORS = [
  'rgba(99,102,241,0.85)',
  'rgba(139,92,246,0.85)',
  'rgba(59,130,246,0.85)',
  'rgba(16,185,129,0.85)',
  'rgba(245,158,11,0.85)',
  'rgba(239,68,68,0.85)',
  'rgba(236,72,153,0.85)',
  'rgba(14,165,233,0.85)',
];

export default function AttentionBarChart({ data, title = 'Shelf Attention Rankings' }: Props) {
  if (!data || data.length === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 260, color: '#4a6080', fontSize: 14, fontStyle: 'italic',
        background: 'rgba(13,21,38,0.5)', borderRadius: 12,
        border: '1px solid rgba(30,45,74,0.4)',
      }}>
        No attention data available yet — run tracking to collect data
      </div>
    );
  }

  const chartData = {
    labels: data.map(s => s.shelf_name),
    datasets: [
      {
        label: 'Total Attention (seconds)',
        data: data.map(s => s.total_attention_seconds),
        backgroundColor: data.map((_, i) => COLORS[i % COLORS.length]),
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const item = data[ctx.dataIndex];
            const mins = Math.floor(item.total_attention_seconds / 60);
            const secs = Math.round(item.total_attention_seconds % 60);
            return [
              ` Total: ${mins}m ${secs}s`,
              ` Unique Viewers: ${item.unique_viewers}`,
              ` Avg Dwell: ${item.avg_dwell_seconds.toFixed(1)}s`,
            ];
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
        grid: { color: 'rgba(30,45,74,0.4)' },
        ticks: { color: '#4a6080', font: { size: 11 } },
        border: { color: 'rgba(30,45,74,0.5)' },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#8ba3c7', font: { size: 11 } },
        border: { color: 'rgba(30,45,74,0.5)' },
      },
    },
  };

  return (
    <div>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#8ba3c7', marginBottom: 16, letterSpacing: '0.02em' }}>
        {title}
      </h3>
      <div style={{ height: Math.max(200, data.length * 44) }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
