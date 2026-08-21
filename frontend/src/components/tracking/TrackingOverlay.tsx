'use client';

import { useState, useEffect } from 'react';
import useTracking from '../../hooks/useTracking';
import DwellTimeCard from './DwellTimeCard';

interface Props {
  storeId: string;
}

export default function TrackingOverlay({ storeId }: Props) {
  const { activeShoppers, isTracking, fetchActiveShoppers } = useTracking();
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    if (!storeId) return;
    fetchActiveShoppers(storeId);
    const interval = setInterval(() => {
      fetchActiveShoppers(storeId);
      setLastUpdated(new Date().toLocaleTimeString());
    }, 5000);
    return () => clearInterval(interval);
  }, [storeId, fetchActiveShoppers]);

  return (
    <div style={{
      background: 'rgba(13,21,38,0.7)',
      border: '1px solid rgba(30,45,74,0.6)',
      borderRadius: 16,
      padding: 24,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#e2e8f0', marginBottom: 4 }}>
            Active Shoppers
          </h2>
          {lastUpdated && (
            <p style={{ fontSize: 10, color: '#2a3f60' }}>Last updated: {lastUpdated}</p>
          )}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: activeShoppers.length > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(74,96,128,0.1)',
          border: `1px solid ${activeShoppers.length > 0 ? 'rgba(16,185,129,0.3)' : 'rgba(74,96,128,0.3)'}`,
          borderRadius: 10, padding: '6px 14px',
        }}>
          {activeShoppers.length > 0 && (
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', animation: 'pulse 2s infinite' }} />
          )}
          <span style={{
            fontSize: 13, fontWeight: 800,
            color: activeShoppers.length > 0 ? '#34d399' : '#4a6080',
          }}>
            {activeShoppers.length} Active
          </span>
        </div>
      </div>

      {/* No tracking message */}
      {activeShoppers.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '32px 24px',
          background: 'rgba(5,15,35,0.4)', borderRadius: 12,
          border: '1px dashed rgba(30,45,74,0.5)',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📷</div>
          <div style={{ fontSize: 14, color: '#8ba3c7', fontWeight: 600, marginBottom: 8 }}>
            No Active Tracking Session
          </div>
          <div style={{ fontSize: 12, color: '#4a6080', lineHeight: 1.6 }}>
            Run the tracking script to start:<br />
            <code style={{
              background: 'rgba(30,45,74,0.5)', color: '#60a5fa',
              padding: '2px 8px', borderRadius: 4, fontSize: 11, marginTop: 8, display: 'inline-block',
            }}>
              python scripts/run_tracking.py --source 0
            </code>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12,
        }}>
          {activeShoppers.map(shopper => (
            <DwellTimeCard key={shopper.tracker_id} shopper={shopper} />
          ))}
        </div>
      )}
    </div>
  );
}
