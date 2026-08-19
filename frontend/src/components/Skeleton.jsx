import '../styles/Skeleton.css';

export function Skeleton({ width, height, borderRadius, className = '', style = {} }) {
  const customStyle = {
    width: width || '100%',
    height: height || '20px',
    borderRadius: borderRadius || '8px',
    ...style,
  };

  return <div className={`skeleton-loader ${className}`} style={customStyle} />;
}

export function SkeletonHeader() {
  return (
    <div className="skeleton-header">
      <div>
        <Skeleton width="180px" height="14px" style={{ marginBottom: '8px' }} />
        <Skeleton width="260px" height="28px" />
      </div>
      <div className="skeleton-header-actions">
        <Skeleton width="110px" height="36px" borderRadius="20px" />
        <Skeleton width="36px" height="36px" borderRadius="50%" />
        <Skeleton width="36px" height="36px" borderRadius="50%" />
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-card-top">
        <div>
          <Skeleton width="90px" height="14px" style={{ marginBottom: '10px' }} />
          <Skeleton width="70px" height="26px" />
        </div>
        <Skeleton width="42px" height="42px" borderRadius="12px" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="skeleton-table-wrapper">
      <div className="skeleton-table-header">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} width={`${80 / cols}%`} height="18px" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} width={`${75 / cols}%`} height="16px" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ height = '280px' }) {
  return (
    <div className="skeleton-chart-card">
      <Skeleton width="160px" height="20px" style={{ marginBottom: '8px' }} />
      <Skeleton width="220px" height="14px" style={{ marginBottom: '20px' }} />
      <Skeleton width="100%" height={height} borderRadius="12px" />
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="skeleton-dashboard-page">
      <SkeletonHeader />
      <div className="skeleton-cards-grid">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="skeleton-grid-2">
        <SkeletonChart />
        <SkeletonChart />
      </div>
      <SkeletonTable rows={4} cols={5} />
    </div>
  );
}

export default Skeleton;
