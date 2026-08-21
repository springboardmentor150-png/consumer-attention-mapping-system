import React from "react";
import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  Store,
  Package,
  Camera,
  Users,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

import "../styles/Sidebar.css";

function Sidebar() {

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    // Only this button logs out
    window.location.href = "/";
  };


  // =====================================================
  // SIDEBAR MENU
  // =====================================================

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      active: true,
    },

    {
      name: "Stores",
      icon: Store,
    },

    {
      name: "Shelves",
      icon: Package,
    },

    {
      name: "Cameras",
      icon: Camera,
    },

    {
      name: "Consumers",
      icon: Users,
    },

    {
      name: "Reports",
      icon: BarChart3,
    },

    {
      name: "Settings",
      icon: Settings,
    },
  ];


  return (
    <aside className="sidebar">

      {/* =================================================
          LOGO
      ================================================= */}

      <div className="sidebar-header">

        <div className="sidebar-logo">
          <span className="sidebar-logo-text">
            Consumer
            <br />
            Attention
            <br />
            Mapping
          </span>
        </div>

      </div>


      {/* =================================================
          MENU
      ================================================= */}

      <nav className="sidebar-nav">

        {menuItems.map((item) => {

          const Icon = item.icon;

          // Dashboard is the only menu item that
          // currently has a working page.
          if (item.active) {

            return (
              <NavLink
                key={item.name}
                to="/dashboard"
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? "active" : ""}`
                }
              >

                <Icon size={21} />

                <span>
                  {item.name}
                </span>

              </NavLink>
            );
          }


          // =================================================
          // OTHER MENU ITEMS
          // No navigation yet, so they CANNOT logout.
          // =================================================

          return (
            <button
              key={item.name}
              type="button"
              className="sidebar-item sidebar-disabled"
              onClick={(e) => {
                e.preventDefault();
              }}
            >

              <Icon size={21} />

              <span>
                {item.name}
              </span>

            </button>
          );

        })}

      </nav>


      {/* =================================================
          LOGOUT - ONLY THIS BUTTON LOGS OUT
      ================================================= */}

      <div className="sidebar-footer">

        <button
          type="button"
          className="sidebar-logout"
          onClick={handleLogout}
        >

          <LogOut size={21} />

          <span>
            Logout
          </span>

        </button>

      </div>

    </aside>
  );
}

export default Sidebar;