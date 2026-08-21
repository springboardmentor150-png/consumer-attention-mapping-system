"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Search,
  Store,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Video,
  ChevronDown,
  Clock,
  Radio,
  MapPin,
} from "lucide-react";
import { getStores } from "@/lib/api";

type StoreData = {
  id: number;
  name: string;
  location: string;
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [stores, setStores] = useState<StoreData[]>([]);
  const [currentStore, setCurrentStore] = useState<StoreData | null>(null);
  const [unreadCount, setUnreadCount] = useState(3);
  const storeDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch real stores from PostgreSQL and synchronize current chosen store
  useEffect(() => {
    async function loadStores() {
      try {
        const token = localStorage.getItem("token") || "";
        const list = await getStores(token);
        if (Array.isArray(list) && list.length > 0) {
          setStores(list);

          // Check if current route has a store ID (e.g. /stores/2 or /stores/1)
          const match = pathname.match(/\/stores\/(\d+)/);
          const pathStoreId = match ? parseInt(match[1], 10) : null;

          if (pathStoreId) {
            const found = list.find((s: StoreData) => s.id === pathStoreId);
            if (found) {
              setCurrentStore(found);
              localStorage.setItem("current_store_id", String(found.id));
              localStorage.setItem("current_store_name", found.name);
              return;
            }
          }

          // Otherwise check localStorage or use first store
          const savedId = localStorage.getItem("current_store_id");
          if (savedId) {
            const foundSaved = list.find((s: StoreData) => s.id === parseInt(savedId, 10));
            if (foundSaved) {
              setCurrentStore(foundSaved);
              return;
            }
          }

          // Default to first available store
          setCurrentStore(list[0]);
          localStorage.setItem("current_store_id", String(list[0].id));
          localStorage.setItem("current_store_name", list[0].name);
        }
      } catch (err) {
        console.warn("Could not fetch stores for header:", err);
      }
    }

    loadStores();
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (storeDropdownRef.current && !storeDropdownRef.current.contains(event.target as Node)) {
        setShowStoreDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectStore = (store: StoreData) => {
    setCurrentStore(store);
    localStorage.setItem("current_store_id", String(store.id));
    localStorage.setItem("current_store_name", store.name);
    setShowStoreDropdown(false);
    if (pathname.startsWith("/stores")) {
      router.push(`/stores/${store.id}`);
    }
  };

  const notifications = [
    {
      id: 1,
      type: "alert",
      title: "High Dwell Surge Detected",
      desc: "Shelf A2 (Cosmetics Endcap) dwell time exceeded 45s avg.",
      time: "2m ago",
      icon: Sparkles,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
    {
      id: 2,
      type: "cctv",
      title: "Camera 03 Calibrated",
      desc: "Gaze vector accuracy updated to 96.4%.",
      time: "10m ago",
      icon: Video,
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    },
    {
      id: 3,
      type: "system",
      title: "Hourly Aggregation Synced",
      desc: "32 shopper trajectories processed into PostgreSQL.",
      time: "25m ago",
      icon: CheckCircle2,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-white/5 bg-[#07090e]/75 backdrop-blur-xl px-6 flex items-center justify-between">
      {/* Left: Dynamic Store Selector & Breadcrumb */}
      <div className="flex items-center gap-4">
        <div className="relative" ref={storeDropdownRef}>
          <button
            onClick={() => setShowStoreDropdown(!showStoreDropdown)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-cyan-500/40 transition-all cursor-pointer text-left"
            title="Click to switch current store"
          >
            <Store className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-white tracking-wide max-w-[200px] truncate">
              {currentStore ? `Store #${currentStore.id} - ${currentStore.name}` : "Store Directory"}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              <Radio className="w-2.5 h-2.5 animate-pulse" /> LIVE
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showStoreDropdown ? "rotate-180" : ""}`} />
          </button>

          {/* Store Switcher Dropdown */}
          {showStoreDropdown && (
            <div className="absolute left-0 mt-2 w-72 rounded-2xl glass-panel-glow border border-white/10 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider border-b border-white/5 flex items-center justify-between">
                <span>Select Active Store</span>
                <span className="text-slate-500">{stores.length} Stores</span>
              </div>
              <div className="mt-1 space-y-1 max-h-60 overflow-y-auto">
                {stores.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectStore(s)}
                    className={`w-full p-2.5 rounded-xl text-left text-xs transition-all flex items-center justify-between ${
                      currentStore?.id === s.id
                        ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold"
                        : "hover:bg-white/[0.05] text-slate-300 hover:text-white"
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{s.name}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-2.5 h-2.5" />
                        <span>{s.location || `Store #${s.id}`}</span>
                      </div>
                    </div>
                    {currentStore?.id === s.id && (
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/20 px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Clock Display */}
        <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-slate-400 px-2.5 py-1 rounded-lg bg-white/[0.02] border border-white/5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{mounted && currentTime ? currentTime : "LIVE"}</span>
        </div>
      </div>

      {/* Right Actions: Search, CCTV Quick Jump, Notifications */}
      <div className="flex items-center gap-3">
        {/* Quick Link to CCTV Monitor */}
        <Link
          href="/cctv"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/20 to-cyan-600/20 border border-purple-500/30 hover:border-cyan-400/50 text-xs font-semibold text-white hover:text-cyan-200 transition-all shadow-sm shadow-cyan-500/10"
        >
          <Video className="w-3.5 h-3.5 text-cyan-400" />
          <span>Live YOLO Stream</span>
        </Link>

        {/* Notifications Flyout */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (showNotifications) setUnreadCount(0);
            }}
            className="relative p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-slate-300 hover:text-white transition-all"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-[10px] font-bold text-white flex items-center justify-center shadow-lg shadow-cyan-500/30">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl glass-panel-glow border border-white/10 p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-sm font-semibold text-white">
                    AI Retail Telemetry
                  </h4>
                </div>
                <span className="text-[11px] text-cyan-400 font-mono">
                  {notifications.length} Alerts
                </span>
              </div>

              <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div
                      key={n.id}
                      className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all flex items-start gap-3"
                    >
                      <div className={`p-2 rounded-lg border shrink-0 ${n.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-white truncate">
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-500">
                            {n.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                          {n.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 pt-2 border-t border-white/10 text-center">
                <Link
                  href="/dashboard"
                  onClick={() => setShowNotifications(false)}
                  className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300"
                >
                  View Attention Stream
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
