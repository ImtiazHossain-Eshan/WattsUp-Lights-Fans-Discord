/**
 * Simulation control state — the on/off switch for the simulated device layer.
 *
 * Kept in its own tiny module (depends only on the device store) so both the
 * simulator and socket.js can read it without a circular dependency.
 *
 * Defaults to ON so the demo animates out of the box; set SIMULATION_ENABLED=false
 * to boot paused (devices then only change through manual control).
 */

const { devices, ROOMS } = require("../data/devices");

const SIMULATION_INTERVAL_MS =
  Number.parseInt(process.env.SIMULATION_INTERVAL_MS, 10) || 5000;

let enabled =
  process.env.SIMULATION_ENABLED === undefined
    ? true
    : process.env.SIMULATION_ENABLED !== "false";

function isSimulationEnabled() {
  return enabled;
}

function setSimulationEnabled(value) {
  enabled = Boolean(value);
  return getSimulationState();
}

/** Serializable snapshot for GET /api/simulation and the `simulation:update` event. */
function getSimulationState() {
  return {
    enabled,
    intervalMs: SIMULATION_INTERVAL_MS,
    autoDevices: devices.filter((d) => d.controlMode === "auto").length,
    manualDevices: devices.filter((d) => d.controlMode === "manual").length,
    totalDevices: devices.length,
    // Per-room ON-probability profile the simulator uses (office vs after hours).
    roomActivity: ROOMS.map((r) => ({ room: r.name, ...r.simulation })),
  };
}

module.exports = {
  SIMULATION_INTERVAL_MS,
  isSimulationEnabled,
  setSimulationEnabled,
  getSimulationState,
};
