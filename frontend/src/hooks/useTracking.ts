'use client';

import { useState, useEffect, useCallback } from 'react';
import { trackingService } from '../services/trackingService';
import { TrackingSession, ActiveShopperInfo } from '../types';

export default function useTracking() {
  const [activeSessions, setActiveSessions] = useState<TrackingSession[]>([]);
  const [activeShoppers, setActiveShoppers] = useState<ActiveShopperInfo[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startTracking = useCallback(async (cameraId: string, storeId: string, videoSource: string) => {
    try {
      setIsLoading(true);
      await trackingService.startTracking(cameraId, storeId, videoSource);
      setIsTracking(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to start tracking');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopTracking = useCallback(async (sessionId: string) => {
    try {
      setIsLoading(true);
      await trackingService.stopTracking(sessionId);
      setIsTracking(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to stop tracking');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSessions = useCallback(async (storeId: string) => {
    try {
      const sessions = await trackingService.getTrackingSessions(storeId);
      setActiveSessions(sessions);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch sessions');
    }
  }, []);

  const fetchActiveShoppers = useCallback(async (storeId: string) => {
    try {
      const shoppers = await trackingService.getActiveSessions(storeId);
      setActiveShoppers(shoppers);
      if (shoppers.length > 0) setIsTracking(true);
    } catch {
      // Silently fail — no active sessions is a valid state
    }
  }, []);

  useEffect(() => {
    if (!isTracking) return;
    const storeId = typeof window !== 'undefined' ? localStorage.getItem('selected_store_id') || '' : '';
    if (!storeId) return;
    const interval = setInterval(() => fetchActiveShoppers(storeId), 5000);
    return () => clearInterval(interval);
  }, [isTracking, fetchActiveShoppers]);

  return {
    activeSessions,
    activeShoppers,
    isTracking,
    isLoading,
    error,
    startTracking,
    stopTracking,
    fetchSessions,
    fetchActiveShoppers,
  };
}
