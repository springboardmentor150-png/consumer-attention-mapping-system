import api from "./api";
import {
  AttentionReportResponse,
  ShelfAttentionSummary,
  ZoneTrafficSummary,
  HourlyTrafficPoint,
} from "../types";

export const analyticsService = {
  async getDashboardData(
    storeId: string,
    period: string = "today"
  ): Promise<AttentionReportResponse> {
    const response = await api.get(`/analytics/dashboard/${storeId}`, {
      params: { period },
    });
    return response.data;
  },

  async getShelfRankings(storeId: string): Promise<ShelfAttentionSummary[]> {
    try {
      const response = await api.get(`/analytics/shelves/${storeId}`);
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch shelf rankings:", error);
      return [];
    }
  },

  async getZoneTraffic(storeId: string): Promise<ZoneTrafficSummary[]> {
    try {
      const response = await api.get(`/analytics/zones/${storeId}`);
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch zone traffic:", error);
      return [];
    }
  },

  async getHourlyTraffic(
    storeId: string,
    date?: string
  ): Promise<HourlyTrafficPoint[]> {
    try {
      const response = await api.get(`/analytics/hourly/${storeId}`, {
        params: { date },
      });
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch hourly traffic:", error);
      return [];
    }
  },
};
