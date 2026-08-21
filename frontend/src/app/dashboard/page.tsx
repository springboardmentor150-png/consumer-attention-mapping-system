"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { Navbar } from "../../components/layout/Navbar";
import { Sidebar } from "../../components/layout/Sidebar";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import StoreManagerDashboard from "../../components/dashboard/StoreManagerDashboard";
import { ROUTES } from "../../utils/constants";
import api from "../../services/api";

const kpis = [
  {
    title: "Total Stores", value: "12", change: "+8.3%", positive: true,
    accentGradient: "linear-gradient(90deg, #3b82f6, #6366f1)",
    icon: <svg width="22" height="22" fill="none" stroke="#60a5fa" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>,
    sub: "Across 4 regions",
  },
  {
    title: "Active Cameras", value: "84", change: "+12.5%", positive: true,
    accentGradient: "linear-gradient(90deg, #6366f1, #8b5cf6)",
    icon: <svg width="22" height="22" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>,
    sub: "2 offline for maintenance",
  },
  {
    title: "Shoppers Today", value: "2,481", change: "+4.2%", positive: true,
    accentGradient: "linear-gradient(90deg, #10b981, #06b6d4)",
    icon: <svg width="22" height="22" fill="none" stroke="#34d399" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>,
    sub: "vs 2,382 yesterday",
  },
  {
    title: "Avg Dwell Time", value: "8.4 min", change: "-2.1%", positive: false,
    accentGradient: "linear-gradient(90deg, #f59e0b, #ef4444)",
    icon: <svg width="22" height="22" fill="none" stroke="#fbbf24" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
    sub: "Aisle D trending down",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [tick, setTick] = useState(0);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) router.replace(ROUTES.AUTH);
    const id = setInterval(() => setTick(t => t + 1), 3000);
    
    // Load store id from localStorage or fetch default
    const sid = localStorage.getItem('selected_store_id') || '';
    if (sid) {
      setSelectedStoreId(sid);
    } else {
      // Fetch the first store if none is selected
      api.get('/stores').then(res => {
        if (res.data && res.data.length > 0) {
          const firstStoreId = res.data[0].id;
          localStorage.setItem('selected_store_id', firstStoreId);
          setSelectedStoreId(firstStoreId);
        }
      }).catch(err => console.error("Could not fetch stores", err));
    }
    
    return () => clearInterval(id);
  }, [mounted, isAuthenticated, isLoading, router]);

  if (!mounted || isLoading || !isAuthenticated || !user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020817" }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";
  const isStoreManager = user.role === 'store_manager' || user.role === 'super_admin';

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#020817" }}>
      <Navbar />
      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", paddingBottom: 20, borderBottom: "1px solid rgba(30,45,74,0.6)" }}>
            <div>
              <p style={{ fontSize: 12, color: "#2a3f60", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                {greeting}, {user.email.split("@")[0]}
              </p>
              <h1 style={{
                fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em",
                background: "linear-gradient(135deg, #f0f4ff 0%, #93c5fd 70%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                Retail Intelligence Hub
              </h1>
              <p style={{ color: "#4a6080", fontSize: 13, marginTop: 4 }}>
                Real-time shopper attention mapping across your retail network
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "8px 14px" }}>
                <div className="live-dot" />
                <span style={{ fontSize: 12, color: "#34d399", fontWeight: 600 }}>All Systems Online</span>
              </div>
            </div>
          </div>

          {/* Store Manager: live analytics dashboard */}
          {isStoreManager ? (
            <StoreManagerDashboard storeId={selectedStoreId} />
          ) : (
            <>
              {/* Generic KPI Grid for other roles */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                {kpis.map((kpi) => (
                  <div key={kpi.title} className="kpi-card" style={{ "--accent-gradient": kpi.accentGradient } as React.CSSProperties}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div style={{ padding: 10, background: "rgba(5,15,35,0.8)", borderRadius: 10, border: "1px solid rgba(30,45,74,0.6)" }}>
                        {kpi.icon}
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
                        background: kpi.positive ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)",
                        color: kpi.positive ? "#34d399" : "#fb7185",
                        border: `1px solid ${kpi.positive ? "rgba(16,185,129,0.25)" : "rgba(244,63,94,0.25)"}`,
                      }}>
                        {kpi.change}
                      </span>
                    </div>
                    <div style={{ fontSize: 30, fontWeight: 900, color: "#f0f4ff", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 4 }}>
                      {kpi.value}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#8ba3c7", marginBottom: 2 }}>{kpi.title}</div>
                    <div style={{ fontSize: 11, color: "#2a3f60" }}>{kpi.sub}</div>
                  </div>
                ))}
              </div>

              {/* Camera Grid for non-manager roles */}
              <div style={{ background: "rgba(13, 21, 38, 0.7)", border: "1px solid rgba(30,45,74,0.6)", borderRadius: 16, padding: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#e2e8f0", marginBottom: 4 }}>Camera Network Status</h2>
                <p style={{ fontSize: 11, color: "#2a3f60", marginBottom: 20 }}>Live feed overview across all registered devices</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
                  {Array.from({ length: 12 }, (_, i) => {
                    const status = i === 6 ? "offline" : i === 9 ? "maintenance" : "online";
                    const colors = {
                      online: { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", dot: "#10b981", label: "Online" },
                      offline: { bg: "rgba(244,63,94,0.08)", border: "rgba(244,63,94,0.25)", dot: "#f43f5e", label: "Offline" },
                      maintenance: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", dot: "#f59e0b", label: "Maint." }
                    };
                    const c = colors[status];
                    return (
                      <div key={i} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: c.dot, margin: "0 auto 8px", boxShadow: `0 0 6px ${c.dot}` }} />
                        <div style={{ fontSize: 11, color: "#8ba3c7", fontWeight: 700 }}>CAM-{String(i + 1).padStart(2, "0")}</div>
                        <div style={{ fontSize: 9, color: "#2a3f60", marginTop: 2 }}>{c.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  );
}
