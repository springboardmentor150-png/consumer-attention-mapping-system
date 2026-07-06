import DashboardLayout from '../layouts/DashboardLayout';
import DashboardCard from '../components/DashboardCard';

function Dashboard() {
  return (
    <DashboardLayout>
      <h1>Dashboard</h1>
      <div
        style={{
          display: 'flex',
          gap: '20px',
          marginTop: '30px'
        }}
      >
        <DashboardCard title="Stores" value="5" />
        <DashboardCard title="Shelves" value="28" />
        <DashboardCard title="Cameras" value="18" />
        <DashboardCard title="Users" value="12" />
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;
