"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Store,
  Grid3X3,
  Video,
  MapPin,
  Sparkles,
  LogOut,
  ChevronRight,
  Shield,
  Activity,
  Menu,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [role, setRole] = useState("Analyst");
  const [email, setEmail] = useState("");

  useEffect(() => {
    setRole(localStorage.getItem("role") || "StoreManager");
    setEmail(localStorage.getItem("email") || "admin@retailai.io");
    const savedCollapsed = localStorage.getItem("sidebar_collapsed");
    if (savedCollapsed === "true") {
      setCollapsed(true);
    }
  }, []);

  function toggleSidebar() {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem("sidebar_collapsed", String(newState));
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    router.push("/login");
  }

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      badge: "Live",
    },
    {
      name: "Stores Directory",
      href: "/stores",
      icon: Store,
      badge: null,
    },
    {
      name: "Shelf Analytics",
      href: "/shelves",
      icon: Grid3X3,
      badge: "Heatmap",
    },
    {
      name: "CCTV + YOLO Hub",
      href: "/cctv",
      icon: Video,
      badge: "AI Vision",
      accent: true,
    },
  ];

  return (
    <aside
      className={`shrink-0 flex flex-col justify-between h-screen sticky top-0 border-r border-white/5 bg-[#090d16]/85 backdrop-blur-xl z-30 transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand, Logo & Collapse Toggle */}
      <div>
        <div
          className={`p-4 border-b border-white/5 flex items-center ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          {/* Logo & Brand Name */}
          {!collapsed ? (
            <Link href="/dashboard" className="flex items-center gap-3 group min-w-0">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all shrink-0">
                <div className="w-full h-full bg-[#090d16] rounded-[11px] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse-slow" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight text-white group-hover:text-cyan-300 transition-colors truncate">
                    AURA VISION
                  </span>
                  <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                    AI
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 tracking-wide truncate">
                  Consumer Attention
                </p>
              </div>
            </Link>
          ) : (
            <Link href="/dashboard" className="group" title="AURA VISION AI">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
                <div className="w-full h-full bg-[#090d16] rounded-[11px] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
            </Link>
          )}

          {/* 3 Horizontal Lines Toggle Button */}
          <button
            onClick={toggleSidebar}
            title={collapsed ? "Expand navigation" : "Collapse navigation"}
            className={`p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-white/[0.06] border border-white/5 transition-all cursor-pointer ${
              collapsed ? "mt-2" : ""
            }`}
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Live Engine Status Indicator */}
        {!collapsed ? (
          <div className="mx-4 my-3 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 font-medium text-[11px]">YOLOv8 Engine</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              30 FPS
            </span>
          </div>
        ) : (
          <div className="flex justify-center my-3" title="YOLOv8 Engine: 30 FPS Active">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
        )}

        {/* Main Navigation Links */}
        <div className="px-3 py-2 space-y-1">
          {!collapsed && (
            <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              Main Intelligence
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={`group flex items-center ${
                  collapsed ? "justify-center p-3" : "justify-between px-3.5 py-2.5"
                } rounded-xl text-sm font-medium transition-all duration-200 relative ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/15 via-purple-500/10 to-transparent text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/5 font-semibold"
                    : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.03] border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-1.5 rounded-lg transition-colors ${
                      isActive
                        ? "bg-cyan-500/20 text-cyan-300"
                        : "bg-white/[0.03] text-slate-400 group-hover:text-cyan-300 group-hover:bg-white/[0.06]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {!collapsed && <span>{item.name}</span>}
                </div>

                {!collapsed && item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      item.accent
                        ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30 animate-pulse-slow"
                        : isActive
                        ? "bg-cyan-500/20 text-cyan-300"
                        : "bg-white/5 text-slate-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Collapsed Active Indicator Dot */}
                {collapsed && isActive && (
                  <span className="absolute right-1 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400"></span>
                )}
              </Link>
            );
          })}
        </div>

      {/* Quick Insights Section */}
      <div className="px-3 py-2 space-y-1">
        {!collapsed && (
          <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            Spatial and Live Radar
          </div>
        )}

        <Link
          href="/stores/1"
          title={collapsed ? "Interactive Store Map" : undefined}
          className={`flex items-center ${
            collapsed ? "justify-center p-3" : "justify-between px-3.5 py-2"
          } rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] transition-all`}
        >
          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-purple-400" />
            {!collapsed && <span>Interactive Store Map</span>}
          </div>
          {!collapsed && <ChevronRight className="w-3.5 h-3.5 text-slate-600" />}
        </Link>

        <Link
          href="/cctv"
          title={collapsed ? "Gaze and Attention Radar" : undefined}
          className={`flex items-center ${
            collapsed ? "justify-center p-3" : "justify-between px-3.5 py-2"
          } rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] transition-all`}
        >
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-cyan-400" />
            {!collapsed && <span>Gaze and Attention Radar</span>}
          </div>
          {!collapsed && <ChevronRight className="w-3.5 h-3.5 text-slate-600" />}
        </Link>
      </div>
    </div>

    {/* User Footer Profile & Sign Out */}
    <div className="p-3 border-t border-white/5 bg-black/20">
      <div
        className={`p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center ${
          collapsed ? "flex-col gap-3 justify-center" : "justify-between"
        }`}
      >
        <div
          className={`flex items-center gap-2.5 min-w-0 ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? `${email} (${role})` : undefined}
        >
          <div
            suppressHydrationWarning
            className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs uppercase shadow shrink-0"
          >
            {email ? email.charAt(0) : "U"}
          </div>
          {!collapsed && (
            <div className="min-w-0" suppressHydrationWarning>
              <p className="text-xs font-semibold text-white truncate max-w-[100px]" suppressHydrationWarning>
                {email ? email.split("@")[0] : "Operator"}
              </p>
              <div className="flex items-center gap-1">
                <Shield className="w-2.5 h-2.5 text-cyan-400" />
                <span className="text-[10px] text-cyan-400 font-medium" suppressHydrationWarning>
                  {role}
                </span>
              </div>
            </div>
          )}
        </div>

          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
