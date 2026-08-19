import { useState } from "react";

export default function ReportFilters() {
  const [store, setStore] = useState("");
  const [date, setDate] = useState("");

  return (
    <div className="flex gap-5 mb-6">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="border p-2 rounded"
      />
      <select value={store} onChange={(e) => setStore(e.target.value)} className="border p-2 rounded">
        <option value="">Select Store</option>
        <option value="Store A">Store A</option>
        <option value="Store B">Store B</option>
        <option value="Store C">Store C</option>
      </select>
    </div>
  );
}
