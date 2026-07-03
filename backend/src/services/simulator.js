/**
 * Simulated device layer — room-aware.
 *
 * Every SIMULATION_INTERVAL_MS (default 5s), *if simulation is enabled*, one
 * random AUTO device is inspected and nudged toward its room's expected
 * occupancy: each room in data/devices.js declares how likely a device is to
 * be ON during office hours vs after hours (work rooms busy, drawing room
 * occasional). If the device already matches the drawn state nothing happens
 * that tick — offices don't flip switches constantly.
 *
 * Invariants:
 *  - only touches devices whose controlMode === "auto" (never manual ones)
 *  - only mutates devices already in the store (never creates rooms/devices)
 *  - never touches `wattage`
 *  - runs happily with zero connected clients (broadcast is a no-op then)
 */

const { devices, ROOMS } = require("../data/devices");
const { applyDeviceState } = require("./deviceService");
const { isSimulationEnabled, SIMULATION_INTERVAL_MS } = require("./simulationState");
const { isAfterHours } = require("./alertService");
const { broadcastState } = require("../socket");

// room name -> { officeHours, afterHours } ON-probability profile
const SIM_PROFILES = Object.fromEntries(ROOMS.map((r) => [r.name, r.simulation]));
const FALLBACK_PROFILE = { officeHours: 0.5, afterHours: 0.5 };

let timer = null;

function tick() {
  if (!isSimulationEnabled()) return;

  // Manual devices are off-limits; the user owns them.
  const autoDevices = devices.filter((d) => d.controlMode === "auto");
  if (autoDevices.length === 0) return; // everything is manual → nothing to do

  const device = autoDevices[Math.floor(Math.random() * autoDevices.length)];
  const profile = SIM_PROFILES[device.room] || FALLBACK_PROFILE;
  const pOn = isAfterHours() ? profile.afterHours : profile.officeHours;

  const wantsOn = Math.random() < pOn;
  const isOn = device.status === "on";
  if (wantsOn === isOn) return; // already in the expected state — quiet tick

  applyDeviceState(device, wantsOn);
  console.log(
    `[simulator] ${device.room} · ${device.name} → ${device.status.toUpperCase()}` +
      (device.status === "on" ? ` (${device.currentPower}W)` : "") +
      ` [p(on)=${pOn}]`
  );
  broadcastState();
}

function startSimulator() {
  if (timer) return;
  timer = setInterval(tick, SIMULATION_INTERVAL_MS);
  console.log(
    `[simulator] ready — nudges one random AUTO device toward its room's occupancy every ` +
      `${SIMULATION_INTERVAL_MS / 1000}s while simulation is enabled (currently ${
        isSimulationEnabled() ? "ON" : "OFF"
      })`
  );
}

function stopSimulator() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

module.exports = { startSimulator, stopSimulator };
