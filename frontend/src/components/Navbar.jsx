import React from "react";
import {
  Bell,
  Search,
  PersonCircle,
  ChevronDown
} from "react-bootstrap-icons";

import "../styles/navbar.css";

const Navbar = () => {
  return (
    <div className="navbar">

      {/* Left */}

      <div className="navbar-left">

        <h3>Dashboard</h3>

      </div>

      {/* Right */}

      <div className="navbar-right">

        <div className="search-box">

          <Search />

          <input
            type="text"
            placeholder="Search..."
          />

        </div>

        <div className="notification">

          <Bell />

          <span className="notification-dot"></span>

        </div>

        <div className="profile">

          <PersonCircle size={34} />

          <div className="profile-info">

            <h6>Admin</h6>

            <small>Administrator</small>

          </div>

          <ChevronDown />

        </div>

      </div>

    </div>
  );
};

export default Navbar;