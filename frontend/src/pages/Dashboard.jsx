import DashboardLayout from '../layouts/DashboardLayout';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const cards = [
    { icon: '🏪', label: 'Stores', value: '5' },
    { icon: '📦', label: 'Shelves', value: '28' },
    { icon: '📷', label: 'Cameras', value: '18' },
    { icon: '👥', label: 'Users', value: '12' },
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
