import api from "./api";
import { HeatmapRecord } from "../types";

export const heatmapService = {
  generateHeatmap: async (
    storeId: string,
    heatmapType: string = "traffic",
    startDate: string,
    endDate: string
  ): Promise<HeatmapRecord> => {
    const res = await api.post("/heatmaps/generate", {
      store_id: storeId,
      heatmap_type: heatmapType,
      start_date: startDate,
      end_date: endDate,
      width: 800,
      height: 600,
    });
    return res.data;
  },

  getStoreHeatmaps: async (storeId: string, type?: string): Promise<HeatmapRecord[]> => {
    const res = await api.get(`/heatmaps/store/${storeId}`, { params: { heatmap_type: type } });
    return res.data.heatmaps || [];
  },

  getHeatmap: async (heatmapId: string): Promise<HeatmapRecord> => {
    const res = await api.get(`/heatmaps/${heatmapId}`);
    return res.data;
  },

  getHeatmapImageUrl: (heatmapId: string): string => {
    return `http://localhost:8000/api/v1/heatmaps/${heatmapId}/image`;
  },
};

export default heatmapService;
