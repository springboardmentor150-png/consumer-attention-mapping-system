import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const analyticsAPI = axios.create({
  baseURL: API_BASE_URL,
});

export const getSummary = async () => {
  const response = await analyticsAPI.get("/analytics/summary");
  return response.data;
};

export const getShelfPerformance = async () => {
  const response = await analyticsAPI.get("/analytics/performance");
  return response.data;
};

export const getDwellAnalytics = async () => {
  const response = await analyticsAPI.get("/analytics/dwell");
  return response.data;
};

export const getProductScores = async () => {
  const response = await analyticsAPI.get("/analytics/products");
  return response.data;
};

export const getRecommendations = async () => {
  const response = await analyticsAPI.get(
    "/analytics/recommendations"
  );

  return response.data;
};

export const getHeatmapURL = () => {
  return `${API_BASE_URL}/analytics/heatmap`;
};