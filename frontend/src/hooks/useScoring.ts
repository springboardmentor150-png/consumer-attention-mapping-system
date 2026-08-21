"use client";

import { useState, useEffect, useCallback } from "react";
import scoringService from "../services/scoringService";
import { StoreScoreReport, ProductScoreDetail } from "../types";
import api from "../services/api";

export function useScoring(storeId?: string) {
  const [scoreReport, setScoreReport] = useState<StoreScoreReport | null>(null);
  const [topProducts, setTopProducts] = useState<ProductScoreDetail[]>([]);
  const [lowProducts, setLowProducts] = useState<ProductScoreDetail[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScores = useCallback(async (sid: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const report = await scoringService.getScoreReport(sid);
      setScoreReport(report);
      setTopProducts((report.top_performers || []).map((r) => r.product));
      setLowProducts((report.low_performers || []).map((r) => r.product));
    } catch (err: any) {
      setError(err?.message || "Failed to load product scores");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const calculateScores = async (sid: string, period: string = "week") => {
    setIsCalculating(true);
    setError(null);
    try {
      const report = await scoringService.calculateStoreScores(sid, period);
      setScoreReport(report);
      setTopProducts((report.top_performers || []).map((r) => r.product));
      setLowProducts((report.low_performers || []).map((r) => r.product));
      return report;
    } catch (err: any) {
      setError(err?.message || "Failed to calculate scores");
      throw err;
    } finally {
      setIsCalculating(false);
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
        fetchScores(sid);
      } else {
        setIsLoading(false);
      }
    };
    init();
  }, [storeId, fetchScores]);

  return {
    scoreReport,
    topProducts,
    lowProducts,
    isCalculating,
    isLoading,
    error,
    calculateScores,
    fetchScores,
  };
}

export default useScoring;
