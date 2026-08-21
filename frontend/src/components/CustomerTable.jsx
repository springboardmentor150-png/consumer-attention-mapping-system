import { useEffect, useState } from "react";

export default function CustomerTable() {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const socket = new WebSocket("ws://127.0.0.1:8000/ws/dashboard");

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setCustomers((prev) => [
        {
          id: Date.now(),
          customers: data.customers,
          dwell: data.dwell,
          attention: data.attention,
        },
        ...prev.slice(0, 9),
      ]);
    };

    return () => socket.close();
  }, []);

  return (
    <table className="table-auto w-full mt-5 bg-white shadow rounded overflow-hidden">
      <thead>
        <tr className="bg-gray-100">
          <th className="px-4 py-2 text-left">ID</th>
          <th className="px-4 py-2 text-left">Customers</th>
          <th className="px-4 py-2 text-left">Dwell</th>
          <th className="px-4 py-2 text-left">Attention</th>
        </tr>
      </thead>
      <tbody>
        {customers.map((item) => (
          <tr key={item.id} className="border-t">
            <td className="px-4 py-2">{item.id}</td>
            <td className="px-4 py-2">{item.customers}</td>
            <td className="px-4 py-2">{item.dwell}</td>
            <td className="px-4 py-2">{item.attention}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
