/**
 * REST client for the shared backend. The dashboard never invents device
 * state — everything shown comes from these endpoints or Socket.IO pushes.
 */

import axios from "axios";

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const client = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 5000,
});

export async function fetchDevices() {
  const { data } = await client.get("/devices");
  return data.devices;
}

export async function fetchRooms() {
  const { data } = await client.get("/rooms");
  return data.rooms;
}

export async function fetchUsage() {
  const { data } = await client.get("/usage");
  return data;
}

export async function fetchAlerts() {
  const { data } = await client.get("/alerts");
  return data.alerts;
}

export async function fetchSimulation() {
  const { data } = await client.get("/simulation");
  return data;
}

export async function fetchClock() {
  const { data } = await client.get("/clock");
  return data;
}

export async function fetchHealth() {
  const { data } = await client.get("/health");
  return data;
}

/* ---------- control actions (write to the backend, the source of truth) ----------
 * These never mutate local state directly. Callers await them, then let the
 * backend's Socket.IO broadcast update the UI — so the dashboard, the bot and
 * every other client always reflect exactly what the backend stored. */

export async function toggleDevice(id) {
  const { data } = await client.patch(`/devices/${encodeURIComponent(id)}/toggle`);
  return data.device;
}

export async function setDeviceState(id, on) {
  const { data } = await client.patch(`/devices/${encodeURIComponent(id)}/state`, {
    status: on ? "on" : "off",
  });
  return data.device;
}

export async function setDeviceMode(id, mode) {
  const { data } = await client.patch(`/devices/${encodeURIComponent(id)}/mode`, {
    mode,
  });
  return data.device;
}

export async function resetAllToAuto() {
  const { data } = await client.patch("/devices/reset-auto");
  return data.devices;
}

export async function turnAllOff() {
  const { data } = await client.patch("/devices/all-off");
  return data.devices;
}

export async function turnRoomOff(roomName) {
  const { data } = await client.patch(
    `/rooms/${encodeURIComponent(roomName)}/all-off`
  );
  return data.devices;
}

export async function setSimulation(enabled) {
  const { data } = await client.patch("/simulation", { enabled });
  return data;
}

/** Configure the office clock: { time: "18:30" } | { speed: 60 } | { reset: true } */
export async function setClock(payload) {
  const { data } = await client.patch("/clock", payload);
  return data;
}
