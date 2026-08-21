import api from "./api";
import { StoreSegmentSummary, SegmentDistribution, BehaviorSegmentResponse } from "../types";

export const behaviorService = {
  classifyStoreSessions: async (storeId: string) => {
    const res = await api.post(`/behavior/classify/${storeId}`);
    return res.data;
  },

  getSegmentSummary: async (storeId: string, period: string = "week"): Promise<StoreSegmentSummary> => {
    const res = await api.get(`/behavior/segments/${storeId}`, { params: { period } });
    return res.data;
  },

  getSegmentDistribution: async (storeId: string): Promise<SegmentDistribution[]> => {
    const res = await api.get(`/behavior/segments/${storeId}/distribution`);
    return res.data;
  },

  getSessionSegment: async (sessionId: string): Promise<BehaviorSegmentResponse> => {
    const res = await api.get(`/behavior/sessions/${sessionId}`);
    return res.data;
  },

  getJourneyAnalysis: async (sessionId: string) => {
    const res = await api.get(`/behavior/journey/${sessionId}`);
    return res.data;
  },
};

export default behaviorService;
