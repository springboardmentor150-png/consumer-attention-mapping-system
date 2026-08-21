import api from "./api";
import { StoreScoreReport, ProductScoreDetail } from "../types";

export const scoringService = {
  calculateStoreScores: async (storeId: string, period: string = "week"): Promise<StoreScoreReport> => {
    const res = await api.post(`/scoring/calculate/${storeId}`, null, { params: { period } });
    return res.data;
  },

  getProductScores: async (storeId: string): Promise<ProductScoreDetail[]> => {
    const res = await api.get(`/scoring/products/${storeId}`);
    return res.data;
  },

  getTopProducts: async (storeId: string, limit: number = 10): Promise<ProductScoreDetail[]> => {
    const res = await api.get(`/scoring/products/${storeId}/top`, { params: { limit } });
    return res.data;
  },

  getLowProducts: async (storeId: string, limit: number = 10): Promise<ProductScoreDetail[]> => {
    const res = await api.get(`/scoring/products/${storeId}/low`, { params: { limit } });
    return res.data;
  },

  getScoreReport: async (storeId: string): Promise<StoreScoreReport> => {
    const res = await api.get(`/scoring/report/${storeId}`);
    return res.data;
  },
};

export default scoringService;
