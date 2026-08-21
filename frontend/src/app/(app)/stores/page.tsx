"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStores, createStore, deleteStore, getShelves } from "@/lib/api";
import {
  Store,
  Plus,
  Search,
  MapPin,
  Video,
  Grid3X3,
  TrendingUp,
  Activity,
  Radio,
  ArrowRight,
  Filter,
  Layers,
  Sparkles,
  Trash2,
} from "lucide-react";

type StoreItem = {
  id: number;
  name: string;
  location: string;
  cameras?: number;
  shelves?: number;
  attentionScore?: number;
  footfall?: number;
  status?: "Live" | "Calibrating" | "Maintenance";
};

export default function StoresPage() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreLocation, setNewStoreLocation] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStores() {
      try {
        const token = localStorage.getItem("token") || "";
        const fetchedStores = await getStores(token);
        if (Array.isArray(fetchedStores)) {
          const mapped = fetchedStores.map((s: any, idx: number) => ({
            id: s.id,
            name: s.name,
            location: s.location || "Store Location",
            cameras: 4,
            shelves: s.shelves?.length || 4,
            attentionScore: 85,
            footfall: 120,
            status: "Live" as const,
          }));
          setStores(mapped);
        }
      } catch (err) {
        console.warn("Error loading stores from database:", err);
      }
    }
    loadStores();
    const interval = setInterval(loadStores, 4000);
    return () => clearInterval(interval);
  }, []);

  async function handleCreateStore(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);

    const token = localStorage.getItem("token") || "";

    try {
      const result = await createStore(newStoreName, newStoreLocation, token);
      const newId = result?.id || stores.length + 1;

      const newEntry: StoreItem = {
        id: newId,
        name: newStoreName,
        location: newStoreLocation,
        cameras: 3,
        shelves: 4,
        attentionScore: 80,
        footfall: 500,
        status: "Live",
      };

      setStores([newEntry, ...stores]);
      setShowAddModal(false);
      setNewStoreName("");
      setNewStoreLocation("");
    } catch (err) {
      console.error(err);
      setError("Failed to create store.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteStore(storeId: number, storeTitle: string) {
    if (!confirm(`Are you sure you want to delete "${storeTitle}" (Store #${storeId}) from PostgreSQL? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token") || "";
      await deleteStore(storeId, token);
      setStores((prev) => prev.filter((s) => s.id !== storeId));
      localStorage.removeItem(`cams_store_layout_shelves_${storeId}`);
      localStorage.removeItem(`cams_store_layout_cameras_${storeId}`);
      localStorage.removeItem(`cams_store_layout_landmarks_${storeId}`);
    } catch (err) {
      console.error("Failed to delete store:", err);
      alert("Failed to delete store from database.");
    }
  }

  const filteredStores = stores.filter((store) => {
    const matchesSearch =
      store.name.toLowerCase().includes(search.toLowerCase()) ||
      store.location.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs font-semibold uppercase tracking-wider text-cyan-400">
            <Store className="w-4 h-4" />
            <span>Retail Network</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-heading">
            Store Locations & Spatial Maps
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor and configure computer vision shelf mapping across retail stores
          </p>
        </div>

        <button
          onClick={() => {
            setNewStoreName("");
            setNewStoreLocation("");
            setError("");
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Store</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stores by name, city, or mall zone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {["All", "Live Only"].map((f) => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                filterStatus === f
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                  : "bg-white/[0.03] text-slate-400 border-white/5 hover:border-white/10"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stores Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredStores.map((store) => (
          <div
            key={store.id}
            className="rounded-3xl glass-card p-6 border border-white/10 hover:border-cyan-500/40 flex flex-col justify-between relative overflow-hidden group transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                  STORE #{store.id.toString().padStart(2, "0")}
                </span>

                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {store.status || "Live"}
                  </span>

                  <button
                    onClick={() => handleDeleteStore(store.id, store.name)}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 transition-all cursor-pointer"
                    title={`Delete Store #${store.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-cyan-300 transition-colors">
                {store.name}
              </h3>

              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{store.location}</span>
              </p>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-white/5 text-center">
                <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                    Cameras
                  </span>
                  <span className="text-sm font-bold text-white font-mono flex items-center justify-center gap-1 mt-0.5">
                    <Video className="w-3 h-3 text-cyan-400" />
                    {store.cameras}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                    Shelves
                  </span>
                  <span className="text-sm font-bold text-white font-mono flex items-center justify-center gap-1 mt-0.5">
                    <Grid3X3 className="w-3 h-3 text-purple-400" />
                    {store.shelves}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                    Attention
                  </span>
                  <span className="text-sm font-bold text-emerald-400 font-mono flex items-center justify-center gap-1 mt-0.5">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    {store.attentionScore}%
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-2">
              <Link
                href={`/stores/${store.id}`}
                onClick={() => {
                  localStorage.setItem("current_store_id", String(store.id));
                  localStorage.setItem("current_store_name", store.name);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500/15 via-purple-500/15 to-cyan-500/15 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-500/30 hover:border-cyan-400 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Open Store Map &amp; Shelves</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Store Glass Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl glass-panel-glow border border-white/10 p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Create Retail Store
                  </h3>
                  <p className="text-xs text-slate-400">
                    Add a store node for CV camera integration
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateStore} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Store Name
                </label>
                <input
                  type="text"
                  required
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="e.g. North Galleria Mall - Store #4"
                  className="w-full px-4 py-3 rounded-xl glass-input text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Physical Address / Floor
                </label>
                <input
                  type="text"
                  required
                  value={newStoreLocation}
                  onChange={(e) => setNewStoreLocation(e.target.value)}
                  placeholder="e.g. Level 2, Section B, Bay 104"
                  className="w-full px-4 py-3 rounded-xl glass-input text-xs text-white"
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
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
                >
                  {creating ? "Adding..." : "Save Store Node"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
