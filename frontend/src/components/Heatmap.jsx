export default function Heatmap() {
  return (
    <section className="panel-card">
      <div className="panel-header">
        <h2>Heatmap</h2>
        <span>Peak attention zones</span>
      </div>
      <img src="http://127.0.0.1:8000/api/heatmap/latest" alt="Heatmap" className="panel-image" />
      <div className="heatmap-summary">
        <div className="status-row">
          <span>Peak Attention</span>
          <strong>87%</strong>
        </div>
        <div className="status-row">
          <span>Most Viewed Shelf</span>
          <strong>Shelf A</strong>
        </div>
        <div className="status-row">
          <span>Hot Zone</span>
          <strong>Aisle 3</strong>
        </div>
      </div>
    </section>
  );
}
