import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import "../styles/dashboard.css";
import "../styles/settings.css";

const Settings = () => {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [cameraOfflineAlerts, setCameraOfflineAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="dashboard-content">
        <Navbar />

        <div className="page-header">
          <h2>Settings</h2>
          <p>Manage notification preferences and account security.</p>
        </div>

        <div className="settings-grid">
          <div className="settings-card">
            <h4>Notifications</h4>

            <div className="settings-row">
              <div className="settings-row-label">
                <strong>Email Alerts</strong>
                <span>Get notified by email about important activity.</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={() => setEmailAlerts(!emailAlerts)}
                />
                <span className="switch-track"></span>
              </label>
            </div>

            <div className="settings-row">
              <div className="settings-row-label">
                <strong>Camera Offline Alerts</strong>
                <span>Notify me immediately if a camera goes offline.</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={cameraOfflineAlerts}
                  onChange={() => setCameraOfflineAlerts(!cameraOfflineAlerts)}
                />
                <span className="switch-track"></span>
              </label>
            </div>

            <div className="settings-row">
              <div className="settings-row-label">
                <strong>Weekly Digest</strong>
                <span>A weekly summary of consumer attention trends.</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={weeklyDigest}
                  onChange={() => setWeeklyDigest(!weeklyDigest)}
                />
                <span className="switch-track"></span>
              </label>
            </div>
          </div>

          <div className="settings-card">
            <h4>Change Password</h4>

            <form onSubmit={(e) => e.preventDefault()}>
              <input
                className="form-control"
                type="password"
                placeholder="Current password"
              />
              <input
                className="form-control"
                type="password"
                placeholder="New password"
              />
              <input
                className="form-control"
                type="password"
                placeholder="Confirm new password"
              />

              <button type="submit" className="btn-save">
                Update Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;