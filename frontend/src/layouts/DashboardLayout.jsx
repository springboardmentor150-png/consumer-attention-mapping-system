import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import '../styles/DashboardLayout.css';

function DashboardLayout({ children }) {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <Navbar />
        <div className="dashboard-body">{children}</div>
      </div>
    </div>
  );
}

export default DashboardLayout;
