import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import KPICards from '../components/KPICards';
import LiveCamera from '../components/LiveCamera';
import ShelfRanking from '../components/ShelfRanking';
import Heatmap from '../components/Heatmap';
import CustomerPath from '../components/CustomerPath';
import AttentionChart from '../components/AttentionChart';
import AnalyticsTable from '../components/AnalyticsTable';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Admin';

  return (
    <DashboardLayout>
      <div className="dashboard-grid">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-subtitle">Consumer Attention Mapping System</p>
            <h1 className="dashboard-title">Retail AI Dashboard</h1>
          </div>
          <div className="dashboard-header-actions">
            <div className="dashboard-user-pill">👤 {roleLabel}</div>
            <button type="button" className="dashboard-icon-button">🔔</button>
            <button type="button" className="dashboard-icon-button">⚙</button>
          </div>
        </header>

        <div className="dashboard-toolbar">
          <div className="toolbar-group">
            <label htmlFor="store-select">Store</label>
            <select id="store-select" className="toolbar-select">
              <option>All Stores</option>
              <option>Store A</option>
              <option>Store B</option>
            </select>
          </div>
          <div className="toolbar-group">
            <label htmlFor="camera-select">Camera</label>
            <select id="camera-select" className="toolbar-select">
              <option>All Cameras</option>
              <option>Camera 1</option>
            </select>
          </div>
          <div className="toolbar-group">
            <label htmlFor="date-select">Date</label>
            <select id="date-select" className="toolbar-select">
              <option>Today</option>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>
          <div className="toolbar-actions">
            <button type="button" className="toolbar-button">⬇ Export</button>
            <button type="button" className="toolbar-button toolbar-button-secondary">🔄 Refresh</button>
          </div>
        </div>

        <KPICards />

        <section className="live-camera-section">
          <LiveCamera />
        </section>

        <div className="dashboard-panel-grid">
          <Heatmap />
          <ShelfRanking />
        </div>

        <div className="dashboard-panel-grid dashboard-chart-grid">
          <AttentionChart />
          <CustomerPath />
        </div>

        <AnalyticsTable />
      </div>
    </DashboardLayout>
  );
}
