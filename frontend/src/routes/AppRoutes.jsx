import { Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Stores from '../pages/Stores';
import AddStore from '../pages/AddStore';
import Shelves from '../pages/Shelves';
import AddShelf from '../pages/AddShelf';
import Cameras from '../pages/Cameras';
import Profile from '../pages/Profile';
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
            <Dashboard />
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
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
