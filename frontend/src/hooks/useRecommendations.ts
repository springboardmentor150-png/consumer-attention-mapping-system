"use client";

import { useState, useEffect, useCallback } from "react";
import recommendationService from "../services/recommendationService";
import { RecommendationItem, StoreRecommendationSummary } from "../types";
import api from "../services/api";

export function useRecommendations(storeId?: string) {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [summary, setSummary] = useState<StoreRecommendationSummary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecs = useCallback(async (sid: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const recs = await recommendationService.getStoreRecommendations(sid);
      setRecommendations(recs);
    } catch (err: any) {
      setError(err?.message || "Failed to load recommendations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateRecs = async (sid: string) => {
    setIsGenerating(true);
    setError(null);
    try {
      const sum = await recommendationService.generateRecommendations(sid);
      setSummary(sum);
      setRecommendations(sum.recommendations || []);
      return sum;
    } catch (err: any) {
      setError(err?.message || "Failed to generate recommendations");
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const dismissRec = async (id: string) => {
    try {
      await recommendationService.dismissRecommendation(id);
      setRecommendations((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      setError(err?.message || "Failed to dismiss recommendation");
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
        fetchRecs(sid);
      } else {
        setIsLoading(false);
      }
    };
    init();
  }, [storeId, fetchRecs]);

  return {
    recommendations,
    summary,
    isGenerating,
    isLoading,
    error,
    generateRecs,
    dismissRec,
    fetchRecs,
  };
}

export default useRecommendations;
