import React from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import "../styles/dashboard.css";
import "../styles/shoppertracking.css";

const SHOPPERS = [
  { id: "#12", zone: "Aisle 3 - Beverages", dwell: "2m 14s", camera: "Cam 04", status: "active" },
  { id: "#08", zone: "Entrance", dwell: "0m 40s", camera: "Cam 01", status: "active" },
  { id: "#15", zone: "Aisle 1 - Produce", dwell: "4m 02s", camera: "Cam 02", status: "active" },
  { id: "#06", zone: "Checkout", dwell: "1m 18s", camera: "Cam 06", status: "idle" },
  { id: "#03", zone: "Aisle 5 - Snacks", dwell: "0m 55s", camera: "Cam 05", status: "idle" },
];

const ShopperTracking = () => {
  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="dashboard-content">
        <Navbar />

        <div className="page-header">
          <h2>Shopper Tracking</h2>
          <p>Live view of shopper movement across store zones.</p>
        </div>

        <div className="tracking-toolbar">
          <span className="tracking-live-pill">
            <span className="tracking-live-dot"></span>
            Live
          </span>
        </div>

        <div className="tracking-grid">
          {SHOPPERS.map((shopper) => (
            <div className="shopper-card" key={shopper.id}>
              <div className="shopper-card-top">
                <h4>Shopper {shopper.id}</h4>
                <span className={`shopper-status ${shopper.status}`}>
                  {shopper.status === "active" ? "Active" : "Idle"}
                </span>
              </div>

              <div className="shopper-meta">
                <span>
                  Zone: <strong>{shopper.zone}</strong>
                </span>
                <span>
                  Dwell time: <strong>{shopper.dwell}</strong>
                </span>
                <span>
                  Camera: <strong>{shopper.camera}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShopperTracking;