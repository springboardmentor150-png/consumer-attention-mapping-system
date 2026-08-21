import { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { SkeletonChart } from '../components/Skeleton';
import '../styles/Dashboard.css';

export default function Heatmap() {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <DashboardLayout>
      <main className="dashboard-body" style={{ padding: '24px' }}>
        <header className="dashboard-header">
          <div>
            <h1>Store Attention Heatmap</h1>
            <p>Live shopper traffic density and attention hotspot visualization.</p>
          </div>
        </header>

        <section className="dashboard-card" style={{ marginTop: '20px' }}>
          <h3>Live Store Heatmap Grid</h3>
          <p className="dashboard-card-subtitle">Real-time shopper attention accumulation</p>

          {!imageLoaded && (
            <SkeletonChart height="400px" />
          )}

          <img
            src="http://127.0.0.1:8000/api/heatmaps/store"
            alt="Store Heatmap"
            style={{
              width: '100%',
              maxHeight: '500px',
              objectFit: 'cover',
              borderRadius: '12px',
              marginTop: '16px',
              display: imageLoaded ? 'block' : 'none',
            }}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
          />

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#64748b' }}>
            <span>Status: Active hot-spot tracking</span>
            <strong>Live store activity feed</strong>
          </div>
        </section>
      </main>
    </DashboardLayout>
  );
}
