import { useCallback, useEffect, useRef, useState } from "react";
import DashboardShell from "./components/DashboardShell.jsx";
import {
  fetchDevices,
  fetchRooms,
  fetchUsage,
  fetchAlerts,
  fetchSimulation,
  fetchClock,
  toggleDevice,
  setDeviceMode,
  setSimulation,
  setClock,
  resetAllToAuto,
  turnAllOff,
  turnRoomOff,
  BACKEND_URL,
} from "./api";
import { socket } from "./socket";
import { syncOfficeClock } from "./officeClock";

export default function App() {
  const [devices, setDevices] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [usage, setUsage] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [simulation, setSimulationState] = useState(null);
  const [clock, setClockState] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Guards against overlapping control requests (each waits on the backend).
  const inFlight = useRef(false);

  useEffect(() => {
    let disposed = false;

    // Initial snapshot over REST; afterwards Socket.IO keeps everything live.
    async function loadInitial() {
      try {
        const [d, r, u, a, s, c] = await Promise.all([
          fetchDevices(),
          fetchRooms(),
          fetchUsage(),
          fetchAlerts(),
          fetchSimulation(),
          fetchClock(),
        ]);
        if (disposed) return;
        setDevices(d);
        setRooms(r);
        setUsage(u);
        setAlerts(a);
        setSimulationState(s);
        syncOfficeClock(c);
        setClockState(c);
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
    const onClock = (state) => {
      syncOfficeClock(state); // keep the local ticking clock in step first
      setClockState(state);
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
    socket.on("simulation:update", setSimulationState);
    socket.on("clock:update", onClock);

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
      socket.off("simulation:update", setSimulationState);
      socket.off("clock:update", onClock);
      socket.disconnect();
    };
  }, []);

  /**
   * Run a control action: call the backend first, then let its Socket.IO
   * broadcast update the UI. We never mutate device state locally here — the
   * backend stays the single source of truth.
   */
  const runAction = useCallback(async (fn, failMessage) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setActionError(null);
    try {
      await fn();
    } catch (err) {
      const detail = err?.response?.data?.message || err?.message || "";
      setActionError(`${failMessage}${detail ? ` (${detail})` : ""}`);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }, []);

  const actions = {
    toggleDevice: (id) =>
      runAction(() => toggleDevice(id), "Couldn't toggle that device"),
    setDeviceMode: (id, mode) =>
      runAction(() => setDeviceMode(id, mode), "Couldn't change control mode"),
    toggleSimulation: (enabled) =>
      runAction(() => setSimulation(enabled), "Couldn't change the simulation"),
    resetAllToAuto: () =>
      runAction(() => resetAllToAuto(), "Couldn't reset devices to Auto"),
    turnAllOff: () => runAction(() => turnAllOff(), "Couldn't turn all devices off"),
    turnRoomOff: (roomName) =>
      runAction(() => turnRoomOff(roomName), `Couldn't turn off ${roomName}`),
    setClockTime: (time) =>
      runAction(() => setClock({ time }), "Couldn't set the office time"),
    setClockSpeed: (speed) =>
      runAction(() => setClock({ speed }), "Couldn't change the clock speed"),
    resetClock: () =>
      runAction(() => setClock({ reset: true }), "Couldn't reset the office clock"),
  };

  return (
    <DashboardShell
      devices={devices}
      rooms={rooms}
      usage={usage}
      alerts={alerts}
      simulation={simulation}
      clock={clock}
      connected={connected}
      loading={loading}
      error={error}
      busy={busy}
      actionError={actionError}
      actions={actions}
    />
  );
}
