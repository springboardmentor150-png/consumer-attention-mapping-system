export default function AnalyticsCards({ data }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow p-5">
        <h3>Total Customers</h3>
        <h1 className="text-3xl font-bold">{data.total_customers}</h1>
      </div>
      <div className="bg-white rounded-lg shadow p-5">
        <h3>Average Dwell</h3>
        <h1 className="text-3xl font-bold">{data.average_dwell}s</h1>
      </div>
      <div className="bg-white rounded-lg shadow p-5">
        <h3>Attention Score</h3>
        <h1 className="text-3xl font-bold">{data.attention_score}</h1>
      </div>
      <div className="bg-white rounded-lg shadow p-5">
        <h3>Most Viewed Shelf</h3>
        <h1 className="text-3xl font-bold">{data.most_viewed_shelf}</h1>
      </div>
    </div>
  );
}
