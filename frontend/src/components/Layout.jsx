import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Store, Layers, LogOut, User as UserIcon,
  Video, BarChart3, Flame, GitFork, ShoppingBag,
  Lightbulb, FileText, Bell, ChevronDown, ChevronRight,
  Camera, Shield
} from "lucide-react";

const NAV_GROUPS = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", path: "/", icon: LayoutDashboard }
    ]
  },
  {
    title: "Retail Setup",
    items: [
      { name: "Stores & Zones", path: "/stores", icon: Store },
      { name: "Shelves", path: "/shelves", icon: Layers },
      { name: "Cameras", path: "/cameras", icon: Camera }
    ]
  },
  {
    title: "Video Processing",
    items: [
      { name: "Upload & Process", path: "/videos", icon: Video }
    ]
  },
  {
    title: "Analytics",
    items: [
      { name: "Analytics Dashboard", path: "/analytics", icon: BarChart3 },
      { name: "Heatmaps", path: "/heatmaps", icon: Flame },
      { name: "Shopper Journeys", path: "/journeys", icon: GitFork },
      { name: "Product Analytics", path: "/products-analytics", icon: ShoppingBag }
    ]
  },
  {
    title: "Intelligence",
    items: [
      { name: "Recommendations", path: "/recommendations", icon: Lightbulb },
      { name: "Alerts", path: "/alerts", icon: Bell }
    ]
  },
  {
    title: "Reports",
    items: [
      { name: "Generate Reports", path: "/reports", icon: FileText }
    ]
  },
  {
    title: "Administration",
    items: [
      { name: "Admin Panel", path: "/admin", icon: Shield }
    ]
  }
];

const ROLE_COLORS = {
  Admin: { bg: "rgba(239,68,68,0.12)", color: "#f87171", border: "rgba(239,68,68,0.25)" },
  "Store Manager": { bg: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "rgba(251,191,36,0.25)" },
  "Retail Analyst": { bg: "rgba(56,189,248,0.12)", color: "#38bdf8", border: "rgba(56,189,248,0.25)" },
  "Marketing Manager": { bg: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "rgba(167,139,250,0.25)" }
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : { name: "User", role: "Guest" };

  const roleSt = ROLE_COLORS[user.role] || { bg: "#1F2937", color: "#9CA3AF", border: "#374151" };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const currentPage = NAV_GROUPS.flatMap(g => g.items).find(i => i.path === location.pathname)?.name || "System";

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0B0F19", color: "#E5E7EB", overflow: "hidden" }}>
      {/* Sidebar */}
      <aside style={{
        width: "248px",
        background: "rgba(13,17,28,0.95)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid #151B2C",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #151B2C" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "linear-gradient(135deg, #4FACFE, #00F2FE)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 900, fontSize: "12px", color: "#0B0F19",
              boxShadow: "0 0 14px rgba(79,172,254,0.4)"
            }}>
              AM
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#fff", letterSpacing: "0.02em" }}>CAMS</div>
              <div style={{ fontSize: "9px", color: "#4FACFE", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Attention AI v1</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "16px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {NAV_GROUPS.map(group => (
            <div key={group.title} style={{ marginBottom: "6px" }}>
              <div style={{ fontSize: "9px", fontWeight: 700, color: "#4B5563", textTransform: "uppercase", letterSpacing: "0.1em", padding: "0 8px", marginBottom: "4px" }}>
                {group.title}
              </div>
              {group.items.map(item => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} style={{ textDecoration: "none" }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "9px 12px", borderRadius: "10px",
                      fontSize: "13px", fontWeight: active ? 700 : 500,
                      color: active ? "#fff" : "#6B7280",
                      background: active ? "rgba(79,172,254,0.12)" : "transparent",
                      border: active ? "1px solid rgba(79,172,254,0.25)" : "1px solid transparent",
                      transition: "all 0.15s",
                      cursor: "pointer"
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#E5E7EB"; } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; } }}
                    >
                      <Icon size={15} style={{ color: active ? "#4FACFE" : "inherit" }} />
                      {item.name}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: "12px", borderTop: "1px solid #151B2C" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", borderRadius: "10px", background: "rgba(21,27,44,0.5)", marginBottom: "6px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "rgba(79,172,254,0.15)", border: "1px solid rgba(79,172,254,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UserIcon size={14} style={{ color: "#4FACFE" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
              <div style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "4px", display: "inline-block", marginTop: "2px", background: roleSt.bg, color: roleSt.color, border: `1px solid ${roleSt.border}`, fontWeight: 600 }}>
                {user.role}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            display: "flex", alignItems: "center", gap: "8px", width: "100%",
            padding: "9px 12px", borderRadius: "10px", border: "none",
            background: "transparent", color: "#f87171",
            fontSize: "13px", fontWeight: 600, cursor: "pointer",
            transition: "background 0.15s"
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <header style={{
          height: "60px", flexShrink: 0,
          background: "rgba(11,15,25,0.8)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid #151B2C",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px"
        }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>
            {currentPage}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ fontSize: "11px", color: "#6B7280" }}>
              Consumer Attention Mapping System
            </div>
            <div style={{
              padding: "4px 10px", borderRadius: "20px",
              background: "rgba(52,211,153,0.12)", color: "#34d399",
              fontSize: "10px", fontWeight: 700, border: "1px solid rgba(52,211,153,0.2)"
            }}>
              ● LIVE
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "28px" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
