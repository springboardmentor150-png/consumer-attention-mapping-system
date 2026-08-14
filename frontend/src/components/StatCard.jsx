import React from "react";
import "../styles/statcard.css";

const StatCard = ({
  title,
  value,
  icon,
  color,
  change
}) => {
  return (
    <div className="stat-card">

      <div className="stat-top">

        <div>

          <p className="stat-title">
            {title}
          </p>

          <h3 className="stat-value">
            {value}
          </h3>

          <small className="stat-change">
            {change}
          </small>

        </div>

        <div
          className="stat-icon"
          style={{ background: color }}
        >
          {icon}
        </div>

      </div>

    </div>
  );
};

export default StatCard;