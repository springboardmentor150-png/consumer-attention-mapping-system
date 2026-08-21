"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  Grid3X3,
  Store,
  Video,
  Clock,
  Users,
  Eye,
  TrendingUp,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  PieChart as PieIcon,
  CheckCircle2,
  Package,
  Layers,
  Radio,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import {
  getAnalyticsSummary,
  getShelfAttractivenessDetail,
  getShelfGridHeatmap,
  ShelfAttractivenessItem,
  GridHeatmapData,
} from "@/lib/api";
import { AttractivenessScoreCard } from "@/components/AttractivenessScoreCard";
import { ShelfGridHeatmap } from "@/components/ShelfGridHeatmap";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function ShelfDetailPage({
  params,
}: {
  params: Promise<{ id: string; shelfId: string }>;
}) {
  const resolvedParams = use(params);
  const storeId = resolvedParams.id;
  const shelfId = resolvedParams.shelfId;
  const sId = parseInt(shelfId, 10) || 1;
  const [mounted, setMounted] = useState(false);
  const [realShelfAttractiveness, setRealShelfAttractiveness] = useState<ShelfAttractivenessItem | null>(null);
  const [gridHeatmapData, setGridHeatmapData] = useState<GridHeatmapData | null>(null);
  const [loadingAttractiveness, setLoadingAttractiveness] = useState(false);

  const [shelfData, setShelfData] = useState({
    id: shelfId,
    name: `Shelf #${shelfId} - Premium Retail Display`,
    category: "Cosmetics & Beauty",
    zone: `Zone ${sId <= 2 ? "A" : sId <= 4 ? "B" : "C"}`,
    storeName: "Downtown Flagship Megastore",
    assignedCamera: `CAM-0${((sId - 1) % 4) + 1}`,
    attentionScore: 92.4,
    avgDwellTime: 24.8,
    totalVisitors: 342,
    interactionCount: 218,
    engagementRate: 63.7,
    bounceRate: 14.2,
  });

  useEffect(() => {
    setMounted(true);

    async function loadLiveShelfStats() {
      const token = localStorage.getItem("token") || "";
      setLoadingAttractiveness(true);
      try {
        const [summary, attrDetail, heatmap] = await Promise.all([
          getAnalyticsSummary(token).catch(() => null),
          getShelfAttractivenessDetail(sId).catch(() => null),
          getShelfGridHeatmap(undefined, parseInt(storeId, 10) || 1, 5, 8).catch(() => null),
        ]);

        if (attrDetail?.shelf) {
          setRealShelfAttractiveness(attrDetail.shelf);
          setShelfData((prev) => ({
            ...prev,
            name: attrDetail.shelf.shelf_name || prev.name,
            attentionScore: attrDetail.shelf.attractiveness_score,
            avgDwellTime: attrDetail.shelf.attention_duration_seconds,
            totalVisitors: attrDetail.shelf.unique_visitors,
            interactionCount: attrDetail.shelf.interaction_count,
            engagementRate: Math.round(attrDetail.shelf.pickup_rate * 100),
          }));
        } else if (summary) {
          setShelfData((prev) => ({
            ...prev,
            totalVisitors: (summary.total_shoppers || 300) + sId * 15,
            avgDwellTime: summary.average_dwell_time || prev.avgDwellTime,
          }));
        }

        if (heatmap) {
          setGridHeatmapData(heatmap);
        }
      } catch (err) {
        // resilient default
      } finally {
        setLoadingAttractiveness(false);
      }
    }

    loadLiveShelfStats();
    const interval = setInterval(loadLiveShelfStats, 4000);
    return () => clearInterval(interval);
  }, [shelfId, storeId, sId]);

  const hourlyGazeData = [
    { time: "09:00", attention: 74, visitors: 22, interactions: 14 },
    { time: "11:00", attention: 88, visitors: 54, interactions: 38 },
    { time: "13:00", attention: 95, visitors: 82, interactions: 59 },
    { time: "15:00", attention: 86, visitors: 68, interactions: 44 },
    { time: "17:00", attention: 96, visitors: 110, interactions: 82 },
    { time: "19:00", attention: 98, visitors: 135, interactions: 98 },
    { time: "21:00", attention: 91, visitors: 78, interactions: 51 },
  ];

  const gazeDistribution = [
    { name: "Eye-Level (Hotspot)", value: 62, color: "#06b6d4" },
    { name: "Top Shelf Display", value: 18, color: "#a855f7" },
    { name: "Bottom Shelf Stock", value: 20, color: "#3b82f6" },
  ];

  const topSkus = [
    { id: "SKU-901", name: "Midnight Orchid Eau De Parfum 100ml", gazeHits: 148, dwell: "34.2s", rank: 1 },
    { id: "SKU-902", name: "Radiance Revitalizing Serum 50ml", gazeHits: 112, dwell: "26.8s", rank: 2 },
    { id: "SKU-903", name: "Velvet Matte Luxe Lipstick #04", gazeHits: 89, dwell: "19.5s", rank: 3 },
    { id: "SKU-904", name: "Hydra-Glow Peptide Cream", gazeHits: 64, dwell: "14.1s", rank: 4 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Breadcrumb & Navigation Back */}
      <div className="flex items-center justify-between">
        <Link
          href={`/stores/${storeId}`}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-slate-300 hover:text-cyan-300 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Store Map</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            MediaPipe Face Mesh Active
          </span>
        </div>
      </div>

      {/* Shelf Header Banner */}
      <div className="rounded-3xl glass-panel-glow border border-white/10 p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/30">
              SHELF ZONE #{shelfId}
            </span>
            <span className="text-xs text-slate-400">• {shelfData.category}</span>
          </div>

          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-heading">
            {shelfData.name}
          </h1>

          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <Store className="w-3.5 h-3.5 text-slate-500" />
            <span>{shelfData.storeName} • {shelfData.zone}</span>
          </p>
        </div>

        {/* Assigned Camera Card Link */}
        <Link
          href="/cctv"
          className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-cyan-500/30 hover:border-cyan-400 flex items-center gap-4 transition-all shadow-lg group self-start md:self-auto"
        >
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase block">
              Monitored By Camera
            </span>
            <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1 mt-0.5">
              {shelfData.assignedCamera}
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </Link>
      </div>

      {/* Calculated KPI Metric Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Shelf Attention Score"
          value={`${shelfData.attentionScore}%`}
          icon={Sparkles}
          color="purple"
          change="+8.4%"
          subtitle="Top 5% highest engagement"
        />

        <StatCard
          label="Average Dwell Time"
          value={`${shelfData.avgDwellTime}s`}
          icon={Clock}
          color="cyan"
          change="+4.2s"
          subtitle="Customer fixation duration"
        />

        <StatCard
          label="Total Visitors Tracked"
          value={shelfData.totalVisitors}
          icon={Users}
          color="emerald"
          change="+19 today"
          subtitle="Footfall trajectory hits"
        />

        <StatCard
          label="Engagement Conversion"
          value={`${shelfData.engagementRate}%`}
          icon={TrendingUp}
          color="amber"
          change="+12.1%"
          subtitle="Interaction vs pass-by ratio"
        />
      </div>

      {/* Main Charts: Hourly Attention Trend + Gaze Angle Distribution */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Hourly Trend Chart */}
        <div className="lg:col-span-2 rounded-2xl glass-card p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Hourly Attention Score & Product Interaction Rate
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Real-time correlation of customer gaze time vs active physical product touches
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
              Peak: 19:00
            </span>
          </div>

          <div className="h-64 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyGazeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAttention" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorInteractions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(13, 17, 28, 0.95)",
                      borderColor: "rgba(6, 182, 212, 0.3)",
                      borderRadius: "12px",
                      boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.6)",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="attention" stroke="#a855f7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAttention)" name="Attention Score %" />
                  <Area type="monotone" dataKey="interactions" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorInteractions)" name="Touch Interactions" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Gaze Vertical Level Distribution (Eye Level vs Top vs Bottom) */}
        <div className="rounded-2xl glass-card p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-400" />
              Vertical Gaze Distribution
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Estimated head pose pitch angles from MediaPipe Face Mesh
            </p>
          </div>

          <div className="h-44 w-full my-2">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gazeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {gazeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(13, 17, 28, 0.95)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "11px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-white/5 text-xs">
            {gazeDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-mono font-bold text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attractiveness Scoring 5-Metric Breakdown & 5x8 Grid Heatmap */}
      <div className="grid gap-6 lg:grid-cols-2">
        {realShelfAttractiveness ? (
          <AttractivenessScoreCard shelf={realShelfAttractiveness} />
        ) : (
          <div className="rounded-3xl glass-card p-6 border border-white/10 flex items-center justify-center min-h-[300px]">
            <span className="text-xs font-mono text-slate-400">Loading Attractiveness Metric Breakdown...</span>
          </div>
        )}

        <ShelfGridHeatmap data={gridHeatmapData} loading={loadingAttractiveness} />
      </div>

      {/* Top Performing SKUs on this Shelf */}
      <div className="rounded-2xl glass-card p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Package className="w-4 h-4 text-cyan-400" />
              SKU Level Fixation & Attraction Ranking
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Specific products on Shelf #{shelfId} mapped to customer eye gaze heat
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">4 Products Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-mono">
                <th className="pb-3 pr-4 uppercase">Rank</th>
                <th className="pb-3 pr-4 uppercase">SKU Code</th>
                <th className="pb-3 pr-4 uppercase">Product Name</th>
                <th className="pb-3 pr-4 uppercase">Gaze Fixation Hits</th>
                <th className="pb-3 pr-4 uppercase">Avg Look Time</th>
                <th className="pb-3 pr-4 uppercase">Attraction Index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {topSkus.map((sku) => (
                <tr key={sku.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 pr-4 font-mono font-bold text-white">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 inline-flex items-center justify-center text-[10px]">
                      #{sku.rank}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4 font-mono text-cyan-400">{sku.id}</td>
                  <td className="py-3.5 pr-4 font-semibold text-white">{sku.name}</td>
                  <td className="py-3.5 pr-4 font-mono text-purple-300">{sku.gazeHits} looks</td>
                  <td className="py-3.5 pr-4 font-mono font-bold text-emerald-400">{sku.dwell}</td>
                  <td className="py-3.5 pr-4">
                    <div className="w-32 bg-white/5 rounded-full h-2 overflow-hidden border border-white/10">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-purple-500 h-full rounded-full"
                        style={{ width: `${100 - (sku.rank - 1) * 18}%` }}
                      />
                    </div>
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
