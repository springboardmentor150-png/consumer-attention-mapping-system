"use client";

import { useState, useEffect, useCallback } from "react";
import behaviorService from "../services/behaviorService";
import { StoreSegmentSummary, SegmentDistribution } from "../types";

import api from "../services/api";

export function useBehavior(storeId?: string) {
  const [segmentSummary, setSegmentSummary] = useState<StoreSegmentSummary | null>(null);
  const [distribution, setDistribution] = useState<SegmentDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSegments = useCallback(async (sid: string, period: string = "week") => {
    setIsLoading(true);
    setError(null);
    try {
      const summary = await behaviorService.getSegmentSummary(sid, period);
      setSegmentSummary(summary);
      setDistribution(summary.segments || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load behavior segments");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const classifySessions = async (sid: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await behaviorService.classifyStoreSessions(sid);
      await fetchSegments(sid);
    } catch (err: any) {
      setError(err?.message || "Failed to classify sessions");
    } finally {
      setIsLoading(false);
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
        fetchSegments(sid);
      } else {
        setIsLoading(false);
      }
    };
    init();
  }, [storeId, fetchSegments]);

  return {
    segmentSummary,
    distribution,
    isLoading,
    error,
    fetchSegments,
    classifySessions,
  };
}

export default useBehavior;
