import { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { getSummary } from '../services/analyticsService';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    getSummary().then((response) => setSummary(response.data)).catch(() => setSummary({}));
  }, []);

  const cards = [
    { icon: 'Visitors', label: 'Total Visitors', value: summary?.total_visitors ?? '—' },
    { icon: 'Dwell', label: 'Average Dwell', value: summary ? `${summary.average_dwell_time}s` : '—' },
    { icon: 'Shelf', label: 'Most Viewed Shelf', value: summary?.most_viewed_shelf || '—' },
    { icon: 'Views', label: 'Attention Records', value: summary?.attention_records ?? '—' },
  ];

  return (
    <DashboardLayout>
      <div className="dashboard-content">
        <h1 className="dashboard-title">Dashboard</h1>
        <div className="dashboard-cards-grid">
          {cards.map((card) => (
            <div key={card.label} className="dashboard-card">
              <div className="card-icon">{card.icon}</div>
              <h3 className="card-label">{card.label}</h3>
              <p className="card-value">{card.value}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
