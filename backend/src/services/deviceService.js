/**
 * Device mutation layer — the ONE place that changes device on/off state and
 * control mode. Both the simulator and the manual-control routes go through
 * these helpers so `status`, `currentPower`, `lastChanged` and `turnedOnAt`
 * always stay consistent.
 *
 * Manual actions (user turning a device on/off) additionally pin the device to
 * `controlMode: "manual"` so the simulator won't overwrite the user's choice.
 */

const { devices } = require("../data/devices");
const { getOfficeNow } = require("./clockService");

function findDevice(id) {
  return devices.find((d) => d.id === id) || null;
}

/**
 * Apply an explicit ON/OFF state, keeping power and timestamps consistent.
 * `turnedOnAt` marks the start of the *current* ON session, so it's only
 * (re)stamped on an off→on transition and cleared when turned off. Used by the
 * simulator (auto) and by manual control alike.
 */
function applyDeviceState(device, isOn, now = getOfficeNow()) {
  const turningOn = Boolean(isOn);
  const wasOn = device.status === "on";
  const iso = now.toISOString();

  device.status = turningOn ? "on" : "off";
  device.currentPower = turningOn ? device.wattage : 0;
  device.lastChanged = iso;
  device.turnedOnAt = turningOn ? (wasOn ? device.turnedOnAt : iso) : null;
  return device;
}

/** Manual set: apply the state AND hand control to the user (manual mode). */
function manualSetState(device, isOn, now = getOfficeNow()) {
  applyDeviceState(device, isOn, now);
  device.controlMode = "manual";
  return device;
}

/** Manual toggle: flip on↔off and pin to manual. */
function manualToggle(device, now = getOfficeNow()) {
  return manualSetState(device, device.status !== "on", now);
}

/** Switch a single device's control mode without touching its on/off state. */
function setControlMode(device, mode) {
  device.controlMode = mode === "manual" ? "manual" : "auto";
  return device;
}

/** Hand every device back to the simulator (auto), leaving on/off state as-is. */
function resetAllToAuto() {
  for (const d of devices) d.controlMode = "auto";
  return devices;
}

/**
 * Turn every device off and pin them to manual, so they stay off even while the
 * simulation is running (otherwise the simulator would flip them back on).
 * "Reset all to Auto" hands them back to the simulator afterwards.
 */
function turnAllOff(now = getOfficeNow()) {
  for (const d of devices) manualSetState(d, false, now);
  return devices;
}

/** Same as turnAllOff but scoped to one (already-canonical) room name. */
function turnRoomOff(roomName, now = getOfficeNow()) {
  const roomDevices = devices.filter((d) => d.room === roomName);
  for (const d of roomDevices) manualSetState(d, false, now);
  return roomDevices;
}

module.exports = {
  findDevice,
  applyDeviceState,
  manualSetState,
  manualToggle,
  setControlMode,
  resetAllToAuto,
  turnAllOff,
  turnRoomOff,
};
