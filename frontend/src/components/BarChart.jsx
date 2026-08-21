import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function BarChart({ labels, values }) {
  return <Bar data={{ labels, datasets: [{ label: 'Attention events', data: values, backgroundColor: '#2563eb', borderRadius: 6 }] }} options={{ responsive: true, maintainAspectRatio: false }} />;
}
