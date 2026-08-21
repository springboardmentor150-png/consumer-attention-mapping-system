'use client';

import { ActiveShopperInfo } from '../../types';

interface Props {
  shopper: ActiveShopperInfo;
}

function getDirection(yaw?: number): string {
  if (yaw === undefined || yaw === null) return 'Unknown';
  if (yaw < -15) return '← Left';
  if (yaw > 15) return 'Right →';
  return '↑ Center';
}

function getDirectionColor(yaw?: number): string {
  if (yaw === undefined || yaw === null) return '#4a6080';
  if (yaw < -15 || yaw > 15) return '#f59e0b';
  return '#10b981';
}

export default function DwellTimeCard({ shopper }: Props) {
  const { tracker_id, current_dwell_seconds, is_looking_at_shelf, head_yaw } = shopper;
  const mins = Math.floor(current_dwell_seconds / 60);
  const secs = Math.floor(current_dwell_seconds % 60);
  const dwellLabel = mins > 0 ? `${mins}m ${secs}s` : `${secs.toFixed(1)}s`;

  return (
    <div style={{
      background: 'rgba(13,21,38,0.85)',
      border: `1px solid ${is_looking_at_shelf ? 'rgba(16,185,129,0.35)' : 'rgba(30,45,74,0.5)'}`,
      borderRadius: 12,
      padding: 16,
      boxShadow: is_looking_at_shelf ? '0 0 16px rgba(16,185,129,0.15)' : 'none',
      transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#e2e8f0' }}>
          Shopper #{tracker_id}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
          background: is_looking_at_shelf ? 'rgba(16,185,129,0.15)' : 'rgba(74,96,128,0.15)',
          color: is_looking_at_shelf ? '#34d399' : '#4a6080',
          border: `1px solid ${is_looking_at_shelf ? 'rgba(16,185,129,0.3)' : 'rgba(74,96,128,0.3)'}`,
        }}>
          {is_looking_at_shelf ? '● ENGAGED' : '○ BROWSING'}
        </span>
      </div>

      {/* Dwell Time */}
      <div style={{
        fontSize: 28, fontWeight: 900,
        color: is_looking_at_shelf ? '#34d399' : '#8ba3c7',
        letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 10,
      }}>
        {dwellLabel}
      </div>

      {/* Shelf Gaze Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <svg width="14" height="14" fill="none" stroke={is_looking_at_shelf ? '#34d399' : '#4a6080'} strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
        <span style={{ fontSize: 12, color: is_looking_at_shelf ? '#34d399' : '#4a6080', fontWeight: 600 }}>
          Looking at shelf: {is_looking_at_shelf ? 'Yes' : 'No'}
        </span>
      </div>

      {/* Head Direction */}
      {head_yaw !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#4a6080' }}>Direction</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: getDirectionColor(head_yaw) }}>
            {getDirection(head_yaw)} ({head_yaw.toFixed(1)}°)
          </span>
        </div>
      )}
    </div>
  );
}
