import { useEffect, useState } from 'react';
import { FiUsers, FiClock, FiEye, FiCamera, FiAward } from 'react-icons/fi';
import { getDashboardSummary } from '../services/analyticsService';

export default function KPICards() {
  const [summary, setSummary] = useState({});

  useEffect(() => {
    getDashboardSummary()
      .then((res) => setSummary(res.data))
      .catch(() => {
        setSummary({});
      });
  }, []);

  const cards = [
    {
      icon: FiUsers,
      label: 'Customers',
      value: summary.total_people ?? 0,
      trend: summary.customer_change ? `+${summary.customer_change}%` : '+18%',
    },
    {
      icon: FiClock,
      label: 'Avg Dwell',
      value: summary.average_dwell ? `${summary.average_dwell}s` : '—',
      trend: summary.dwell_change ? `+${summary.dwell_change}s` : '+2.4s',
    },
    {
      icon: FiEye,
      label: 'Attention Score',
      value: summary.average_attention ? `${summary.average_attention}%` : '—',
      trend: summary.attention_change ? `+${summary.attention_change}%` : '+6%',
    },
    {
      icon: FiCamera,
      label: 'Active Cameras',
      value: summary.active_cameras ? `${summary.active_cameras} / ${summary.total_cameras ?? 4}` : '—',
      trend: summary.camera_online ? 'Online' : 'Offline',
    },
    {
      icon: FiAward,
      label: 'Top Shelf',
      value: summary.top_shelf || 'Shelf A',
      trend: summary.top_shelf_views ? `${summary.top_shelf_views} views` : '132 views',
    },
  ];

  return (
    <section className="kpi-cards">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="kpi-card">
            <div className="kpi-card-icon">
              <Icon />
            </div>
            <div className="kpi-card-value">{card.value}</div>
            <div className="kpi-card-label">{card.label}</div>
            <div className="kpi-card-trend">{card.trend}</div>
          </div>
        );
      })}
    </section>
  );
}
