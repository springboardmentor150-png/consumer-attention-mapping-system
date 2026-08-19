import { Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import RoleDashboard from '../pages/RoleDashboard';
import ManagerDashboard from '../pages/ManagerDashboard';
import AnalystDashboard from '../pages/AnalystDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import MarketingDashboard from '../pages/MarketingDashboard';
import Stores from '../pages/Stores';
import AddStore from '../pages/AddStore';
import Shelves from '../pages/Shelves';
import AddShelf from '../pages/AddShelf';
import Cameras from '../pages/Cameras';
import AddCamera from '../pages/AddCamera';
import Profile from '../pages/Profile';
import Analytics from '../pages/Analytics';
import Reports from '../pages/Reports';
import Heatmap from '../pages/Heatmap';
import Recommendations from '../pages/Recommendations';
import ProtectedRoute from '../components/ProtectedRoute';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/live-dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager-dashboard"
        element={
          <ProtectedRoute>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/dashboard"
        element={
          <ProtectedRoute>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analyst-dashboard"
        element={
          <ProtectedRoute>
            <AnalystDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analyst/dashboard"
        element={
          <ProtectedRoute>
            <AnalystDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketing-dashboard"
        element={
          <ProtectedRoute>
            <MarketingDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketing/dashboard"
        element={
          <ProtectedRoute>
            <MarketingDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stores"
        element={
          <ProtectedRoute>
            <Stores />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-store"
        element={
          <ProtectedRoute>
            <AddStore />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shelves"
        element={
          <ProtectedRoute>
            <Shelves />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-shelf"
        element={
          <ProtectedRoute>
            <AddShelf />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cameras"
        element={
          <ProtectedRoute>
            <Cameras />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-camera"
        element={
          <ProtectedRoute>
            <AddCamera />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/heatmap"
        element={
          <ProtectedRoute>
            <Heatmap />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recommendations"
        element={
          <ProtectedRoute>
            <Recommendations />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
