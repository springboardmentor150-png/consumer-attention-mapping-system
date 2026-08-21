import api from "./api";
import { TrackingSession, ActiveShopperInfo } from "../types";

export const trackingService = {
  async startTracking(
    cameraId: string,
    storeId: string,
    videoSource: string
  ): Promise<TrackingSession> {
    const response = await api.post("/tracking/start", {
      camera_id: cameraId,
      store_id: storeId,
      video_source: videoSource,
    });
    return response.data;
  },

  async stopTracking(sessionId: string): Promise<TrackingSession> {
    const response = await api.post(`/tracking/stop/${sessionId}`);
    return response.data;
  },

  async getTrackingSessions(
    storeId?: string,
    status?: string
  ): Promise<TrackingSession[]> {
    const response = await api.get("/tracking/sessions", {
      params: {
        store_id: storeId,
        status: status,
      },
    });
    return response.data;
  },

  async getActiveSessions(storeId: string): Promise<ActiveShopperInfo[]> {
    const response = await api.get(`/tracking/active/${storeId}`);
    return response.data;
  },
};
