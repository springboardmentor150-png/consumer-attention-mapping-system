"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getStores,
  getShelves,
  createShelf,
  deleteShelf,
  getAttractivenessScores,
  getShelfGridHeatmap,
  getExportExcelUrl,
  getExportCsvUrl,
  ShelfAttractivenessItem,
  GridHeatmapData,
} from "@/lib/api";
import { AttractivenessScoreCard } from "@/components/AttractivenessScoreCard";
import { ShelfGridHeatmap } from "@/components/ShelfGridHeatmap";
import {
  Grid3X3,
  Plus,
  Store,
  Video,
  Clock,
  TrendingUp,
  Search,
  Sparkles,
  ArrowRight,
  Eye,
  Layers,
  Trophy,
  Flame,
  Award,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Trash2,
  FileSpreadsheet,
  FileText,
  Download,
  MapPin,
  Building2,
} from "lucide-react";

type StoreItem = {
  id: number;
  name: string;
  location: string;
};

export default function ShelvesManagerPage() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | "all">("all");
  const [shelvesRankings, setShelvesRankings] = useState<ShelfAttractivenessItem[]>([]);
  const [gridHeatmapData, setGridHeatmapData] = useState<GridHeatmapData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<"ranking" | "grid" | "cards">("ranking");

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newShelfStoreId, setNewShelfStoreId] = useState<number>(1);
  const [newShelfName, setNewShelfName] = useState("");
  const [newZoneCoords, setNewZoneCoords] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [selectedShelfForModal, setSelectedShelfForModal] = useState<ShelfAttractivenessItem | null>(null);

  // Load stores list
  useEffect(() => {
    async function loadStoresList() {
      try {
        const token = localStorage.getItem("token") || "";
        const fetchedStores = await getStores(token);
        if (Array.isArray(fetchedStores) && fetchedStores.length > 0) {
          setStores(fetchedStores);
          if (fetchedStores.length > 0 && !newShelfStoreId) {
            setNewShelfStoreId(fetchedStores[0].id);
          }
        }
      } catch (err) {
        console.warn("Could not load stores:", err);
      }
    }
    loadStoresList();
  }, []);

  // Load attractiveness data & heatmap based on selected store filter
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const storeFilter = selectedStoreId === "all" ? undefined : selectedStoreId;
        const [scoresRes, heatmapRes] = await Promise.all([
          getAttractivenessScores(storeFilter).catch(() => null),
          getShelfGridHeatmap(5, 8, undefined, storeFilter).catch(() => null),
        ]);

        if (scoresRes?.rankings) {
          setShelvesRankings(scoresRes.rankings);
        } else {
          setShelvesRankings([]);
        }

        if (heatmapRes) {
          setGridHeatmapData(heatmapRes);
        }
      } catch (err) {
        console.warn("Error loading shelf analytics from PostgreSQL:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [selectedStoreId]);

  async function handleCreateShelf(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);

    const token = localStorage.getItem("token") || "";

    try {
      await createShelf(newShelfStoreId, newShelfName, newZoneCoords, token);
      const storeFilter = selectedStoreId === "all" ? undefined : selectedStoreId;
      const updatedScores = await getAttractivenessScores(storeFilter);
      if (updatedScores?.rankings) {
        setShelvesRankings(updatedScores.rankings);
      }
      setShowAddModal(false);
      setNewShelfName("");
      setNewZoneCoords("");
    } catch (err) {
      console.error(err);
      setError("Failed to register shelf zone.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteShelf(shelfId: number, shelfName: string) {
    if (!confirm(`Are you sure you want to delete "${shelfName}" (Shelf #${shelfId}) from PostgreSQL? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token") || "";
      await deleteShelf(shelfId, token);
      setShelvesRankings((prev) => prev.filter((s) => s.shelf_id !== shelfId));
    } catch (err) {
      console.error("Failed to delete shelf:", err);
      alert("Failed to delete shelf from database.");
    }
  }

  const filtered = shelvesRankings.filter((s) =>
    s.shelf_name.toLowerCase().includes(search.toLowerCase())
  );

  // Group shelves by store
  const storeGroups = stores.map((st) => {
    const storeShelves = filtered.filter((s) => (s.store_id || 1) === st.id);
    const avgScore =
      storeShelves.length > 0
        ? Math.round(
            (storeShelves.reduce((acc, curr) => acc + curr.attractiveness_score, 0) /
              storeShelves.length) *
              10
          ) / 10
        : 0;

    return {
      store: st,
      shelves: storeShelves,
      avgScore,
    };
  }).filter((grp) => selectedStoreId === "all" || grp.store.id === selectedStoreId);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs font-semibold uppercase tracking-wider text-cyan-400">
            <Trophy className="w-4 h-4" />
            <span>Store-by-Store Attractiveness Matrix</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-heading">
            Shelf Attractiveness Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Store-specific dwell time estimation, 5-metric weighted scoring, and 5×8 attention heatmap directly from PostgreSQL.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={getExportExcelUrl(selectedStoreId === "all" ? undefined : selectedStoreId)}
            download="shelf_engagement_report.xlsx"
            className="px-3.5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export Excel (.xlsx)</span>
          </a>

          <a
            href={getExportCsvUrl(selectedStoreId === "all" ? undefined : selectedStoreId)}
            download="shelf_engagement_report.csv"
            className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Shelf Zone</span>
          </button>
        </div>
      </div>

      {/* Store Filter Selector Bar */}
      <div className="p-4 rounded-3xl glass-card border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 block">
              Active Store Filter
            </span>
            <span className="text-xs font-bold text-white">
              {selectedStoreId === "all"
                ? `Network View (${stores.length} Retail Stores)`
                : stores.find((s) => s.id === selectedStoreId)?.name || `Store #${selectedStoreId}`}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedStoreId("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              selectedStoreId === "all"
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm"
                : "bg-white/[0.02] text-slate-400 border-white/5 hover:border-white/10"
            }`}
          >
            All Stores ({stores.length})
          </button>

          {stores.map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStoreId(st.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedStoreId === st.id
                  ? "bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-white border-cyan-400 shadow-sm"
                  : "bg-white/[0.02] text-slate-400 border-white/5 hover:border-white/10"
              }`}
            >
              <Store className="w-3.5 h-3.5 text-cyan-400" />
              <span>Store #{st.id}: {st.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Formula & Weight Benchmark Banner */}
      <div className="p-5 rounded-3xl glass-panel-glow border border-cyan-500/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white uppercase font-mono tracking-wide">
              Weighted Attractiveness Formula
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            Normalized 0–100 Scale (35/25/20/15/5)
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-5 text-xs">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
            <span className="text-[10px] font-mono text-cyan-300 uppercase block">Attention Time</span>
            <span className="text-base font-extrabold text-white font-mono block mt-0.5">35%</span>
            <span className="text-[10px] text-slate-400">0.35 × Dwell Duration</span>
          </div>

          <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
            <span className="text-[10px] font-mono text-purple-300 uppercase block">Interaction Freq</span>
            <span className="text-base font-extrabold text-white font-mono block mt-0.5">25%</span>
            <span className="text-[10px] text-slate-400">0.25 × Touch Frequency</span>
          </div>

          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <span className="text-[10px] font-mono text-blue-300 uppercase block">Pickup Rate</span>
            <span className="text-base font-extrabold text-white font-mono block mt-0.5">20%</span>
            <span className="text-[10px] text-slate-400">0.20 × Physical Lift Ratio</span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] font-mono text-emerald-300 uppercase block">Conversion Rate</span>
            <span className="text-base font-extrabold text-white font-mono block mt-0.5">15%</span>
            <span className="text-[10px] text-slate-400">0.15 × High-Intent Sessions</span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-[10px] font-mono text-amber-300 uppercase block">Repeat Engagement</span>
            <span className="text-base font-extrabold text-white font-mono block mt-0.5">5%</span>
            <span className="text-[10px] text-slate-400">0.05 × Return Shopper Rate</span>
          </div>
        </div>
      </div>

      {/* View Switcher & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/[0.03] border border-white/10 w-fit">
          <button
            onClick={() => setViewMode("ranking")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === "ranking"
                ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Store League Ranking</span>
          </button>

          <button
            onClick={() => setViewMode("cards")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === "cards"
                ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/40 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>5-Metric Score Cards</span>
          </button>

          <button
            onClick={() => setViewMode("grid")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === "grid"
                ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5 text-amber-400" />
            <span>5×8 Shelf Attention Grid</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shelves by title..."
            className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* VIEW 1: STORE-BY-STORE RANKINGS LEAGUE TABLE */}
      {viewMode === "ranking" && (
        <div className="space-y-8">
          {storeGroups.map(({ store, shelves: groupShelves, avgScore }) => (
            <div
              key={store.id}
              className="rounded-3xl glass-card p-6 border border-white/10 space-y-5"
            >
              {/* Store Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        STORE #{store.id.toString().padStart(2, "0")}
                      </span>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {store.name}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{store.location || "Store Location"} • {groupShelves.length} Monitored Shelves • Avg Score: <strong className="text-cyan-300 font-mono">{avgScore}/100</strong></span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={getExportExcelUrl(store.id)}
                    download={`store_${store.id}_shelves_report.xlsx`}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    title={`Export ${store.name} to Excel`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Store (.xlsx)</span>
                  </a>

                  <a
                    href={getExportCsvUrl(store.id)}
                    download={`store_${store.id}_shelves_report.csv`}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    title={`Export ${store.name} to CSV`}
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Store (.csv)</span>
                  </a>

                  <Link
                    href={`/stores/${store.id}`}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1 transition-all"
                  >
                    <span>Store Map</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Table for this store */}
              {groupShelves.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 font-mono">
                  No shelves registered for {store.name} yet. Click &quot;Register Shelf Zone&quot; to add one.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 font-mono">
                        <th className="pb-3 pr-4 uppercase">Rank</th>
                        <th className="pb-3 pr-4 uppercase">Shelf Zone Name</th>
                        <th className="pb-3 pr-4 uppercase">Attractiveness Score</th>
                        <th className="pb-3 pr-4 uppercase">Attention (35%)</th>
                        <th className="pb-3 pr-4 uppercase">Interaction (25%)</th>
                        <th className="pb-3 pr-4 uppercase">Pickup (20%)</th>
                        <th className="pb-3 pr-4 uppercase">Conversion (15%)</th>
                        <th className="pb-3 pr-4 uppercase">Repeat (5%)</th>
                        <th className="pb-3 pr-4 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
                      {groupShelves.map((item) => (
                        <tr key={item.shelf_id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 pr-4">
                            <span
                              className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                                item.rank === 1
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                                  : item.rank === 2
                                  ? "bg-slate-300/20 text-slate-200 border border-slate-300/40"
                                  : item.rank === 3
                                  ? "bg-amber-700/20 text-amber-500 border border-amber-700/40"
                                  : "bg-white/5 text-slate-400 border border-white/10"
                              }`}
                            >
                              #{item.rank}
                            </span>
                          </td>

                          <td className="py-4 pr-4 font-sans font-semibold text-white">
                            <span className="block">{item.shelf_name}</span>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-[10px] font-mono text-slate-500 font-normal">
                                ID: #{item.shelf_id}
                              </span>
                              {item.recommendations && item.recommendations.length > 0 && (
                                <span className="text-[10px] font-sans px-2 py-0.5 rounded-md bg-white/[0.04] text-cyan-300 border border-cyan-500/20 truncate max-w-[260px]">
                                  💡 {item.recommendations[0]}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-black text-white font-mono bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
                                {item.attractiveness_score}
                              </span>
                              <div className="w-16 bg-white/10 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"
                                  style={{ width: `${Math.min(100, item.attractiveness_score)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-4 pr-4 text-cyan-300 font-semibold">
                            {item.attention_duration_seconds}s
                            <span className="text-[10px] text-slate-500 block font-normal">
                              +{item.metric_breakdown?.attention_duration?.points_contributed || 0} pts
                            </span>
                          </td>

                          <td className="py-4 pr-4 text-purple-300 font-semibold">
                            {item.interaction_count} visits
                            <span className="text-[10px] text-slate-500 block font-normal">
                              +{item.metric_breakdown?.interaction_frequency?.points_contributed || 0} pts
                            </span>
                          </td>

                          <td className="py-4 pr-4 text-blue-300">
                            {Math.round(item.pickup_rate * 100)}%
                            <span className="text-[10px] text-slate-500 block font-normal">
                              +{item.metric_breakdown?.pickup_rate?.points_contributed || 0} pts
                            </span>
                          </td>

                          <td className="py-4 pr-4 text-emerald-300">
                            {Math.round(item.purchase_conversion_rate * 100)}%
                            <span className="text-[10px] text-slate-500 block font-normal">
                              +{item.metric_breakdown?.purchase_conversion?.points_contributed || 0} pts
                            </span>
                          </td>

                          <td className="py-4 pr-4 text-amber-300">
                            {Math.round(item.repeat_engagement_rate * 100)}%
                            <span className="text-[10px] text-slate-500 block font-normal">
                              +{item.metric_breakdown?.repeat_engagement?.points_contributed || 0} pts
                            </span>
                          </td>

                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedShelfForModal(item)}
                                className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[11px] font-sans font-semibold transition-all cursor-pointer"
                              >
                                View Breakdown
                              </button>

                              <button
                                onClick={() => {
                                  const headers = [
                                    "Rank",
                                    "Shelf ID",
                                    "Shelf Name",
                                    "Store ID",
                                    "Store Name",
                                    "Attractiveness Score",
                                    "Attention Duration (s)",
                                    "Interaction Count",
                                    "Unique Visitors",
                                    "Pickup Rate (%)",
                                    "Conversion Rate (%)",
                                    "Repeat Rate (%)",
                                    "Key Recommendations",
                                  ];
                                  const row = [
                                    item.rank,
                                    item.shelf_id,
                                    `"${item.shelf_name.replace(/"/g, '""')}"`,
                                    store.id,
                                    `"${store.name.replace(/"/g, '""')}"`,
                                    item.attractiveness_score,
                                    item.attention_duration_seconds,
                                    item.interaction_count,
                                    item.unique_visitors,
                                    Math.round(item.pickup_rate * 1000) / 10,
                                    Math.round(item.purchase_conversion_rate * 1000) / 10,
                                    Math.round(item.repeat_engagement_rate * 1000) / 10,
                                    `"${(item.recommendations || []).join(' | ').replace(/"/g, '""')}"`,
                                  ];
                                  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), row.join(",")].join("\n");
                                  const encodedUri = encodeURI(csvContent);
                                  const link = document.createElement("a");
                                  link.setAttribute("href", encodedUri);
                                  link.setAttribute("download", `shelf_${item.shelf_id}_analytics.csv`);
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                                className="p-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 transition-all cursor-pointer"
                                title={`Export data for ${item.shelf_name} (.csv)`}
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteShelf(item.shelf_id, item.shelf_name)}
                                className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 transition-all cursor-pointer"
                                title={`Delete ${item.shelf_name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: STORE-BY-STORE 5-METRIC SCORE CARDS */}
      {viewMode === "cards" && (
        <div className="space-y-8">
          {storeGroups.map(({ store, shelves: groupShelves }) => (
            <div key={store.id} className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                <Store className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase font-mono">
                  Store #{store.id}: {store.name} ({groupShelves.length} Shelves)
                </h3>
              </div>

              {groupShelves.length === 0 ? (
                <div className="p-8 rounded-2xl glass-card border border-white/5 text-center text-xs text-slate-500">
                  No shelves mapped for {store.name}.
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {groupShelves.map((item) => (
                    <AttractivenessScoreCard key={item.shelf_id} shelf={item} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* VIEW 3: 5x8 SHELF ATTENTION GRID */}
      {viewMode === "grid" && (
        <ShelfGridHeatmap data={gridHeatmapData} loading={loading} />
      )}

      {/* Breakdown Modal */}
      {selectedShelfForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl glass-panel-glow border border-white/10 p-6 sm:p-8 shadow-2xl relative space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {selectedShelfForModal.shelf_name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Shelf ID #{selectedShelfForModal.shelf_id} • Rank #{selectedShelfForModal.rank}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedShelfForModal(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <AttractivenessScoreCard shelf={selectedShelfForModal} rankBadge={false} />

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedShelfForModal(null)}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all cursor-pointer"
              >
                Close Analytical Breakdown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Shelf Glass Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl glass-panel-glow border border-white/10 p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Grid3X3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Register Shelf Zone
                  </h3>
                  <p className="text-xs text-slate-400">
                    Add a physical shelf ROI for real-time tracking
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateShelf} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Target Store
                </label>
                <select
                  value={newShelfStoreId}
                  onChange={(e) => setNewShelfStoreId(parseInt(e.target.value, 10))}
                  className="w-full px-4 py-3 rounded-xl glass-input text-xs text-white bg-slate-900 border border-white/10"
                >
                  {stores.map((st) => (
                    <option key={st.id} value={st.id} className="bg-slate-900 text-white">
                      Store #{st.id} - {st.name} ({st.location || "Store Location"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Shelf Zone Name
                </label>
                <input
                  type="text"
                  required
                  value={newShelfName}
                  onChange={(e) => setNewShelfName(e.target.value)}
                  placeholder="e.g. Shelf D1 - Organic Snacks"
                  className="w-full px-4 py-3 rounded-xl glass-input text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Zone Coordinates (Bounding Box)
                </label>
                <input
                  type="text"
                  value={newZoneCoords}
                  onChange={(e) => setNewZoneCoords(e.target.value)}
                  placeholder="e.g. x1,y1,x2,y2 (optional)"
                  className="w-full px-4 py-3 rounded-xl glass-input text-xs text-white font-mono"
                />
              </div>

              {error && (
                <div className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-xs font-bold text-white shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
                >
                  {creating ? "Registering..." : "Save Shelf Zone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
