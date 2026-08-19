import useDashboardSocket from "../hooks/useDashboardSocket";

export default function LiveDashboard() {
  const data = useDashboardSocket();

  return (
    <div className="grid grid-cols-4 gap-5 mb-6">
      <div className="bg-white shadow rounded p-5">
        <h3>Customers</h3>
        <h1 className="text-4xl font-bold">{data.customers}</h1>
      </div>
      <div className="bg-white shadow rounded p-5">
        <h3>Average Dwell</h3>
        <h1 className="text-4xl font-bold">{data.dwell}s</h1>
      </div>
      <div className="bg-white shadow rounded p-5">
        <h3>Attention</h3>
        <h1 className="text-4xl font-bold">{data.attention}</h1>
      </div>
      <div className="bg-white shadow rounded p-5">
        <h3>Most Viewed</h3>
        <h1 className="text-2xl font-bold">{data.shelf}</h1>
      </div>
    </div>
  );
}
