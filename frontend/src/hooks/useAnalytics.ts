'use client';

import { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '../services/analyticsService';
import {
  DashboardAnalytics,
  ShelfAttentionSummary,
  ZoneTrafficSummary,
  HourlyTrafficPoint,
} from '../types';

export default function useAnalytics(storeId?: string) {
  const [dashboardData, setDashboardData] = useState<DashboardAnalytics | null>(null);
  const [shelfRankings, setShelfRankings] = useState<ShelfAttentionSummary[]>([]);
  const [zoneTraffic, setZoneTraffic] = useState<ZoneTrafficSummary[]>([]);
  const [hourlyTraffic, setHourlyTraffic] = useState<HourlyTrafficPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (sid: string, period: string = 'today') => {
    setIsLoading(true);
    setError(null);
    try {
      const report = await analyticsService.getDashboardData(sid, period);
      if (report?.data) {
        setDashboardData(report.data);
      }
      const shelves = await analyticsService.getShelfRankings(sid);
      setShelfRankings(shelves);
      const zones = await analyticsService.getZoneTraffic(sid);
      setZoneTraffic(zones);
      const hourly = await analyticsService.getHourlyTraffic(sid);
      setHourlyTraffic(hourly);
    } catch (err: any) {
      setError(err?.message || 'Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const sid = storeId || (typeof window !== 'undefined' ? localStorage.getItem('selected_store_id') || '' : '');
    if (!sid) {
      setIsLoading(false);
      return;
    }
    fetchDashboard(sid);
    const interval = setInterval(() => fetchDashboard(sid), 30000);
    return () => clearInterval(interval);
  }, [storeId, fetchDashboard]);

  return {
    dashboardData,
    shelfRankings,
    zoneTraffic,
    hourlyTraffic,
    isLoading,
    error,
    fetchDashboard,
  };
}
