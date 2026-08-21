import axios from "axios";


// ============================================================
// API CONFIGURATION
// ============================================================

const API_BASE_URL = "http://127.0.0.1:8000";


// ============================================================
// AXIOS API CLIENT
// All API requests now go through /api
// ============================================================

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});


// ============================================================
// REQUEST INTERCEPTOR
// Attach authentication token when available
// ============================================================

api.interceptors.request.use(
  (config) => {

    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);


// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================

api.interceptors.response.use(

  (response) => {
    return response;
  },

  (error) => {

    // Backend unavailable
    if (!error.response) {
      console.error(
        "Backend server is unavailable:",
        error.message
      );
    }

    // Unauthorized
    if (error.response?.status === 401) {

      console.warn(
        "Authentication failed or token expired."
      );

    }

    return Promise.reject(error);
  }
);


// ============================================================
// SHOPPER BEHAVIOR
// ============================================================

export const getShopperBehavior = async () => {

  const response = await api.get(
    "/behavior/"
  );

  return response.data;
};


// ============================================================
// HEATMAP
// ============================================================

export const getHeatmap = () => {

  return `${API_BASE_URL}/api/heatmaps/store`;
};


// ============================================================
// PRODUCT RECOMMENDATIONS
// ============================================================

export const getProductRecommendations = async () => {

  const response = await api.get(
    "/product-scores/recommendations"
  );

  return response.data;
};


// ============================================================
// COMPLETE DASHBOARD
// ============================================================

export const getDashboard = async () => {

  const response = await api.get(
    "/dashboard/"
  );

  return response.data;
};


// ============================================================
// ROLE-BASED DASHBOARD
// ============================================================

export const getRoleDashboard = async (role) => {

  const response = await api.get(
    `/dashboard/role/${encodeURIComponent(role)}`
  );

  return response.data;
};


// ============================================================
// NOTIFICATIONS / ALERTS
// ============================================================

export const getNotifications = async () => {

  const response = await api.get(
    "/notifications/"
  );

  return response.data;
};


// ============================================================
// STORES
// ============================================================

export const getStores = async () => {

  const response = await api.get(
    "/stores/"
  );

  return response.data;
};


// ============================================================
// ANALYTICS
// ============================================================

export const getAnalytics = async () => {

  const response = await api.get(
    "/analytics/"
  );

  return response.data;
};


// ============================================================
// ANALYTICS SUMMARY
// ============================================================

export const getAnalyticsSummary = async () => {

  const response = await api.get(
    "/analytics/summary"
  );

  return response.data;
};


// ============================================================
// ATTENTION ANALYTICS
// ============================================================

export const getAttentionAnalytics = async () => {

  const response = await api.get(
    "/analytics/attention"
  );

  return response.data;
};


// ============================================================
// CUSTOMER ANALYTICS
// ============================================================

export const getCustomerAnalytics = async (customerId) => {

  const response = await api.get(
    `/analytics/customer/${customerId}`
  );

  return response.data;
};


// ============================================================
// SHELF ANALYTICS
// ============================================================

export const getShelfAnalytics = async (shelfName) => {

  const response = await api.get(
    `/analytics/shelf/${encodeURIComponent(shelfName)}`
  );

  return response.data;
};


// ============================================================
// EXPORT DEFAULT API CLIENT
// ============================================================

export default api;
// ============================================================
// AUTHENTICATION
// ============================================================

export const registerUser = async (userData) => {
  const response = await api.post("/auth/register", userData);
  return response.data;
};

export const loginUser = async (userData) => {
  const response = await api.post("/auth/login", userData);
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get("/auth/profile");
  return response.data;
};

export const getManagerDashboard = async () => {
  const response = await api.get("/auth/manager");
  return response.data;
};