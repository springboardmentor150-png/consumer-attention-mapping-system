import { useEffect, useState } from 'react';
import AnalyticsCard from '../components/AnalyticsCard';
import BarChart from '../components/BarChart';
import LineChart from '../components/LineChart';
import PieChart from '../components/PieChart';
import DashboardLayout from '../layouts/DashboardLayout';
import { getShelves, getSummary } from '../services/analyticsService';
import '../styles/Analytics.css';

const emptySummary = { total_visitors: 0, attention_records: 0, average_dwell_time: 0, most_viewed_shelf: null };

export default function Analytics() {
  const [summary, setSummary] = useState(emptySummary);
  const [shelves, setShelves] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getSummary(), getShelves()])
      .then(([summaryResponse, shelvesResponse]) => {
        setSummary(summaryResponse.data);
        setShelves(shelvesResponse.data);
      })
      .catch(() => setError('Unable to load live analytics. Ensure the FastAPI backend is running.'));
  }, []);

  const labels = shelves.map(({ shelf }) => shelf);
  const values = shelves.map(({ count }) => count);

  return (
    <DashboardLayout>
      <main className="analytics-page">
        <h1>Consumer Analytics</h1>
        <p className="analytics-subtitle">Live shopper attention and dwell-time activity.</p>
        {error && <p className="analytics-error">{error}</p>}
        <section className="analytics-cards">
          <AnalyticsCard label="Total Visitors" value={summary.total_visitors} />
          <AnalyticsCard label="Attention Records" value={summary.attention_records} />
          <AnalyticsCard label="Average Dwell Time" value={`${summary.average_dwell_time}s`} />
          <AnalyticsCard label="Most Viewed Shelf" value={summary.most_viewed_shelf || 'No data'} />
        </section>
        <section className="analytics-charts">
          <article className="chart-card chart-card-wide"><h2>Shelf Attention</h2><div><BarChart labels={labels} values={values} /></div></article>
          <article className="chart-card"><h2>Attention Share</h2><div><PieChart labels={labels} values={values} /></div></article>
          <article className="chart-card"><h2>Attention Trend</h2><div><LineChart labels={labels} values={values} /></div></article>
        </section>
      </main>
    </DashboardLayout>
  );
}
