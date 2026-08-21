import React, { useState, useEffect } from "react";
import api from "../services/api";
import {
  Video,
  Plus,
  Trash2,
  Edit3,
  Wifi,
  WifiOff,
  MapPin,
  Save,
  X,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export default function CameraManagement() {
  const [cameras, setCameras] = useState([]);
  const [stores, setStores] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    camera_name: "",
    store_id: "",
    zone_id: "",
    location: "",
    status: "Active",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [cams, storesData] = await Promise.all([
        api.getCameras(),
        api.getStores(),
      ]);
      setCameras(cams || []);
      setStores(storesData || []);
    } catch {
      setError("Failed to load camera data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const loadZones = async (storeId) => {
    if (!storeId) { setZones([]); return; }
    try {
      const z = await api.getZones(storeId);
      setZones(z || []);
    } catch {
      setZones([]);
    }
  };

  const handleStoreChange = (storeId) => {
    setForm(prev => ({ ...prev, store_id: storeId, zone_id: "" }));
    loadZones(storeId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.updateCamera(editId, form);
      } else {
        await api.createCamera(form);
      }
      setShowForm(false);
      setEditId(null);
      setForm({ camera_name: "", store_id: "", zone_id: "", location: "", status: "Active" });
      loadData();
    } catch (err) {
      setError(err.message || "Failed to save camera");
    }
  };

  const handleEdit = (cam) => {
    setForm({
      camera_name: cam.camera_name,
      store_id: cam.store_id || "",
      zone_id: cam.zone_id || "",
      location: cam.location || "",
      status: cam.status || "Active",
    });
    setEditId(cam.camera_id);
    if (cam.store_id) loadZones(cam.store_id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this camera?")) return;
    try {
      await api.deleteCamera(id);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const cardStyle = {
    background: "rgba(21,27,44,0.65)",
    backdropFilter: "blur(16px)",
    border: "1px solid #222D44",
    borderRadius: "16px",
    padding: "24px",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #222D44",
    background: "#0B0F19",
    color: "#fff",
    fontSize: "13px",
    outline: "none",
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid rgba(79,172,254,0.2)", borderTop: "3px solid #4FACFE", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <Video size={22} style={{ color: "#4FACFE" }} />
            Camera Management
          </h2>
          <p style={{ fontSize: "13px", color: "#9CA3AF", margin: "4px 0 0" }}>{cameras.length} cameras configured</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={loadData} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid #222D44", color: "#9CA3AF", fontSize: "13px", cursor: "pointer" }}>
            <RefreshCw size={14} />
          </button>
          <button onClick={() => { setShowForm(true); setEditId(null); setForm({ camera_name: "", store_id: "", zone_id: "", location: "", status: "Active" }); }} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "10px", background: "rgba(79,172,254,0.15)", border: "1px solid rgba(79,172,254,0.3)", color: "#4FACFE", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
            <Plus size={14} /> Add Camera
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "14px", borderRadius: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#F87171", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={14} /> {error}
          <button onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", color: "#F87171", cursor: "pointer" }}><X size={14} /></button>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", margin: "0 0 16px" }}>{editId ? "Edit Camera" : "Add New Camera"}</h3>
          <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", marginBottom: "6px", display: "block" }}>Camera Name</label>
              <input style={inputStyle} value={form.camera_name} onChange={e => setForm(f => ({ ...f, camera_name: e.target.value }))} placeholder="e.g. Aisle 1 Camera" required />
            </div>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", marginBottom: "6px", display: "block" }}>Store</label>
              <select style={inputStyle} value={form.store_id} onChange={e => handleStoreChange(e.target.value)} required>
                <option value="">Select Store</option>
                {stores.map(s => <option key={s.store_id} value={s.store_id}>{s.store_name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", marginBottom: "6px", display: "block" }}>Zone (Optional)</label>
              <select style={inputStyle} value={form.zone_id} onChange={e => setForm(f => ({ ...f, zone_id: e.target.value }))}>
                <option value="">No Zone</option>
                {zones.map(z => <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", marginBottom: "6px", display: "block" }}>Location</label>
              <input style={inputStyle} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. North wall, 3m height" />
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} style={{ padding: "8px 16px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid #222D44", color: "#9CA3AF", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
              <button type="submit" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 20px", borderRadius: "10px", background: "rgba(79,172,254,0.15)", border: "1px solid rgba(79,172,254,0.3)", color: "#4FACFE", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                <Save size={14} /> {editId ? "Update" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Camera Grid */}
      {cameras.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", padding: "60px" }}>
          <Video size={48} style={{ color: "#4B5563", marginBottom: "12px" }} />
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>No Cameras Yet</h3>
          <p style={{ fontSize: "13px", color: "#6B7280" }}>Add cameras to start monitoring your retail shelves.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
          {cameras.map(cam => (
            <div key={cam.camera_id} style={{ ...cardStyle, transition: "border-color 0.2s" }} onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(79,172,254,0.3)"} onMouseLeave={e => e.currentTarget.style.borderColor = "#222D44"}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {cam.status === "Active" ? <Wifi size={16} style={{ color: "#39FF14" }} /> : <WifiOff size={16} style={{ color: "#EF4444" }} />}
                  <h4 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", margin: 0 }}>{cam.camera_name}</h4>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={() => handleEdit(cam)} style={{ padding: "6px", borderRadius: "6px", background: "rgba(79,172,254,0.1)", border: "none", color: "#4FACFE", cursor: "pointer" }}><Edit3 size={13} /></button>
                  <button onClick={() => handleDelete(cam.camera_id)} style={{ padding: "6px", borderRadius: "6px", background: "rgba(239,68,68,0.1)", border: "none", color: "#EF4444", cursor: "pointer" }}><Trash2 size={13} /></button>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ fontSize: "12px", color: "#9CA3AF", display: "flex", alignItems: "center", gap: "6px" }}>
                  <MapPin size={11} /> {cam.location || "No location set"}
                </div>
                <div style={{ fontSize: "12px" }}>
                  <span style={{
                    padding: "2px 8px", borderRadius: "4px", fontWeight: 600,
                    background: cam.status === "Active" ? "rgba(57,255,20,0.1)" : "rgba(239,68,68,0.1)",
                    color: cam.status === "Active" ? "#39FF14" : "#EF4444",
                  }}>
                    {cam.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
