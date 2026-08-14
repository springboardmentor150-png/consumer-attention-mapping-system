import React from "react";

const Notification = ({ alerts = [] }) => {
  if (alerts.length === 0) {
    return (
      <div className="notification-card notification-success">
        <div>
          <strong>All products are performing well</strong>
          <p>No urgent product alerts at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-card">
      <div className="notification-header">
        <h3>Product Alerts</h3>
        <span className="notification-count">
          {alerts.length}
        </span>
      </div>

      <div className="notification-list">
        {alerts.map((alert) => (
          <div
            className="notification-item"
            key={alert.product_id}
          >
            <div>
              <strong>{alert.product_name}</strong>
              <p>
                Attractiveness Score: {alert.attractiveness_score}
              </p>
              <p>{alert.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notification;