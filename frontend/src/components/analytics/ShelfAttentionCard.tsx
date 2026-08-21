'use client';

import { ShelfAttentionSummary } from '../../types';

interface Props {
  shelf: ShelfAttentionSummary;
  rank: number;
  maxAttention: number;
}

const RANK_STYLES: Record<number, { badge: string; color: string; glow: string }> = {
  1: { badge: '🥇', color: '#f59e0b', glow: 'rgba(245,158,11,0.3)' },
  2: { badge: '🥈', color: '#94a3b8', glow: 'rgba(148,163,184,0.3)' },
  3: { badge: '🥉', color: '#cd7c3a', glow: 'rgba(205,124,58,0.3)' },
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function ShelfAttentionCard({ shelf, rank, maxAttention }: Props) {
  const rankStyle = RANK_STYLES[rank] || { badge: `#${rank}`, color: '#4a6080', glow: 'rgba(74,96,128,0.2)' };
  const progress = maxAttention > 0 ? (shelf.total_attention_seconds / maxAttention) * 100 : 0;

  const progressColor = rank === 1
    ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
    : rank === 2
    ? 'linear-gradient(90deg, #6366f1, #8b5cf6)'
    : rank === 3
    ? 'linear-gradient(90deg, #10b981, #06b6d4)'
    : 'linear-gradient(90deg, #3b82f6, #6366f1)';

  return (
    <div style={{
      background: 'rgba(13,21,38,0.8)',
      border: `1px solid ${rank <= 3 ? rankStyle.glow : 'rgba(30,45,74,0.5)'}`,
      borderRadius: 14,
      padding: 20,
      position: 'relative',
      boxShadow: rank <= 3 ? `0 0 20px ${rankStyle.glow}` : 'none',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}>
      {/* Rank Badge */}
      <div style={{
        position: 'absolute', top: 14, right: 14,
        fontSize: rank <= 3 ? 20 : 13,
        color: rankStyle.color, fontWeight: 800,
      }}>
        {rankStyle.badge}
      </div>

      {/* Shelf Name */}
      <div style={{ fontSize: 15, fontWeight: 800, color: '#e2e8f0', marginBottom: 12, paddingRight: 32 }}>
        {shelf.shelf_name}
      </div>

      {/* Progress Bar */}
      <div style={{ background: 'rgba(30,45,74,0.5)', borderRadius: 4, height: 6, marginBottom: 14 }}>
        <div style={{
          width: `${Math.min(100, progress)}%`,
          height: '100%',
          background: progressColor,
          borderRadius: 4,
          transition: 'width 0.6s ease',
        }} />
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: rankStyle.color }}>
            {formatDuration(shelf.total_attention_seconds)}
          </div>
          <div style={{ fontSize: 10, color: '#4a6080', marginTop: 2 }}>Total Attention</div>
        </div>
        <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(30,45,74,0.5)', borderRight: '1px solid rgba(30,45,74,0.5)' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#60a5fa' }}>
            {shelf.unique_viewers}
          </div>
          <div style={{ fontSize: 10, color: '#4a6080', marginTop: 2 }}>Unique Viewers</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#34d399' }}>
            {shelf.avg_dwell_seconds.toFixed(1)}s
          </div>
          <div style={{ fontSize: 10, color: '#4a6080', marginTop: 2 }}>Avg Dwell</div>
        </div>
      </div>
    </div>
  );
}
