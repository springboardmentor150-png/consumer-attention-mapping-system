import api from "./api";
import { StoreRecommendationSummary, RecommendationItem } from "../types";

export const recommendationService = {
  generateRecommendations: async (storeId: string): Promise<StoreRecommendationSummary> => {
    const res = await api.post(`/recommendations/generate/${storeId}`);
    return res.data;
  },

  getStoreRecommendations: async (storeId: string): Promise<RecommendationItem[]> => {
    const res = await api.get(`/recommendations/store/${storeId}`);
    return res.data;
  },

  getHighPriorityRecommendations: async (storeId: string): Promise<RecommendationItem[]> => {
    const res = await api.get(`/recommendations/store/${storeId}/high-priority`);
    return res.data;
  },

  dismissRecommendation: async (recommendationId: string): Promise<void> => {
    await api.patch(`/recommendations/${recommendationId}/dismiss`);
  },
};

export default recommendationService;
