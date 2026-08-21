import React from "react";
import {
  Plus,
  Store,
  Package,
  Camera,
  BarChart3,
} from "lucide-react";

import "../styles/Cards.css";

function QuickActions() {
  const actions = [
    {
      icon: <Store size={24} />,
      title: "Add Store",
      color: "#2563EB",
      bg: "#DBEAFE",
    },
    {
      icon: <Package size={24} />,
      title: "Add Shelf",
      color: "#22C55E",
      bg: "#DCFCE7",
    },
    {
      icon: <Camera size={24} />,
      title: "Connect Camera",
      color: "#F59E0B",
      bg: "#FEF3C7",
    },
    {
      icon: <BarChart3 size={24} />,
      title: "View Reports",
      color: "#8B5CF6",
      bg: "#EDE9FE",
    },
  ];

  return (
    <div className="quick-card">
      <h2>Quick Actions</h2>

      <div className="quick-grid">
        {actions.map((item, index) => (
          <div className="quick-item" key={index}>
            <div
              className="quick-icon"
              style={{
                background: item.bg,
                color: item.color,
              }}
            >
              {item.icon}

              <span
                className="plus-badge"
                style={{
                  color: item.color,
                }}
              >
                <Plus size={14} />
              </span>
            </div>

            <p>{item.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default QuickActions;