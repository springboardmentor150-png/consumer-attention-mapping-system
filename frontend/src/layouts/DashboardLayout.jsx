import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

function DashboardLayout({ children }) {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ width: '100%' }}>
        <Navbar />
        <div style={{ padding: '20px' }}>{children}</div>
      </div>
    </div>
  );
}

export default DashboardLayout;
