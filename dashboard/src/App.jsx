import { useEffect, useState } from "react";
import DashboardShell from "./components/DashboardShell.jsx";
import { fetchDevices, fetchRooms, fetchUsage, fetchAlerts, BACKEND_URL } from "./api";
import { socket } from "./socket";

export default function App() {
  const [devices, setDevices] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [usage, setUsage] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let disposed = false;

    // Initial snapshot over REST; afterwards Socket.IO keeps everything live.
    async function loadInitial() {
      try {
        const [d, r, u, a] = await Promise.all([
          fetchDevices(),
          fetchRooms(),
          fetchUsage(),
          fetchAlerts(),
        ]);
        if (disposed) return;
        setDevices(d);
        setRooms(r);
        setUsage(u);
        setAlerts(a);
        setError(null);
      } catch {
        if (!disposed) {
          setError(
            `Cannot reach the backend at ${BACKEND_URL}. Start it with "npm run dev" inside /backend — the dashboard reconnects automatically.`
          );
        }
      } finally {
        if (!disposed) setLoading(false);
      }
    }

    const onConnect = () => {
      setConnected(true);
      setError(null);
      loadInitial(); // refresh in case updates were missed while offline
    };
    const onDisconnect = () => setConnected(false);
    const onConnectError = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("devices:update", setDevices);
    socket.on("rooms:update", setRooms);
    socket.on("usage:update", setUsage);
    socket.on("alerts:update", setAlerts);

    socket.connect();
    loadInitial();

    return () => {
      disposed = true;
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("devices:update", setDevices);
      socket.off("rooms:update", setRooms);
      socket.off("usage:update", setUsage);
      socket.off("alerts:update", setAlerts);
      socket.disconnect();
    };
  }, []);

  return (
    <DashboardShell
      devices={devices}
      rooms={rooms}
      usage={usage}
      alerts={alerts}
      connected={connected}
      loading={loading}
      error={error}
    />
  );
}
