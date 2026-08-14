import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Shop,
  Grid,
  BoxArrowRight
} from "react-bootstrap-icons";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import "../styles/dashboard.css";
import "../styles/admindashboard.css";

function AdminDashboard() {
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    localStorage.removeItem("user_role");

    navigate("/");
  };

  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="dashboard-content">
        <Navbar />

        <div className="dashboard-header">
          <h2>Admin Dashboard</h2>
          <p className="admin-welcome">
            Welcome to Consumer Attention Mapping System
          </p>
          <span className="admin-role-badge">Logged in as: {role}</span>
        </div>

        <div className="quick-actions">
          <div
            className="action-card"
            onClick={() => navigate("/store-management")}
          >
            <div className="action-icon">
              <Shop />
            </div>
            <h4>Add Store</h4>
            <p>Register a new retail store location.</p>
          </div>

          <div
            className="action-card"
            onClick={() => navigate("/add-shelf")}
          >
            <div className="action-icon">
              <Grid />
            </div>
            <h4>Add Shelf</h4>
            <p>Create a new shelf zone for an existing store.</p>
          </div>

          <div
            className="action-card danger"
            onClick={handleLogout}
          >
            <div className="action-icon">
              <BoxArrowRight />
            </div>
            <h4>Logout</h4>
            <p>Sign out of the admin console.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;