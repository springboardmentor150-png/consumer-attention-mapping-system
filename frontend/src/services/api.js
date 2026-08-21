// Central API service — all backend calls go through here
const BASE_URL = "http://localhost:8000/api";

function getHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function request(method, path, body = null, isFormData = false) {
  const headers = isFormData
    ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
    : getHeaders();

  const opts = { method, headers };
  if (body) opts.body = isFormData ? body : JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, opts);
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401 && !path.includes("/auth/login")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login?expired=1";
    }
    throw new Error(data.detail || `HTTP ${res.status}`);
  }
  return data;
}

const api = {
  // Auth
  login: (email, password) =>
    request("POST", "/auth/login", { email, password }),
  register: (data) =>
    request("POST", "/auth/register", data),
  me: () => request("GET", "/auth/me"),

  // Stores
  getStores: () => request("GET", "/stores"),
  createStore: (data) => request("POST", "/stores", data),
  updateStore: (id, data) => request("PUT", `/stores/${id}`, data),
  deleteStore: (id) => request("DELETE", `/stores/${id}`),
  getStoreZones: (storeId) => request("GET", `/stores/${storeId}/zones`),
  createStoreZone: (storeId, data) => request("POST", `/stores/${storeId}/zones`, data),
  deleteStoreZone: (zoneId) => request("DELETE", `/stores/zones/${zoneId}`),

  // Zones
  getZones: (storeId) => request("GET", `/zones?store_id=${storeId}`),
  createZone: (storeId, data) => request("POST", `/zones?store_id=${storeId}`, data),
  updateZone: (id, data) => request("PUT", `/zones/${id}`, data),
  deleteZone: (id) => request("DELETE", `/zones/${id}`),

  // Shelves
  getShelves: (storeId) => request("GET", `/shelves?store_id=${storeId}`),
  createShelf: (data) => request("POST", "/shelves", data),
  updateShelf: (id, data) => request("PUT", `/shelves/${id}`, data),
  deleteShelf: (id) => request("DELETE", `/shelves/${id}`),

  // Products
  getProducts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request("GET", `/products${q ? "?" + q : ""}`);
  },
  createProduct: (data) => request("POST", "/products", data),
  updateProduct: (id, data) => request("PUT", `/products/${id}`, data),
  deleteProduct: (id) => request("DELETE", `/products/${id}`),

  // Cameras
  getCameras: (storeId) => request("GET", `/cameras${storeId ? "?store_id=" + storeId : ""}`),
  createCamera: (data) => request("POST", "/cameras", data),
  updateCamera: (id, data) => request("PUT", `/cameras/${id}`, data),
  deleteCamera: (id) => request("DELETE", `/cameras/${id}`),

  // Videos
  getVideos: (storeId) => request("GET", `/videos${storeId ? "?store_id=" + storeId : ""}`),
  uploadVideo: (formData) => request("POST", "/videos/upload", formData, true),
  processVideo: (formData) => request("POST", "/videos/process", formData, true),
  getVideoStatus: (videoId) => request("GET", `/videos/${videoId}/status`),
  getVideoStreamUrl: (videoId) => `${BASE_URL}/videos/${videoId}/stream`,

  // Tracking
  getSessions: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request("GET", `/tracking/sessions${q ? "?" + q : ""}`);
  },
  getSessionPath: (sessionId) => request("GET", `/tracking/sessions/${sessionId}/path`),
  getVideoTrackingOverlay: (videoId) => request("GET", `/tracking/video/${videoId}/overlay`),
  getTrackingStats: (storeId) =>
    request("GET", `/tracking/stats${storeId ? "?store_id=" + storeId : ""}`),


  // Attention
  getAttentionSummary: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request("GET", `/attention/summary${q ? "?" + q : ""}`);
  },
  getHeatmap: (storeId, type = "traffic", videoId = null) => {
    let url = `/attention/heatmap?store_id=${storeId}&heatmap_type=${type}`;
    if (videoId) url += `&video_id=${videoId}`;
    return request("GET", url);
  },
  getProductAttention: (storeId) =>
    request("GET", `/attention/products${storeId ? "?store_id=" + storeId : ""}`),
  getShelfAttention: (storeId) =>
    request("GET", `/attention/shelves${storeId ? "?store_id=" + storeId : ""}`),

  // Analytics
  getTraffic: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request("GET", `/analytics/traffic${q ? "?" + q : ""}`);
  },
  getDwellTime: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request("GET", `/analytics/dwell-time${q ? "?" + q : ""}`);
  },
  getProductAnalytics: (storeId) =>
    request("GET", `/analytics/products${storeId ? "?store_id=" + storeId : ""}`),
  getBehaviorAnalytics: (storeId) =>
    request("GET", `/analytics/behavior${storeId ? "?store_id=" + storeId : ""}`),
  getOverview: (storeId) =>
    request("GET", `/analytics/overview${storeId ? "?store_id=" + storeId : ""}`),

  // Recommendations
  getRecommendations: (storeId) =>
    request("GET", `/recommendations${storeId ? "?store_id=" + storeId : ""}`),
  generateRecommendations: (storeId) =>
    request("POST", `/recommendations/generate?store_id=${storeId}`),
  dismissRecommendation: (id) => request("PUT", `/recommendations/${id}/dismiss`),

  // Alerts
  getAlerts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request("GET", `/alerts${q ? "?" + q : ""}`);
  },
  acknowledgeAlert: (id) => request("PUT", `/alerts/${id}/acknowledge`),
  resolveAlert: (id) => request("PUT", `/alerts/${id}/resolve`),
  getAlertCounts: (storeId) =>
    request("GET", `/alerts/counts${storeId ? "?store_id=" + storeId : ""}`),

  // Reports
  getReports: (storeId) =>
    request("GET", `/reports${storeId ? "?store_id=" + storeId : ""}`),
  generateReport: (data) => request("POST", "/reports/generate", data),
  getReport: (id) => request("GET", `/reports/${id}`),
  downloadReport: (id) => `${BASE_URL}/reports/${id}/download`,

  // System
  getHealth: () => request("GET", "/health"),
};

export default api;

// WebSocket helper for video processing
export function createProcessingWebSocket(jobId, onMessage, onClose) {
  const wsUrl = `ws://localhost:8000/api/videos/ws/${jobId}`;
  const ws = new WebSocket(wsUrl);
  ws.onmessage = (e) => {
    try { onMessage(JSON.parse(e.data)); }
    catch { onMessage(e.data); }
  };
  ws.onclose = onClose;
  ws.onerror = (e) => console.error("WS error:", e);
  return ws;
}
