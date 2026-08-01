import { CategoryScale, Chart as ChartJS, Legend, LineElement, LinearScale, PointElement, Tooltip } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function LineChart({ labels, values }) {
  return <Line data={{ labels, datasets: [{ label: 'Shelf attention', data: values, borderColor: '#14b8a6', backgroundColor: '#14b8a6', tension: 0.3 }] }} options={{ responsive: true, maintainAspectRatio: false }} />;
}
