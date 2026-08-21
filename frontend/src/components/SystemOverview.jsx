import React from "react";
import { Check, X, Users, Clock } from "lucide-react";
import "../styles/Cards.css";

function SystemOverview() {
  const data = [
    {
      icon: <Check size={24} />,
      title: "Cameras Online",
      value: "4",
      color: "#22C55E",
      bg: "#DCFCE7",
    },
    {
      icon: <X size={24} />,
      title: "Cameras Offline",
      value: "1",
      color: "#EF4444",
      bg: "#FEE2E2",
    },
    {
      icon: <Users size={24} />,
      title: "Active Visitors",
      value: "128",
      color: "#2563EB",
      bg: "#DBEAFE",
    },
    {
      icon: <Clock size={24} />,
      title: "Today's Sessions",
      value: "12",
      color: "#F59E0B",
      bg: "#FEF3C7",
    },
  ];

  return (
    <div className="overview-card">
      <h2>System Overview</h2>

      <div className="overview-grid">
        {data.map((item, index) => (
          <div
            className={`overview-item ${
              index !== data.length - 1 ? "overview-border" : ""
            }`}
            key={index}
          >
            <div
              className="circle"
              style={{
                background: item.bg,
                color: item.color,
              }}
            >
              {item.icon}
            </div>

            <p>{item.title}</p>

            <h3 style={{ color: item.color }}>{item.value}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SystemOverview;