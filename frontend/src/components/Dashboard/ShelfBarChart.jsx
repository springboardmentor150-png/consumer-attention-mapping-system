import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

export default function ShelfBarChart({ data }) {
  return (
    <div className="bg-white rounded-lg shadow p-5 mt-5">
      <h2 className="text-xl font-bold mb-4">Shelf Views</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="shelf" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="views" fill="#2563eb" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
