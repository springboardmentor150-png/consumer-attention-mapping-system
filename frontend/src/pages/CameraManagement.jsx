import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../styles/camera.css";

const CameraManagement = () => {
  const [camera, setCamera] = useState({
    name: "Camera 01",
    location: "Entrance Gate",
    ip: "192.168.1.101",
    resolution: "1920 × 1080",
    status: "Online"
  });

  const [showLive, setShowLive] = useState(false);
  const [editing, setEditing] = useState(false);

  const handleEdit = () => {
    setEditing(true);
  };

  const handleSave = () => {
    setEditing(false);
    alert("Camera details updated successfully!");
  };

  const handleDelete = () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this camera?"
    );

    if (confirmed) {
      setCamera(null);
    }
  };

  if (!camera) {
    return (
      <div className="dashboard-container">
        <Sidebar />

        <div className="dashboard-content">
          <Navbar />

          <div className="page-header">
            <h2>Camera Management</h2>
            <p>Manage all surveillance cameras connected to your retail store.</p>
          </div>

          <div className="camera-card">
            <h4>No cameras available</h4>
            <p>The camera has been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="dashboard-content">
        <Navbar />

        <div className="page-header">
          <h2>Camera Management</h2>
          <p>
            Manage all surveillance cameras connected to your retail store.
          </p>
        </div>

        <div className="camera-card">
          <div className="camera-top">
            <h4>{camera.name}</h4>
            <span className="status online">{camera.status}</span>
          </div>

          {editing ? (
            <>
              <p>
                <strong>Location:</strong>{" "}
                <input
                  value={camera.location}
                  onChange={(e) =>
                    setCamera({
                      ...camera,
                      location: e.target.value
                    })
                  }
                />
              </p>

              <p>
                <strong>IP Address:</strong>{" "}
                <input
                  value={camera.ip}
                  onChange={(e) =>
                    setCamera({
                      ...camera,
                      ip: e.target.value
                    })
                  }
                />
              </p>

              <p>
                <strong>Resolution:</strong>{" "}
                <input
                  value={camera.resolution}
                  onChange={(e) =>
                    setCamera({
                      ...camera,
                      resolution: e.target.value
                    })
                  }
                />
              </p>

              <div className="camera-buttons">
                <button
                  className="btn btn-success"
                  onClick={handleSave}
                >
                  Save
                </button>

                <button
                  className="btn btn-danger"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <p>
                <strong>Location:</strong> {camera.location}
              </p>

              <p>
                <strong>IP Address:</strong> {camera.ip}
              </p>

              <p>
                <strong>Resolution:</strong> {camera.resolution}
              </p>

              <div className="camera-buttons">
                <button
                  className="btn btn-success"
                  onClick={() => setShowLive(true)}
                >
                  View Live
                </button>

                <button
                  className="btn btn-primary"
                  onClick={handleEdit}
                >
                  Edit
                </button>

                <button
                  className="btn btn-danger"
                  onClick={handleDelete}
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>

        {showLive && (
          <div className="camera-card" style={{ marginTop: "20px" }}>
            <div className="camera-top">
              <h4>Live Camera Feed</h4>

              <button
                className="btn btn-danger"
                onClick={() => setShowLive(false)}
              >
                Close
              </button>
            </div>

            <div
              style={{
                height: "300px",
                background: "#111827",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                borderRadius: "10px",
                marginTop: "15px"
              }}
            >
              <div style={{ textAlign: "center" }}>
                <h3>📹 Camera 01</h3>
                <p>Live camera feed preview</p>
                <span>● Camera Online</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraManagement;