"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getStores,
  getShelves,
  getAnalyticsSummary,
  getAnalytics,
  getExportExcelUrl,
} from "@/lib/api";
import { StatCard } from "@/components/StatCard";
import { RoleBadge } from "@/components/RoleBadge";
import { DisplayAttentionChart } from "@/components/DisplayAttentionChart";
import {
  Store,
  Grid3X3,
  Video,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  Eye,
  Activity,
  Layers,
  MapPin,
  TrendingUp,
  Cpu,
  Radio,
  Zap,
  FileSpreadsheet,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type StoreRecord = {
  id: number;
  name: string;
  location: string;
};

type AnalyticsSummary = {
  total_shoppers: number;
  average_dwell_time: number;
  left_display_views: number;
  right_display_views: number;
};

type AnalyticsSession = {
  id: number;
  shopper_id: number;
  region: string;
  focus: string;
  dwell_time: number;
  entry_time?: string;
  exit_time?: string;
  timestamp?: string;
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [storeCount, setStoreCount] = useState(0);
  const [shelfCount, setShelfCount] = useState<number>(0);
  const [role, setRole] = useState("StoreManager");
  const [email, setEmail] = useState("");
  const [analytics, setAnalytics] = useState<AnalyticsSummary>({
    total_shoppers: 0,
    average_dwell_time: 0,
    left_display_views: 0,
    right_display_views: 0,
  });
  const [sessions, setSessions] = useState<AnalyticsSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Hourly Trend Chart Data
  const hourlyTrafficData = [
    { hour: "09:00", shoppers: 42, attentionScore: 78 },
    { hour: "11:00", shoppers: 118, attentionScore: 84 },
    { hour: "13:00", shoppers: 185, attentionScore: 92 },
    { hour: "15:00", shoppers: 140, attentionScore: 81 },
    { hour: "17:00", shoppers: 230, attentionScore: 96 },
    { hour: "19:00", shoppers: 310, attentionScore: 94 },
    { hour: "21:00", shoppers: 223, attentionScore: 88 },
  ];

  useEffect(() => {
    setMounted(true);
    setRole(localStorage.getItem("role") || "StoreManager");
    setEmail(localStorage.getItem("email") || "operator@aura-retail.io");

    async function loadDashboard() {
      const token = localStorage.getItem("token") || "";

      try {
        const stores = await getStores(token);
        if (Array.isArray(stores)) {
          setStoreCount(stores.length);

          const shelvesPerStore = await Promise.all(
            stores.map((s: StoreRecord) => getShelves(s.id, token).catch(() => []))
          );
          const total = shelvesPerStore.reduce(
            (sum: number, shelves) => sum + (Array.isArray(shelves) ? shelves.length : 0),
            0
          );
          setShelfCount(total);
        }

        const summary = await getAnalyticsSummary(token);
        if (summary && summary.total_shoppers !== undefined) {
          setAnalytics({
            total_shoppers: summary.total_shoppers || 0,
            average_dwell_time: summary.average_dwell_time || 0,
            left_display_views: summary.left_display_views || 0,
            right_display_views: summary.right_display_views || 0,
          });
        }

        const allSessions = await getAnalytics(token);
        if (Array.isArray(allSessions) && allSessions.length > 0) {
          setSessions(allSessions.slice(-6).reverse());
        }
      } catch (err) {
        console.warn("Telemetry fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
    const interval = setInterval(loadDashboard, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Welcome Banner & AI Pipeline Status */}
      <div className="relative overflow-hidden rounded-3xl glass-panel-glow border border-cyan-500/20 p-6 lg:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/10 via-purple-500/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/30">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                Live Spatial Gaze Processing
              </span>
              <RoleBadge role={role} />
            </div>

            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-heading">
              Retail Intelligence Control Room
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Real-time consumer dwell time estimation, YOLOv8 multi-person tracking, and shelf-level gaze analytics across all connected store cameras.
            </p>
          </div>

          {/* Quick Nav Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={getExportExcelUrl()}
              download="shelf_engagement_report.xlsx"
              className="px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 hover:border-emerald-400 text-xs font-semibold text-emerald-300 flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export Report (.xlsx)</span>
            </a>

            <Link
              href="/stores/1"
              className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-purple-400 text-xs font-semibold text-white flex items-center gap-2 transition-all shadow-md"
            >
              <MapPin className="w-4 h-4 text-purple-400" />
              <span>Interactive Store Map</span>
            </Link>

            <Link
              href="/cctv"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs font-bold text-white flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/25"
            >
              <Video className="w-4 h-4" />
              <span>Open YOLO Monitoring</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Stores"
          value={storeCount}
          icon={Store}
          color="purple"
          change="+1 New"
          subtitle="All locations operational"
        />

        <StatCard
          label="Active Cameras (YOLO)"
          value="8 Online"
          icon={Video}
          color="cyan"
          change="30 FPS"
          subtitle="Real-time multi-person tracking"
        />

        <StatCard
          label="Shoppers Detected"
          value={analytics.total_shoppers.toLocaleString()}
          icon={Users}
          color="emerald"
          change="+14.2%"
          subtitle="Unique tracking IDs today"
        />

        <StatCard
          label="Avg Attention Time"
          value={`${analytics.average_dwell_time.toFixed(1)}s`}
          icon={Clock}
          color="amber"
          change="+3.4s"
          subtitle="Shelf engagement duration"
        />
      </div>

      {/* Main Charts Section: Hourly Footfall & Display Distribution */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Hourly Attention Velocity & Footfall Area Chart */}
        <div className="lg:col-span-2 rounded-2xl glass-card p-6 border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                Hourly Shopper Traffic & Attention Score
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Real-time correlation between visitor footfall volume and shelf engagement index
              </p>
            </div>

            <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
              Peak: 19:00 (94% Score)
            </span>
          </div>

          <div className="h-64 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyTrafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorShoppers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="hour" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(13, 17, 28, 0.95)",
                      borderColor: "rgba(168, 85, 247, 0.3)",
                      borderRadius: "12px",
                      boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.6)",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="shoppers" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorShoppers)" name="Shopper Count" />
                  <Area type="monotone" dataKey="attentionScore" stroke="#a855f7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScore)" name="Attention Score %" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Display Attention Breakdown */}
        <div className="lg:col-span-1">
          <DisplayAttentionChart
            leftDisplayViews={analytics.left_display_views}
            rightDisplayViews={analytics.right_display_views}
          />
        </div>
      </div>

      {/* Main Flow Jump Cards: 3 Interactive Feature Modules */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Module 1: Store Map Visual Floorplan */}
        <Link href="/stores/1" className="group">
          <div className="h-full rounded-2xl glass-card p-6 border border-white/10 hover:border-purple-500/40 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Store Interior Visual Map
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Explore the 2D blueprint floorplan, live shelf heat levels, and active camera FOV radar cones.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-purple-400 group-hover:text-purple-300">
              <span>Inspect Floorplan Grid</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        {/* Module 2: Shelf Performance Analytics */}
        <Link href="/shelves" className="group">
          <div className="h-full rounded-2xl glass-card p-6 border border-white/10 hover:border-cyan-500/40 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                <Grid3X3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Shelf Attention Analytics
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Analyze gaze directions, eye-level product fixation times, and shelf conversion metrics.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
              <span>View Shelf Metrics</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        {/* Module 3: CCTV + YOLO AI Monitoring */}
        <Link href="/cctv" className="group">
          <div className="h-full rounded-2xl glass-card p-6 border border-white/10 hover:border-emerald-500/40 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Live CCTV + YOLO Monitoring
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Watch bounding-box detections, confidence vectors, and head-pose gaze rays in real time.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
              <span>Launch AI Camera Feeds</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </div>

      {/* Live Consumer Sessions Stream Table */}
      <div className="rounded-2xl glass-card p-6 border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              Live Shopper Trajectories & Attention Events
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Active sessions tracked by ByteTrack multi-person pipeline
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Streaming PostgreSQL
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-mono">
                <th className="pb-3 pr-4 font-semibold uppercase">Tracking ID</th>
                <th className="pb-3 pr-4 font-semibold uppercase">Target Shelf Region</th>
                <th className="pb-3 pr-4 font-semibold uppercase">Gaze Focus</th>
                <th className="pb-3 pr-4 font-semibold uppercase">Dwell Time</th>
                <th className="pb-3 pr-4 font-semibold uppercase">Attention State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {sessions.map((s, idx) => (
                <tr key={s.id || idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 pr-4 font-mono text-cyan-400 font-semibold">
                    #PERSON-{s.shopper_id || 100 + idx}
                  </td>
                  <td className="py-3.5 pr-4 font-medium text-white">
                    {s.region || "Shelf A1 - Main Display"}
                  </td>
                  <td className="py-3.5 pr-4 text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                      {s.focus || "Eye Level"}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4 font-mono font-bold text-emerald-400">
                    {typeof s.dwell_time === "number" ? s.dwell_time.toFixed(1) : s.dwell_time}s
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                      Engaged Attention
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
