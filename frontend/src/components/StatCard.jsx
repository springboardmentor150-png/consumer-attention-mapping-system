import React from "react";
import "../styles/Cards.css";

function StatCard({ icon, title, value, subtitle, color }) {
  return (
    <div className="stat-card">
      <div
        className="stat-icon"
        style={{
          backgroundColor: `${color}20`,
          color: color,
        }}
      >
        {icon}
      </div>

      <div className="stat-info">
        <h4>{title}</h4>

        <h2 style={{ color }}>{value}</h2>

        <p>{subtitle}</p>
      </div>
    </div>
  );
}

export default StatCard;