"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useRouter } from "next/navigation";
import { ROUTES } from "../../utils/constants";

const roleColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
  super_admin:      { bg: "rgba(139,92,246,0.12)", text: "#a78bfa", border: "rgba(139,92,246,0.3)", label: "Super Admin" },
  store_manager:    { bg: "rgba(59,130,246,0.12)",  text: "#60a5fa", border: "rgba(59,130,246,0.3)",  label: "Store Manager" },
  retail_analyst:   { bg: "rgba(16,185,129,0.12)",  text: "#34d399", border: "rgba(16,185,129,0.3)",  label: "Retail Analyst" },
  marketing_manager:{ bg: "rgba(245,158,11,0.12)",  text: "#fbbf24", border: "rgba(245,158,11,0.3)",  label: "Marketing Mgr" },
};

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    logout();
    router.replace(ROUTES.AUTH);
  };

  const role = user?.role ? roleColors[user.role] || roleColors.retail_analyst : null;

  return (
    <nav style={{
      height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px", position: "sticky", top: 0, zIndex: 50,
      background: "rgba(2, 8, 23, 0.85)", backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(30, 45, 74, 0.8)",
      boxShadow: "0 1px 0 rgba(59,130,246,0.04)",
    }}>
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "linear-gradient(135deg, #1d4ed8 0%, #4f46e5 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 20px rgba(59,130,246,0.3)",
        }}>
          <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em", color: "#f0f4ff" }}>CAMS</div>
          <div style={{ fontSize: 10, color: "#2a3f60", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", lineHeight: 1 }}>Intelligence</div>
        </div>

        {/* Live indicator */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6, marginLeft: 8,
          background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
          borderRadius: 99, padding: "3px 10px",
        }}>
          <div className="live-dot" />
          <span style={{ fontSize: 11, color: "#34d399", fontWeight: 600 }}>LIVE</span>
        </div>
      </div>

      {/* Right side */}
      {mounted && user && (
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* User info */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.3 }}>
              {user.email.split("@")[0]}
            </div>
            {role && (
              <div style={{
                display: "inline-flex", alignItems: "center", marginTop: 3,
                background: role.bg, color: role.text, border: `1px solid ${role.border}`,
                borderRadius: 6, padding: "1px 7px", fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
              }}>
                {role.label}
              </div>
            )}
          </div>

          {/* Avatar */}
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #1e40af 0%, #4338ca 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 800, color: "white",
            border: "2px solid rgba(59,130,246,0.3)",
            boxShadow: "0 0 12px rgba(59,130,246,0.2)",
          }}>
            {user.email[0].toUpperCase()}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 28, background: "rgba(30,45,74,0.8)" }} />

          {/* Logout */}
          <button onClick={handleLogout} disabled={loggingOut} className="btn-ghost" style={{ padding: "7px 14px" }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      )}
    </nav>
  );
}
