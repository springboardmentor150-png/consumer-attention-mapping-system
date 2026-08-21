'use client';

import useAnalytics from '../../hooks/useAnalytics';
import AttentionBarChart from '../analytics/AttentionBarChart';
import DwellTimeChart from '../analytics/DwellTimeChart';
import TrackingOverlay from '../tracking/TrackingOverlay';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface Props {
  storeId?: string;
}

function KPICard({ title, value, sub, icon, color, gradient }: any) {
  return (
    <div style={{
      background: 'rgba(13,21,38,0.8)', border: '1px solid rgba(30,45,74,0.6)',
      borderRadius: 14, padding: '20px 22px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: gradient || 'linear-gradient(90deg,#6366f1,#8b5cf6)',
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{
          padding: 10, background: 'rgba(5,15,35,0.8)',
          borderRadius: 10, border: '1px solid rgba(30,45,74,0.6)',
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: color || '#f0f4ff', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#8ba3c7', marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 11, color: '#2a3f60' }}>{sub}</div>
    </div>
  );
}

function formatDwell(seconds: number) {
  if (!seconds) return '0s';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function StoreManagerDashboard({ storeId = '' }: Props) {
  const { dashboardData, shelfRankings, hourlyTraffic, isLoading, error } = useAnalytics(storeId);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totalVisitors = dashboardData?.total_visitors ?? 0;
  const avgDwell = dashboardData?.avg_dwell_time_seconds ?? 0;
  const activeNow = dashboardData?.active_shoppers_now ?? 0;
  const topShelf = dashboardData?.top_attention_shelves?.[0]?.shelf_name ?? 'None';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Error Banner */}
      {error && (
        <div style={{
          background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
          borderRadius: 10, padding: '12px 16px', color: '#fb7185', fontSize: 13,
        }}>
          ⚠️ Analytics unavailable: {error}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <KPICard
          title="Total Visitors Today"
          value={totalVisitors.toLocaleString()}
          sub="Unique shoppers tracked"
          gradient="linear-gradient(90deg,#3b82f6,#6366f1)"
          color="#60a5fa"
          icon={<svg width="20" height="20" fill="none" stroke="#60a5fa" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
        />
        <KPICard
          title="Avg Dwell Time"
          value={formatDwell(avgDwell)}
          sub="Per shopper session"
          gradient="linear-gradient(90deg,#10b981,#06b6d4)"
          color="#34d399"
          icon={<svg width="20" height="20" fill="none" stroke="#34d399" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
        />
        <KPICard
          title="Active Shoppers Now"
          value={activeNow}
          sub="Currently in store"
          gradient="linear-gradient(90deg,#f59e0b,#ef4444)"
          color="#fbbf24"
          icon={<svg width="20" height="20" fill="none" stroke="#fbbf24" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>}
        />
        <KPICard
          title="Top Attention Shelf"
          value={topShelf}
          sub="Highest engagement today"
          gradient="linear-gradient(90deg,#8b5cf6,#ec4899)"
          color="#c084fc"
          icon={<svg width="20" height="20" fill="none" stroke="#c084fc" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>}
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{
          background: 'rgba(13,21,38,0.7)', border: '1px solid rgba(30,45,74,0.6)',
          borderRadius: 16, padding: 24,
        }}>
          <AttentionBarChart data={shelfRankings} title="Shelf Attention Rankings" />
        </div>
        <div style={{
          background: 'rgba(13,21,38,0.7)', border: '1px solid rgba(30,45,74,0.6)',
          borderRadius: 16, padding: 24,
        }}>
          <DwellTimeChart data={hourlyTraffic} title="Hourly Traffic Distribution" />
        </div>
      </div>

      {/* Live Tracking Overlay */}
      <TrackingOverlay storeId={storeId} />
    </div>
  );
}
