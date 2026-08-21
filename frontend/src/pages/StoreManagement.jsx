import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Plus, Trash2, Edit, ChevronDown, ChevronUp, MapPin, Tag, Store } from "lucide-react";

export default function StoreManagement() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Expanded store IDs for zone viewing
  const [expandedStores, setExpandedStores] = useState({});
  const [zones, setZones] = useState({}); // store_id -> array of zones

  // Add store form state
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreLocation, setNewStoreLocation] = useState("");
  const [addingStore, setAddingStore] = useState(false);
  const [editStore, setEditStore] = useState(null); // store being edited

  // Add zone form state
  const [newZoneNames, setNewZoneNames] = useState({}); // store_id -> new zone name string

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  const isAdmin = !user.role || user.role === "Admin";
  const isManagerOrAdmin = !user.role || ["Admin", "Store Manager"].includes(user.role);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const storeList = await api.getStores();
      setStores(storeList || []);
    } catch (err) {
      setError("Failed to load stores: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleAddStore = async (e) => {
    e.preventDefault();
    if (!newStoreName || !newStoreLocation) return;
    try {
      const newSt = await api.createStore({
        store_name: newStoreName,
        location: newStoreLocation
      });
      setStores([...stores, newSt]);
      setNewStoreName("");
      setNewStoreLocation("");
      setAddingStore(false);
    } catch (err) {
      setError(err.message || "Failed to create store.");
    }
  };

  const handleEditStore = async (e) => {
    e.preventDefault();
    if (!editStore.store_name || !editStore.location) return;
    try {
      const updatedSt = await api.updateStore(editStore.store_id, {
        store_name: editStore.store_name,
        location: editStore.location
      });
      setStores(stores.map(s => s.store_id === editStore.store_id ? updatedSt : s));
      setEditStore(null);
    } catch (err) {
      setError(err.message || "Failed to update store.");
    }
  };

  const handleDeleteStore = async (storeId) => {
    if (!window.confirm("Are you sure you want to delete this store? This will delete all associated shelves, zones, and products.")) return;
    try {
      await api.deleteStore(storeId);
      setStores(stores.filter(s => s.store_id !== storeId));
    } catch (err) {
      setError(err.message || "Failed to delete store.");
    }
  };

  // --- ZONE HANDLERS ---

  const toggleStoreZones = async (storeId) => {
    const isExpanded = !!expandedStores[storeId];
    setExpandedStores({ ...expandedStores, [storeId]: !isExpanded });

    if (!isExpanded) {
      try {
        const zoneList = await api.getStoreZones(storeId);
        setZones({ ...zones, [storeId]: zoneList || [] });
      } catch (err) {
        console.error("Failed to load zones for store:", storeId, err);
      }
    }
  };

  const handleAddZone = async (storeId) => {
    const zoneName = newZoneNames[storeId];
    if (!zoneName) return;

    try {
      const newZn = await api.createStoreZone(storeId, {
        zone_name: zoneName
      });
      
      const currentStoreZones = zones[storeId] || [];
      setZones({ ...zones, [storeId]: [...currentStoreZones, newZn] });
      setNewZoneNames({ ...newZoneNames, [storeId]: "" });
    } catch (err) {
      setError(err.message || "Failed to create zone.");
    }
  };

  const handleDeleteZone = async (storeId, zoneId) => {
    if (!window.confirm("Are you sure you want to delete this zone?")) return;
    try {
      await api.deleteStoreZone(zoneId);
      setZones({
        ...zones,
        [storeId]: (zones[storeId] || []).filter(z => z.zone_id !== zoneId)
      });
    } catch (err) {
      setError(err.message || "Failed to delete zone.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accentBlue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-white">Registered Stores</h3>
          <p className="text-sm text-gray-400">View and manage retail store locations and internal floor zones</p>
        </div>

        {isManagerOrAdmin && !addingStore && (
          <button
            onClick={() => setAddingStore(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accentBlue to-accentCyan text-darkBg font-bold rounded-xl shadow-neon hover:shadow-neon/60 transition-all duration-300"
          >
            <Plus size={16} />
            Add Store
          </button>
        )}
      </div>

      {/* Add Store Form */}
      {addingStore && (
        <form onSubmit={handleAddStore} className="glass-panel p-6 rounded-xl border border-darkBorder space-y-4">
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider">New Store Location</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Store Name</label>
              <input
                type="text"
                required
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                placeholder="e.g. Supermarket Downtown"
                className="w-full px-4 py-2 bg-darkBg border border-darkBorder rounded-lg text-white text-sm focus:outline-none focus:border-accentBlue"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Location / Address</label>
              <input
                type="text"
                required
                value={newStoreLocation}
                onChange={(e) => setNewStoreLocation(e.target.value)}
                placeholder="e.g. 5th Avenue, NYC"
                className="w-full px-4 py-2 bg-darkBg border border-darkBorder rounded-lg text-white text-sm focus:outline-none focus:border-accentBlue"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setAddingStore(false)}
              className="px-4 py-2 bg-darkBorder text-gray-300 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-accentBlue text-darkBg font-bold rounded-lg text-sm shadow-neon"
            >
              Save Store
            </button>
          </div>
        </form>
      )}

      {/* Edit Store Form */}
      {editStore && (
        <form onSubmit={handleEditStore} className="glass-panel p-6 rounded-xl border border-accentBlue/30 space-y-4">
          <h4 className="text-sm font-semibold text-accentBlue uppercase tracking-wider">Edit Store details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Store Name</label>
              <input
                type="text"
                required
                value={editStore.store_name}
                onChange={(e) => setEditStore({ ...editStore, store_name: e.target.value })}
                className="w-full px-4 py-2 bg-darkBg border border-darkBorder rounded-lg text-white text-sm focus:outline-none focus:border-accentBlue"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Location</label>
              <input
                type="text"
                required
                value={editStore.location}
                onChange={(e) => setEditStore({ ...editStore, location: e.target.value })}
                className="w-full px-4 py-2 bg-darkBg border border-darkBorder rounded-lg text-white text-sm focus:outline-none focus:border-accentBlue"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditStore(null)}
              className="px-4 py-2 bg-darkBorder text-gray-300 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-accentBlue text-darkBg font-bold rounded-lg text-sm shadow-neon"
            >
              Update Store
            </button>
          </div>
        </form>
      )}

      {/* Stores List */}
      <div className="space-y-4">
        {stores.length === 0 ? (
          <div className="glass-panel py-12 rounded-xl text-center text-gray-400">
            No stores registered yet. Click "Add Store" above.
          </div>
        ) : (
          stores.map((store) => {
            const isExpanded = !!expandedStores[store.store_id];
            const storeZones = zones[store.store_id] || [];
            
            return (
              <div key={store.store_id} className="glass-panel rounded-xl overflow-hidden border border-darkBorder shadow-md">
                {/* Store Header Row */}
                <div className="p-6 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-darkBorder/50 rounded-lg flex items-center justify-center text-accentBlue">
                      <Store size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-base">{store.store_name}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                        <MapPin size={12} className="text-accentCyan" />
                        {store.location}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleStoreZones(store.store_id)}
                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-darkBorder/50 text-gray-300 rounded-lg hover:text-white transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {isExpanded ? "Hide Zones" : "Show Zones"}
                    </button>

                    {isAdmin && (
                      <>
                        <button
                          onClick={() => setEditStore(store)}
                          className="p-2 bg-darkBorder hover:bg-darkBorder/80 text-gray-300 hover:text-white rounded-lg transition-colors"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteStore(store.store_id)}
                          className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Nested Store Zones */}
                {isExpanded && (
                  <div className="bg-darkBg/30 border-t border-darkBorder px-8 py-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">Store Zones / Aisles</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {storeZones.map((zone) => (
                        <div key={zone.zone_id} className="flex justify-between items-center p-3 bg-darkCard/80 border border-darkBorder rounded-lg">
                          <span className="text-sm text-gray-200 font-medium flex items-center gap-1.5">
                            <Tag size={12} className="text-accentBlue" />
                            {zone.zone_name}
                          </span>
                          {isManagerOrAdmin && (
                            <button
                              onClick={() => handleDeleteZone(store.store_id, zone.zone_id)}
                              className="text-rose-400 hover:text-rose-300 p-1"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      ))}

                      {isManagerOrAdmin && (
                        <div className="flex gap-2 p-1.5 bg-darkCard border border-dashed border-darkBorder rounded-lg">
                          <input
                            type="text"
                            required
                            value={newZoneNames[store.store_id] || ""}
                            onChange={(e) => setNewZoneNames({ ...newZoneNames, [store.store_id]: e.target.value })}
                            placeholder="Add zone name..."
                            className="bg-transparent text-xs text-white placeholder-gray-500 px-2 py-1 flex-1 focus:outline-none"
                          />
                          <button
                            onClick={() => handleAddZone(store.store_id)}
                            className="px-2 py-1 bg-accentBlue text-darkBg text-xs font-bold rounded"
                          >
                            Add
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
