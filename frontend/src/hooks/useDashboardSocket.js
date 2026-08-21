import { useEffect, useState } from "react";

export default function useDashboardSocket() {
  const [data, setData] = useState({
    customers: 0,
    dwell: 0,
    attention: 0,
    shelf: "",
  });

  useEffect(() => {
    const socket = new WebSocket("ws://127.0.0.1:8000/ws/dashboard");

    socket.onmessage = (event) => {
      const response = JSON.parse(event.data);
      setData(response);
    };

    socket.onclose = () => {
      console.warn("Dashboard websocket closed");
    };

    return () => socket.close();
  }, []);

  return data;
}
