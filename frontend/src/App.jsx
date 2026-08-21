import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Public pages
import Login from "./pages/Login";
import Register from "./pages/Register";

// Protected pages
import Dashboard from "./pages/Dashboard";
import StoreManagement from "./pages/StoreManagement";
import ShelfManagement from "./pages/ShelfManagement";

// Phase 3-8 pages
import VideoProcessing from "./pages/VideoProcessing";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import HeatmapViewer from "./pages/HeatmapViewer";
import ShopperJourney from "./pages/ShopperJourney";
import ProductAnalytics from "./pages/ProductAnalytics";
import Recommendations from "./pages/Recommendations";
import Reports from "./pages/Reports";

// New pages
import AdminDashboard from "./pages/AdminDashboard";
import CameraManagement from "./pages/CameraManagement";
import AlertsPage from "./pages/AlertsPage";

const ALL_ROLES = ["Admin", "Store Manager", "Retail Analyst", "Marketing Manager"];
const ADMIN_ROLES = ["Admin"];

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={ALL_ROLES} />}>
          <Route element={<Layout />}>
            {/* Overview */}
            <Route path="/" element={<Dashboard />} />

            {/* Retail Management */}
            <Route path="/stores" element={<StoreManagement />} />
            <Route path="/shelves" element={<ShelfManagement />} />
            <Route path="/cameras" element={<CameraManagement />} />

            {/* Video Processing */}
            <Route path="/videos" element={<VideoProcessing />} />

            {/* Analytics */}
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/heatmaps" element={<HeatmapViewer />} />
            <Route path="/journeys" element={<ShopperJourney />} />
            <Route path="/products-analytics" element={<ProductAnalytics />} />

            {/* Intelligence */}
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/alerts" element={<AlertsPage />} />

            {/* Reports */}
            <Route path="/reports" element={<Reports />} />

            {/* Admin */}
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

