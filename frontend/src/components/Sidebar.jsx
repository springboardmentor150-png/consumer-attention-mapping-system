import React from "react";
import { NavLink } from "react-router-dom";

import {
  HouseDoor,
  CameraVideo,
  Shop,
  Grid,
  FileEarmarkText,
  Person,
  Gear,
  BoxArrowRight,
  PersonWalking
} from "react-bootstrap-icons";

import "../styles/Sidebar.css";


/* ===========================
   MENU ITEMS
=========================== */

const MENU_ITEMS = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: <HouseDoor />,
    roles: [
      "Admin",
      "Store Manager",
      "Retail Analyst",
      "Marketing Manager"
    ]
  },

  {
    to: "/camera-management",
    label: "Camera Management",
    icon: <CameraVideo />,
    roles: [
      "Admin",
      "Store Manager"
    ]
  },

  {
    to: "/store-management",
    label: "Store Management",
    icon: <Shop />,
    roles: [
      "Admin",
      "Store Manager"
    ]
  },

  {
    to: "/add-shelf",
    label: "Shelf Management",
    icon: <Grid />,
    roles: [
      "Admin",
      "Store Manager"
    ]
  },

  {
    to: "/shopper-tracking",
    label: "Shopper Tracking",
    icon: <PersonWalking />,
    roles: [
      "Admin",
      "Store Manager",
      "Retail Analyst"
    ]
  },

  {
    to: "/reports",
    label: "Reports",
    icon: <FileEarmarkText />,
    roles: [
      "Admin",
      "Store Manager",
      "Retail Analyst",
      "Marketing Manager"
    ]
  },

  {
    to: "/profile",
    label: "Profile",
    icon: <Person />,
    roles: [
      "Admin",
      "Store Manager",
      "Retail Analyst",
      "Marketing Manager"
    ]
  },

  {
    to: "/settings",
    label: "Settings",
    icon: <Gear />,
    roles: [
      "Admin",
      "Store Manager",
      "Retail Analyst",
      "Marketing Manager"
    ]
  }
];


/* ===========================
   SIDEBAR
=========================== */

const Sidebar = () => {

  // Get logged-in user's role
  const userRole =
    localStorage.getItem("user_role") ||
    localStorage.getItem("role") ||
    "Admin";


  /* ===========================
     LOGOUT
  =========================== */

  const handleLogout = () => {

    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    localStorage.removeItem("user_role");

    window.location.href = "/";
  };


  /* ===========================
     FILTER MENU
  =========================== */

  const visibleMenuItems = MENU_ITEMS.filter((item) =>
    item.roles.includes(userRole)
  );


  return (
    <div className="sidebar">

      {/* ===========================
          LOGO
      =========================== */}

      <div className="sidebar-logo">

        <CameraVideo size={34} />

        <h4>CAMS</h4>

      </div>


      {/* ===========================
          MENU
      =========================== */}

      <ul className="sidebar-menu">

        {visibleMenuItems.map((item) => (

          <li key={item.to}>

            <NavLink
              to={item.to}
              className={({ isActive }) =>
                isActive ? "active" : ""
              }
            >

              {item.icon}

              <span>{item.label}</span>

            </NavLink>

          </li>

        ))}

      </ul>


      {/* ===========================
          LOGOUT
      =========================== */}

      <div
        className="logout"
        onClick={handleLogout}
      >

        <BoxArrowRight />

        <span>Logout</span>

      </div>

    </div>
  );
};


export default Sidebar;