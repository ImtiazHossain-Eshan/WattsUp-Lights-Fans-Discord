/**
 * Simulated device layer.
 *
 * Every SIMULATION_INTERVAL_MS (default 5s) one random device is toggled and
 * the full derived state (rooms, usage, alerts) is rebroadcast over Socket.IO.
 *
 * Invariants:
 *  - only mutates devices already in the store (never creates rooms/devices)
 *  - never touches `wattage`
 *  - runs happily with zero connected clients (io.emit is a no-op then)
 */

const { devices } = require("../data/devices");
const { emitState } = require("../socket");

const SIMULATION_INTERVAL_MS =
  Number.parseInt(process.env.SIMULATION_INTERVAL_MS, 10) || 5000;

let timer = null;

function toggleDevice(device, now = new Date()) {
  const turningOn = device.status === "off";
  device.status = turningOn ? "on" : "off";
  device.currentPower = turningOn ? device.wattage : 0;
  device.lastChanged = now.toISOString();
  device.turnedOnAt = turningOn ? now.toISOString() : null;
}

function tick(io) {
  const device = devices[Math.floor(Math.random() * devices.length)];
  toggleDevice(device);
  console.log(
    `[simulator] ${device.room} · ${device.name} → ${device.status.toUpperCase()}` +
      (device.status === "on" ? ` (${device.currentPower}W)` : "")
  );
  emitState(io);
}

function startSimulator(io) {
  if (timer) return;
  timer = setInterval(() => tick(io), SIMULATION_INTERVAL_MS);
  console.log(
    `[simulator] running — toggling one random device every ${SIMULATION_INTERVAL_MS / 1000}s`
  );
}

function stopSimulator() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

module.exports = { startSimulator, stopSimulator };
