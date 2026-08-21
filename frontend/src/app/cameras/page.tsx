"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { Navbar } from "../../components/layout/Navbar";
import { Sidebar } from "../../components/layout/Sidebar";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { ROUTES } from "../../utils/constants";
import api from "../../services/api";

interface Camera {
  id: string;
  name: string;
  rtsp_url: string;
  location_description: string;
  status: string;
  store_id: string;
  is_active: boolean;
  created_at: string;
}

interface CameraForm {
  name: string;
  rtsp_url: string;
  location_description: string;
  store_id: string;
  camera_type: string;
  ip_address: string;
  resolution: string;
}

interface Store { id: string; name: string; }

const emptyForm: CameraForm = { name: "", rtsp_url: "", location_description: "", store_id: "", camera_type: "IP", ip_address: "127.0.0.1", resolution: "1080p" };

const STATUS_COLORS: Record<string, { bg: string; border: string; color: string; dot: string }> = {
  online:      { bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.25)",  color: "#34d399", dot: "#10b981" },
  offline:     { bg: "rgba(244,63,94,0.08)",   border: "rgba(244,63,94,0.25)",   color: "#fb7185", dot: "#f43f5e" },
  maintenance: { bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)",  color: "#fbbf24", dot: "#f59e0b" },
};

export default function CamerasPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CameraForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !isAuthenticated) router.replace(ROUTES.AUTH);
  }, [mounted, authLoading, isAuthenticated, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [camRes, storeRes] = await Promise.all([
        api.get("/cameras"),
        api.get("/stores"),
      ]);
      setCameras(camRes.data || []);
      setStores(storeRes.data || []);
    } catch {
      setCameras([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Camera name is required"); return; }
    if (!form.rtsp_url.trim()) { setError("Stream URL is required"); return; }
    if (!form.store_id) { setError("Please select a store first"); return; }
    
    setSubmitting(true); setError("");
    try {
      await api.post("/cameras", form);
      setSuccess("Camera registered successfully!");
      setForm(emptyForm); setShowForm(false);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to register camera");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = cameras.filter(c => {
    const matchSearch = c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.location_description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || c.status === filterStatus || (!c.status && filterStatus === "offline");
    return matchSearch && matchStatus;
  });

  const online      = cameras.filter(c => c.status === "online" || c.is_active).length;
  const offline     = cameras.filter(c => c.status === "offline" || !c.is_active).length;
  const maintenance = cameras.filter(c => c.status === "maintenance").length;

  if (!mounted || authLoading || !isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020817" }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#020817" }}>
      <Navbar />
      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 20, borderBottom: "1px solid rgba(30,45,74,0.6)" }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(135deg,#f0f4ff 0%,#a78bfa 70%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 4 }}>
                Camera Network
              </h1>
              <p style={{ color: "#4a6080", fontSize: 13 }}>Manage and monitor all registered camera feeds</p>
            </div>
            <button
              onClick={() => { setShowForm(!showForm); setError(""); }}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#8b5cf6,#6366f1)", border: "none", borderRadius: 10, padding: "10px 20px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              {showForm ? "Cancel" : "Add Camera"}
            </button>
          </div>

          {success && <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, padding: "12px 16px", color: "#34d399", fontSize: 13 }}>✅ {success}</div>}
          {error   && <div style={{ background: "rgba(244,63,94,0.1)",  border: "1px solid rgba(244,63,94,0.3)",  borderRadius: 10, padding: "12px 16px", color: "#fb7185",  fontSize: 13 }}>⚠️ {error}</div>}

          {/* Add Camera Form */}
          {showForm && (
            <div style={{ background: "rgba(13,21,38,0.9)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 16, padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#e2e8f0", marginBottom: 20 }}>Register New Camera</h2>
              <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  {[
                    { label: "Camera Name *", key: "name", placeholder: "e.g. Entrance Cam 01" },
                    { label: "Stream URL", key: "rtsp_url", placeholder: "e.g. rtsp://192.168.1.10/stream" },
                    { label: "Location", key: "location_description", placeholder: "e.g. Aisle A — North" },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#4a6080", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</label>
                      <input
                        value={(form as any)[key]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                        style={{ width: "100%", background: "rgba(5,15,35,0.8)", border: "1px solid rgba(30,45,74,0.6)", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                  ))}
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#4a6080", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Store</label>
                    <select
                      value={form.store_id}
                      onChange={e => setForm(f => ({ ...f, store_id: e.target.value }))}
                      style={{ width: "100%", background: "rgba(5,15,35,0.8)", border: "1px solid rgba(30,45,74,0.6)", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                    >
                      <option value="">Select store...</option>
                      {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <button
                  type="submit" disabled={submitting}
                  style={{ background: "linear-gradient(135deg,#8b5cf6,#6366f1)", border: "none", borderRadius: 10, padding: "11px 28px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? "Registering..." : "Register Camera"}
                </button>
              </form>
            </div>
          )}

          {/* Status Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            {[
              { label: "Total Cameras",  value: cameras.length, color: "#60a5fa",  grad: "linear-gradient(90deg,#3b82f6,#6366f1)" },
              { label: "Online",         value: online,          color: "#34d399",  grad: "linear-gradient(90deg,#10b981,#06b6d4)" },
              { label: "Offline",        value: offline,         color: "#fb7185",  grad: "linear-gradient(90deg,#f43f5e,#ef4444)" },
              { label: "Maintenance",    value: maintenance,     color: "#fbbf24",  grad: "linear-gradient(90deg,#f59e0b,#f97316)" },
            ].map(stat => (
              <div key={stat.label} style={{ background: "rgba(13,21,38,0.8)", border: "1px solid rgba(30,45,74,0.6)", borderRadius: 14, padding: "20px 22px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: stat.grad }} />
                <div style={{ fontSize: 30, fontWeight: 900, color: stat.color, letterSpacing: "-0.03em" }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: "#8ba3c7", marginTop: 4, fontWeight: 600 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} width="15" height="15" fill="none" stroke="#4a6080" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cameras..." style={{ width: "100%", background: "rgba(13,21,38,0.7)", border: "1px solid rgba(30,45,74,0.5)", borderRadius: 10, padding: "10px 14px 10px 42px", color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            {["all","online","offline","maintenance"].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${filterStatus === s ? "rgba(99,102,241,0.5)" : "rgba(30,45,74,0.5)"}`, background: filterStatus === s ? "rgba(99,102,241,0.15)" : "transparent", color: filterStatus === s ? "#a78bfa" : "#4a6080", fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}>
                {s}
              </button>
            ))}
          </div>

          {/* Camera Grid */}
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><LoadingSpinner size="md" /></div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px", background: "rgba(13,21,38,0.5)", borderRadius: 16, border: "1px dashed rgba(30,45,74,0.5)" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📷</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#8ba3c7", marginBottom: 8 }}>No cameras found</div>
              <div style={{ fontSize: 13, color: "#4a6080" }}>{cameras.length === 0 ? 'Click "Add Camera" to register your first camera' : "No cameras match your filter"}</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {filtered.map((cam, i) => {
                const status = cam.status || (cam.is_active ? "online" : "offline");
                const c = STATUS_COLORS[status] || STATUS_COLORS.offline;
                return (
                  <div key={cam.id} style={{ background: "rgba(13,21,38,0.8)", border: `1px solid ${c.border}`, borderRadius: 14, padding: 20, position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: c.dot }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div style={{ background: "rgba(5,15,35,0.8)", border: "1px solid rgba(30,45,74,0.6)", borderRadius: 10, padding: 10 }}>
                        <svg width="20" height="20" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                        {status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#e2e8f0", marginBottom: 6 }}>{cam.name}</div>
                    <div style={{ fontSize: 11, color: "#4a6080", marginBottom: 4 }}>📍 {cam.location_description || "Location not set"}</div>
                    {cam.rtsp_url && <div style={{ fontSize: 10, color: "#2a3f60", fontFamily: "monospace", marginBottom: 10, wordBreak: "break-all" }}>{cam.rtsp_url.slice(0, 40)}{cam.rtsp_url.length > 40 ? "..." : ""}</div>}
                    <div style={{ fontSize: 10, color: "#2a3f60" }}>ID: {cam.id?.slice(0, 12)}...</div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
