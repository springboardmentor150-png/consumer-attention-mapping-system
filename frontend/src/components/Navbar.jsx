import React from "react";
import "../styles/Navbar.css";

import {
  Menu,
  Bell,
  ChevronDown,
} from "lucide-react";

function Navbar() {
  return (
    <header className="navbar">

      {/* Left */}
      <div className="navbar-left">

        <button className="menu-btn">
          <Menu size={28} />
        </button>

      </div>

      {/* Right */}
      <div className="navbar-right">

        <button className="notification-btn">

          <Bell size={22} />

          <span className="notification-dot"></span>

        </button>

        <div className="profile">

          <div className="avatar">
            SM
          </div>

          <span className="profile-name">
            Store Manager
          </span>

          <ChevronDown size={18} />

        </div>

      </div>

    </header>
  );
}

export default Navbar;