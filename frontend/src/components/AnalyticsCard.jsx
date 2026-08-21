export default function AnalyticsCard({ label, value }) {
  return (
    <article className="analytics-card">
      <p className="analytics-card-label">{label}</p>
      <p className="analytics-card-value">{value}</p>
    </article>
  );
}
