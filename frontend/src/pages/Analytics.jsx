import { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import AnalyticsCard from '../components/AnalyticsCard';
import BarChart from '../components/BarChart';
import PieChart from '../components/PieChart';
import LineChart from '../components/LineChart';
import { SkeletonDashboard } from '../components/Skeleton';
import { getSummary, getShelves, getAttentionHistory } from '../services/analyticsService';
import '../styles/Analytics.css';

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [shelves, setShelves] = useState([]);
  const [history, setHistory] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const [summaryRes, shelvesRes, historyRes] = await Promise.all([
          getSummary(),
          getShelves(),
          getAttentionHistory(),
        ]);

        setSummary(summaryRes.data);
        setShelves(shelvesRes.data);
        setHistory(historyRes.data);
        setError('');
      } catch (err) {
        setError('Unable to load analytics. Ensure the backend is running.');
      }
    };

    loadAnalytics();
  }, []);

  if (!summary || !history) {
    return (
      <DashboardLayout>
        <SkeletonDashboard />
      </DashboardLayout>
    );
  }

  const barLabels = shelves.map((item) => item.shelf);
  const barValues = shelves.map((item) => item.count);
  const pieLabels = shelves.map((item) => item.shelf);
  const pieValues = shelves.map((item) => item.count);

  return (
    <DashboardLayout>
      <main className="analytics-page">
        <h1>Consumer Analytics</h1>
        <p className="analytics-subtitle">Live shopper attention and dwell-time activity.</p>
        {error && <p className="analytics-error">{error}</p>}

        <div className="analytics-cards">
          <AnalyticsCard label="Total Visitors" value={summary.total_visitors ?? 0} />
          <AnalyticsCard label="Attention Records" value={summary.attention_records ?? 0} />
          <AnalyticsCard label="Average Dwell Time" value={summary.average_dwell_time ? `${summary.average_dwell_time}s` : '—'} />
          <AnalyticsCard label="Most Viewed Shelf" value={summary.most_viewed_shelf ?? 'N/A'} />
          <AnalyticsCard label="Total Shelves" value={shelves.length} />
        </div>

        <div className="analytics-charts">
          <div className="chart-card">
            <h2>Attention by Shelf</h2>
            <BarChart labels={barLabels} values={barValues} />
          </div>

          <div className="chart-card">
            <h2>Attention Distribution</h2>
            <PieChart labels={pieLabels} values={pieValues} />
          </div>

          <div className="chart-card chart-card-wide">
            <h2>Visitor Trend</h2>
            <LineChart labels={history.labels} values={history.values} />
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
