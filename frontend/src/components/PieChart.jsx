import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function PieChart({ labels, values }) {
  return <Pie data={{ labels, datasets: [{ data: values, backgroundColor: ['#2563eb', '#14b8a6', '#f59e0b'], borderWidth: 0 }] }} options={{ responsive: true, maintainAspectRatio: false }} />;
}
