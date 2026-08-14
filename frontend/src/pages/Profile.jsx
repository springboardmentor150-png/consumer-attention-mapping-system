import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import "../styles/dashboard.css";
import "../styles/profile.css";

const Profile = () => {
  const role = localStorage.getItem("role") || "Admin";

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "Sayali G",
    email: "sayali@example.com",
    phone: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const initials = form.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="dashboard-content">
        <Navbar />

        <div className="page-header">
          <h2>Profile</h2>
          <p>View and manage your account details.</p>
        </div>

        <div className="profile-card">
          <div className="profile-top">
            <div className="profile-avatar">{initials}</div>

            <div>
              <h3>{form.name}</h3>
              <span>{form.email}</span>
              <div className="profile-role-badge">{role}</div>
            </div>
          </div>

          <form onSubmit={(e) => e.preventDefault()}>
            <label>Full Name</label>
            <input
              className="form-control"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              disabled={!editing}
            />

            <label>Email</label>
            <input
              className="form-control"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              disabled={!editing}
            />

            <label>Phone Number</label>
            <input
              className="form-control"
              type="tel"
              name="phone"
              placeholder="Add a phone number"
              value={form.phone}
              onChange={handleChange}
              disabled={!editing}
            />

            <div className="profile-actions">
              {editing ? (
                <>
                  <button
                    type="submit"
                    className="btn-save"
                    onClick={() => setEditing(false)}
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn-save"
                  onClick={() => setEditing(true)}
                >
                  Edit Profile
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;