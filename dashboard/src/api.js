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

export async function fetchHealth() {
  const { data } = await client.get("/health");
  return data;
}
