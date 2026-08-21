export const API_BASE_URL = "http://localhost:8000";
export const API_V1 = "/api";

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "cams_access_token",
  REFRESH_TOKEN: "cams_refresh_token",
  USER: "cams_user",
};

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  STORE_MANAGER: "store_manager",
  RETAIL_ANALYST: "retail_analyst",
  MARKETING_MANAGER: "marketing_manager",
} as const;

export const ROUTES = {
  ROOT: "/",
  AUTH: "/auth",
  DASHBOARD: "/dashboard",
  STORES: "/stores",
  CAMERAS: "/cameras",
  USERS: "/admin",
  ANALYTICS: "/analytics",
  BEHAVIOR: "/behavior",
  HEATMAPS: "/heatmaps",
  RECOMMENDATIONS: "/recommendations",
  REPORTS: "/reports",
  SETTINGS: "/settings",
};
