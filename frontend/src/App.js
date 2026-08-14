import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CameraManagement from "./pages/CameraManagement";
import AddStore from "./pages/AddStore";
import AddShelf from "./pages/AddShelf";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import ShopperTracking from "./pages/ShopperTracking";

import ProtectedRoute from "./components/ProtectedRoute";


function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ===========================
            PUBLIC ROUTE
        =========================== */}

        <Route
          path="/"
          element={<Login />}
        />


        {/* ===========================
            DASHBOARD
            All roles
        =========================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Store Manager",
                "Retail Analyst",
                "Marketing Manager"
              ]}
            >
              <Dashboard />
            </ProtectedRoute>
          }
        />


        {/* ===========================
            CAMERA MANAGEMENT
            Admin + Store Manager
        =========================== */}

        <Route
          path="/camera-management"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Store Manager"
              ]}
            >
              <CameraManagement />
            </ProtectedRoute>
          }
        />


        {/* ===========================
            STORE MANAGEMENT
            Admin + Store Manager
        =========================== */}

        <Route
          path="/store-management"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Store Manager"
              ]}
            >
              <AddStore />
            </ProtectedRoute>
          }
        />


        {/* ===========================
            SHELF MANAGEMENT
            Admin + Store Manager
        =========================== */}

        <Route
          path="/add-shelf"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Store Manager"
              ]}
            >
              <AddShelf />
            </ProtectedRoute>
          }
        />


        {/* ===========================
            SHOPPER TRACKING
            Admin + Store Manager + Retail Analyst
        =========================== */}

        <Route
          path="/shopper-tracking"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Store Manager",
                "Retail Analyst"
              ]}
            >
              <ShopperTracking />
            </ProtectedRoute>
          }
        />


        {/* ===========================
            REPORTS
            All roles
        =========================== */}

        <Route
          path="/reports"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Store Manager",
                "Retail Analyst",
                "Marketing Manager"
              ]}
            >
              <Reports />
            </ProtectedRoute>
          }
        />


        {/* ===========================
            PROFILE
            All roles
        =========================== */}

        <Route
          path="/profile"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Store Manager",
                "Retail Analyst",
                "Marketing Manager"
              ]}
            >
              <Profile />
            </ProtectedRoute>
          }
        />


        {/* ===========================
            SETTINGS
            All roles
        =========================== */}

        <Route
          path="/settings"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin",
                "Store Manager",
                "Retail Analyst",
                "Marketing Manager"
              ]}
            >
              <Settings />
            </ProtectedRoute>
          }
        />


        {/* ===========================
            ADMIN DASHBOARD
            Admin only
        =========================== */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute
              allowedRoles={[
                "Admin"
              ]}
            >
              <AdminDashboard />
            </ProtectedRoute>
          }
        />


        {/* ===========================
            UNKNOWN ROUTE
        =========================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}


export default App;