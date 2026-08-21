import React from "react";
import "../styles/Cards.css";

import {
  Store,
  Package,
  Camera,
} from "lucide-react";

const activities = [
  {
    icon: <Store size={20} />,
    text: 'Store "Main Branch" created',
    time: "10:30 AM",
    color: "#22C55E",
  },
  {
    icon: <Package size={20} />,
    text: 'Shelf "Snacks" added in Store 1',
    time: "09:45 AM",
    color: "#22C55E",
  },
  {
    icon: <Camera size={20} />,
    text: "Camera 02 disconnected",
    time: "09:20 AM",
    color: "#EF4444",
  },
  {
    icon: <Camera size={20} />,
    text: "Camera 03 connected",
    time: "09:10 AM",
    color: "#22C55E",
  },
];

function RecentActivity() {
  return (
    <div className="recent-activity">

      <h2>Recent Activity</h2>

      {activities.map((item, index) => (
        <div className="activity-item" key={index}>

          <div className="activity-left">

            <div
              className="activity-icon"
              style={{
                background: item.color + "20",
                color: item.color,
              }}
            >
              {item.icon}
            </div>

            <span>{item.text}</span>

          </div>

          <div className="activity-time">
            {item.time}
          </div>

        </div>
      ))}

    </div>
  );
}

export default RecentActivity;