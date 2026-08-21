import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Plus, Trash2, Video, Package, ShoppingBag, Layers, Activity } from "lucide-react";

export default function ShelfManagement() {
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [shelves, setShelves] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add shelf state
  const [newShelfCategory, setNewShelfCategory] = useState("");
  const [newShelfZoneId, setNewShelfZoneId] = useState("");
  const [addingShelf, setAddingShelf] = useState(false);

  // Add product state (keyed by shelf_id)
  const [newProductNames, setNewProductNames] = useState({});
  const [newProductPrices, setNewProductPrices] = useState({});
  const [newProductSkus, setNewProductSkus] = useState({});
  const [addingProductToShelf, setAddingProductToShelf] = useState({});

  // Add camera state (keyed by shelf_id)
  const [newCameraNames, setNewCameraNames] = useState({});
  const [newCameraIPs, setNewCameraIPs] = useState({});
  const [addingCameraToShelf, setAddingCameraToShelf] = useState({});

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isManagerOrAdmin = !user.role || ["Admin", "Store Manager"].includes(user.role);

  const fetchData = async () => {
    try {
      setLoading(true);
      const storeList = await api.getStores();
      setStores(storeList || []);
      if (storeList && storeList.length > 0) {
        setSelectedStoreId(storeList[0].store_id);
      }
    } catch (err) {
      setError("Failed to fetch initial stores list: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchShelvesAndZones = async (storeId) => {
    if (!storeId) return;
    try {
      const [shelfData, zoneData] = await Promise.all([
        api.getShelves(storeId),
        api.getStoreZones(storeId)
      ]);
      setShelves(shelfData || []);
      setZones(zoneData || []);
    } catch (err) {
      console.error("Failed to load shelves/zones for store:", storeId, err);
      setError("Failed to load shelves for store: " + err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedStoreId) {
      fetchShelvesAndZones(selectedStoreId);
    }
  }, [selectedStoreId]);

  const handleAddShelf = async (e) => {
    e.preventDefault();
    if (!newShelfCategory) return;
    
    try {
      const newShelf = await api.createShelf({
        store_id: selectedStoreId,
        category: newShelfCategory,
        shelf_name: newShelfCategory,
        zone_id: newShelfZoneId || null
      });
      setShelves([...shelves, newShelf]);
      setNewShelfCategory("");
      setNewShelfZoneId("");
      setAddingShelf(false);
    } catch (err) {
      setError(err.message || "Failed to create shelf.");
    }
  };

  const handleDeleteShelf = async (shelfId) => {
    if (!window.confirm("Are you sure you want to delete this shelf? All products will be unlinked.")) return;
    try {
      await api.deleteShelf(shelfId);
      setShelves(shelves.filter(s => s.shelf_id !== shelfId));
    } catch (err) {
      setError(err.message || "Failed to delete shelf.");
    }
  };

  // --- PRODUCT MANAGEMENT ---

  const handleAddProduct = async (shelfId) => {
    const name = newProductNames[shelfId];
    const priceStr = newProductPrices[shelfId] || "0.00";
    const sku = newProductSkus[shelfId] || "";

    if (!name) return;

    try {
      const newProd = await api.createProduct({
        shelf_id: shelfId,
        product_name: name,
        price: parseFloat(priceStr),
        sku: sku
      });

      setShelves(shelves.map(s => {
        if (s.shelf_id === shelfId) {
          return { ...s, products: [...(s.products || []), newProd] };
        }
        return s;
      }));

      setNewProductNames({ ...newProductNames, [shelfId]: "" });
      setNewProductPrices({ ...newProductPrices, [shelfId]: "" });
      setNewProductSkus({ ...newProductSkus, [shelfId]: "" });
      setAddingProductToShelf({ ...addingProductToShelf, [shelfId]: false });
    } catch (err) {
      setError(err.message || "Failed to add product.");
    }
  };

  const handleDeleteProduct = async (shelfId, productId) => {
    try {
      await api.deleteProduct(productId);
      setShelves(shelves.map(s => {
        if (s.shelf_id === shelfId) {
          return { ...s, products: (s.products || []).filter(p => p.product_id !== productId) };
        }
        return s;
      }));
    } catch (err) {
      setError(err.message || "Failed to delete product.");
    }
  };

  // --- CAMERA CONFIGURATION ---

  const handleAddCamera = async (shelfId) => {
    const cameraName = newCameraNames[shelfId];
    const ipAddress = newCameraIPs[shelfId] || "";

    if (!cameraName) return;

    try {
      const newCam = await api.createCamera({
        store_id: selectedStoreId,
        shelf_id: shelfId,
        camera_name: cameraName,
        ip_address: ipAddress,
        status: "Active"
      });

      setShelves(shelves.map(s => {
        if (s.shelf_id === shelfId) {
          return { ...s, cameras: [...(s.cameras || []), newCam] };
        }
        return s;
      }));

      setNewCameraNames({ ...newCameraNames, [shelfId]: "" });
      setNewCameraIPs({ ...newCameraIPs, [shelfId]: "" });
      setAddingCameraToShelf({ ...addingCameraToShelf, [shelfId]: false });
    } catch (err) {
      setError(err.message || "Failed to assign camera.");
    }
  };

  const handleDeleteCamera = async (shelfId, cameraId) => {
    try {
      await api.deleteCamera(cameraId);
      setShelves(shelves.map(s => {
        if (s.shelf_id === shelfId) {
          return { ...s, cameras: (s.cameras || []).filter(c => c.camera_id !== cameraId) };
        }
        return s;
      }));
    } catch (err) {
      setError(err.message || "Failed to remove camera.");
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

      {/* Select Store Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-darkCard p-4 rounded-xl border border-darkBorder">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Store</label>
          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="bg-darkBg border border-darkBorder text-sm text-white px-3 py-2 rounded-lg focus:outline-none focus:border-accentBlue"
          >
            {stores.map(st => (
              <option key={st.store_id} value={st.store_id}>{st.store_name}</option>
            ))}
          </select>
        </div>

        {isManagerOrAdmin && selectedStoreId && !addingShelf && (
          <button
            onClick={() => setAddingShelf(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accentBlue to-accentCyan text-darkBg font-bold rounded-xl shadow-neon hover:shadow-neon/60 transition-all duration-300"
          >
            <Plus size={16} />
            Create Shelf
          </button>
        )}
      </div>

      {/* Add Shelf Form */}
      {addingShelf && (
        <form onSubmit={handleAddShelf} className="glass-panel p-6 rounded-xl border border-darkBorder space-y-4">
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider">New Store Shelf Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Product Category / Label</label>
              <input
                type="text"
                required
                value={newShelfCategory}
                onChange={(e) => setNewShelfCategory(e.target.value)}
                placeholder="e.g. Carbonated Drinks, Cookies & Chips"
                className="w-full px-4 py-2 bg-darkBg border border-darkBorder rounded-lg text-white text-sm focus:outline-none focus:border-accentBlue"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Assign Floor Zone (Optional)</label>
              <select
                value={newShelfZoneId}
                onChange={(e) => setNewShelfZoneId(e.target.value)}
                className="w-full px-4 py-2 bg-darkBg border border-darkBorder rounded-lg text-white text-sm focus:outline-none focus:border-accentBlue"
              >
                <option value="">-- No Specific Zone --</option>
                {zones.map(z => (
                  <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setAddingShelf(false)}
              className="px-4 py-2 bg-darkBorder text-gray-300 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-accentBlue text-darkBg font-bold rounded-lg text-sm shadow-neon"
            >
              Save Shelf
            </button>
          </div>
        </form>
      )}

      {/* Shelves List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {shelves.length === 0 ? (
          <div className="glass-panel col-span-full py-12 rounded-xl text-center text-gray-400">
            No shelves registered in this store yet. Click "Create Shelf" to set one up.
          </div>
        ) : (
          shelves.map((shelf) => {
            const currentZone = zones.find(z => z.zone_id === shelf.zone_id);
            return (
              <div key={shelf.shelf_id} className="glass-panel border border-darkBorder rounded-xl p-6 flex flex-col space-y-6">
                
                {/* Header info */}
                <div className="flex justify-between items-start border-b border-darkBorder pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-darkBorder/50 rounded-lg flex items-center justify-center text-accentBlue">
                      <Layers size={18} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm uppercase tracking-wide">{shelf.category}</h4>
                      <div className="text-xs text-gray-400 mt-1">
                        Zone: <span className="text-accentCyan font-medium">{currentZone ? currentZone.zone_name : "General Aisle"}</span>
                      </div>
                    </div>
                  </div>
                  
                  {isManagerOrAdmin && (
                    <button
                      onClick={() => handleDeleteShelf(shelf.shelf_id)}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Subsections: Products & Cameras */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
                  
                  {/* Products on Shelf */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400 tracking-wider uppercase flex items-center gap-1">
                        <ShoppingBag size={12} className="text-accentCyan" /> Products ({shelf.products?.length || 0})
                      </span>
                      {isManagerOrAdmin && !addingProductToShelf[shelf.shelf_id] && (
                        <button
                          onClick={() => setAddingProductToShelf({ ...addingProductToShelf, [shelf.shelf_id]: true })}
                          className="text-[10px] text-accentCyan font-bold tracking-wider hover:underline"
                        >
                          + Add Product
                        </button>
                      )}
                    </div>

                    {addingProductToShelf[shelf.shelf_id] && (
                      <div className="bg-darkBg/60 p-3 rounded-lg border border-darkBorder space-y-2">
                        <input
                          type="text"
                          placeholder="Product Name"
                          value={newProductNames[shelf.shelf_id] || ""}
                          onChange={(e) => setNewProductNames({ ...newProductNames, [shelf.shelf_id]: e.target.value })}
                          className="w-full bg-darkCard border border-darkBorder text-xs text-white rounded px-2 py-1 focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Price"
                            value={newProductPrices[shelf.shelf_id] || ""}
                            onChange={(e) => setNewProductPrices({ ...newProductPrices, [shelf.shelf_id]: e.target.value })}
                            className="w-1/2 bg-darkCard border border-darkBorder text-xs text-white rounded px-2 py-1 focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="SKU"
                            value={newProductSkus[shelf.shelf_id] || ""}
                            onChange={(e) => setNewProductSkus({ ...newProductSkus, [shelf.shelf_id]: e.target.value })}
                            className="w-1/2 bg-darkCard border border-darkBorder text-xs text-white rounded px-2 py-1 focus:outline-none"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setAddingProductToShelf({ ...addingProductToShelf, [shelf.shelf_id]: false })}
                            className="px-2 py-1 text-[10px] bg-darkCard text-gray-400 border border-darkBorder rounded"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddProduct(shelf.shelf_id)}
                            className="px-2 py-1 text-[10px] bg-accentBlue text-darkBg font-bold rounded"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {shelf.products?.length === 0 ? (
                        <div className="text-xs text-gray-500 italic py-2">Empty Shelf</div>
                      ) : (
                        shelf.products?.map((prod) => (
                          <div key={prod.product_id} className="flex justify-between items-center p-2 bg-darkCard/50 border border-darkBorder rounded">
                            <div>
                              <div className="text-xs text-white font-medium">{prod.product_name}</div>
                              <div className="text-[10px] text-gray-400 mt-0.5">${prod.price.toFixed(2)} | SKU: {prod.sku || "N/A"}</div>
                            </div>
                            {isManagerOrAdmin && (
                              <button
                                onClick={() => handleDeleteProduct(shelf.shelf_id, prod.product_id)}
                                className="text-rose-400 hover:text-rose-300"
                              >
                                <Trash2 size={10} />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Cameras Assigned to Shelf */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400 tracking-wider uppercase flex items-center gap-1">
                        <Video size={12} className="text-accentBlue" /> Live Cameras ({shelf.cameras?.length || 0})
                      </span>
                      {isManagerOrAdmin && !addingCameraToShelf[shelf.shelf_id] && (
                        <button
                          onClick={() => setAddingCameraToShelf({ ...addingCameraToShelf, [shelf.shelf_id]: true })}
                          className="text-[10px] text-accentCyan font-bold tracking-wider hover:underline"
                        >
                          + Link Camera
                        </button>
                      )}
                    </div>

                    {addingCameraToShelf[shelf.shelf_id] && (
                      <div className="bg-darkBg/60 p-3 rounded-lg border border-darkBorder space-y-2">
                        <input
                          type="text"
                          placeholder="Camera Name (e.g. Aisle 4 Cam)"
                          value={newCameraNames[shelf.shelf_id] || ""}
                          onChange={(e) => setNewCameraNames({ ...newCameraNames, [shelf.shelf_id]: e.target.value })}
                          className="w-full bg-darkCard border border-darkBorder text-xs text-white rounded px-2 py-1 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="IP / Stream URL / Mock path"
                          value={newCameraIPs[shelf.shelf_id] || ""}
                          onChange={(e) => setNewCameraIPs({ ...newCameraIPs, [shelf.shelf_id]: e.target.value })}
                          className="w-full bg-darkCard border border-darkBorder text-xs text-white rounded px-2 py-1 focus:outline-none"
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setAddingCameraToShelf({ ...addingCameraToShelf, [shelf.shelf_id]: false })}
                            className="px-2 py-1 text-[10px] bg-darkCard text-gray-400 border border-darkBorder rounded"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddCamera(shelf.shelf_id)}
                            className="px-2 py-1 text-[10px] bg-accentBlue text-darkBg font-bold rounded"
                          >
                            Link
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {shelf.cameras?.length === 0 ? (
                        <div className="text-xs text-gray-500 italic py-2">No cameras connected</div>
                      ) : (
                        shelf.cameras?.map((cam) => (
                          <div key={cam.camera_id} className="flex justify-between items-center p-2 bg-darkCard/50 border border-darkBorder rounded">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                              <div>
                                <div className="text-xs text-white font-medium">{cam.camera_name}</div>
                                <div className="text-[10px] text-accentBlue truncate max-w-[120px]">{cam.ip_address || "Simulated Feed"}</div>
                              </div>
                            </div>
                            {isManagerOrAdmin && (
                              <button
                                onClick={() => handleDeleteCamera(shelf.shelf_id, cam.camera_id)}
                                className="text-rose-400 hover:text-rose-300"
                              >
                                <Trash2 size={10} />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
