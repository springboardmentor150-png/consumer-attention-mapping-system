"use client";

import { useState, useEffect, useCallback } from "react";
import heatmapService from "../services/heatmapService";
import { HeatmapRecord } from "../types";
import api from "../services/api";

export function useHeatmap(storeId?: string) {
  const [heatmaps, setHeatmaps] = useState<HeatmapRecord[]>([]);
  const [currentHeatmap, setCurrentHeatmap] = useState<HeatmapRecord | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHeatmaps = useCallback(async (sid: string, type?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const records = await heatmapService.getStoreHeatmaps(sid, type);
      setHeatmaps(records);
      if (records.length > 0) {
        setCurrentHeatmap(records[0]);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to fetch heatmaps");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateHeatmap = async (sid: string, type: string, startDate: string, endDate: string) => {
    setIsGenerating(true);
    setError(null);
    try {
      const newHM = await heatmapService.generateHeatmap(sid, type, startDate, endDate);
      setCurrentHeatmap(newHM);
      setHeatmaps((prev) => [newHM, ...prev]);
      return newHM;
    } catch (err: any) {
      setError(err?.message || "Failed to generate heatmap");
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      let sid = storeId || (typeof window !== "undefined" ? localStorage.getItem("selected_store_id") || "" : "");
      if (!sid) {
        try {
          const res = await api.get("/stores");
          if (res.data && res.data.length > 0) {
            sid = res.data[0].id;
            localStorage.setItem("selected_store_id", sid);
          }
        } catch (e) {}
      }
      if (sid) {
        fetchHeatmaps(sid);
      } else {
        setIsLoading(false);
      }
    };
    init();
  }, [storeId, fetchHeatmaps]);

  return {
    heatmaps,
    currentHeatmap,
    setCurrentHeatmap,
    isGenerating,
    isLoading,
    error,
    generateHeatmap,
    fetchHeatmaps,
  };
}

export default useHeatmap;
