"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { ROLES, ROUTES } from "../../utils/constants";

interface NavItem { label: string; path: string; icon: React.ReactNode; badge?: string; }

const icons = {
  dashboard: <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
  stores: <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>,
  cameras: <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>,
  users: <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
  analytics: <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
  behavior: <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
  heatmaps: <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>,
  recommendations: <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>,
  reports: <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  settings: <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
};

function getLinks(role: string): NavItem[] {
  const base: NavItem[] = [{ label: "Dashboard", path: ROUTES.DASHBOARD, icon: icons.dashboard }];
  switch (role) {
    case ROLES.SUPER_ADMIN: return [...base,
      { label: "Stores", path: ROUTES.STORES, icon: icons.stores },
      { label: "Cameras", path: ROUTES.CAMERAS, icon: icons.cameras },
      { label: "Behavior", path: ROUTES.BEHAVIOR, icon: icons.behavior },
      { label: "Heatmaps", path: ROUTES.HEATMAPS, icon: icons.heatmaps },
      { label: "Recommendations", path: ROUTES.RECOMMENDATIONS, icon: icons.recommendations },
      { label: "Reports", path: ROUTES.REPORTS, icon: icons.reports },
    ];
    case ROLES.STORE_MANAGER: return [...base,
      { label: "Stores", path: ROUTES.STORES, icon: icons.stores },
      { label: "Cameras", path: ROUTES.CAMERAS, icon: icons.cameras },
      { label: "Behavior", path: ROUTES.BEHAVIOR, icon: icons.behavior },
      { label: "Heatmaps", path: ROUTES.HEATMAPS, icon: icons.heatmaps },
      { label: "Recommendations", path: ROUTES.RECOMMENDATIONS, icon: icons.recommendations },
      { label: "Reports", path: ROUTES.REPORTS, icon: icons.reports },
    ];
    default: return [...base,
      { label: "Behavior", path: ROUTES.BEHAVIOR, icon: icons.behavior },
      { label: "Heatmaps", path: ROUTES.HEATMAPS, icon: icons.heatmaps },
      { label: "Recommendations", path: ROUTES.RECOMMENDATIONS, icon: icons.recommendations },
      { label: "Reports", path: ROUTES.REPORTS, icon: icons.reports },
    ];
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  if (!user) return null;

  const links = getLinks(user.role);

  return (
    <aside style={{
      width: 220, flexShrink: 0,
      background: "rgba(5, 12, 28, 0.6)", backdropFilter: "blur(20px)",
      borderRight: "1px solid rgba(30, 45, 74, 0.6)",
      display: "flex", flexDirection: "column", padding: "20px 10px",
      gap: 2,
    }}>
      <div style={{ padding: "0 10px 12px", marginBottom: 4, borderBottom: "1px solid rgba(30,45,74,0.5)" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#2a3f60", letterSpacing: "0.10em", textTransform: "uppercase" }}>
          Navigation
        </span>
      </div>

      {links.map((link) => {
        const isActive = pathname === link.path;
        return (
          <a key={link.path} href={link.path} className={`nav-item ${isActive ? "active" : ""}`}>
            <span style={{ opacity: isActive ? 1 : 0.6, flexShrink: 0 }}>{link.icon}</span>
            <span style={{ flex: 1 }}>{link.label}</span>
            {link.badge && (
              <span style={{
                fontSize: 10, fontWeight: 700, background: "rgba(59,130,246,0.15)",
                color: "#60a5fa", borderRadius: 6, padding: "1px 6px",
                border: "1px solid rgba(59,130,246,0.25)",
              }}>{link.badge}</span>
            )}
          </a>
        );
      })}

      <div style={{ marginTop: "auto", padding: "12px 10px 4px", borderTop: "1px solid rgba(30,45,74,0.5)" }}>
        <div style={{ fontSize: 10, color: "#1e2d4a", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>System Status</div>
        {[
          { label: "PostgreSQL", color: "#10b981" },
          { label: "MongoDB", color: "#10b981" },
          { label: "Redis Cache", color: "#10b981" },
        ].map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, boxShadow: `0 0 6px ${s.color}`, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "#2a3f60", fontWeight: 500 }}>{s.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
