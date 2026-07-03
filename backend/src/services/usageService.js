/**
 * Usage calculator — total power, per-room breakdown and today's estimated kWh.
 * Pure functions over the device list; no state of its own.
 */

const { ROOMS } = require("../data/devices");
const { getOfficeNow } = require("./clockService");

function round2(n) {
  return Math.round(n * 100) / 100;
}

function getTotalPower(devices) {
  return devices.reduce((sum, d) => sum + d.currentPower, 0);
}

function getTotalDevicesOn(devices) {
  return devices.filter((d) => d.status === "on").length;
}

function getPerRoomPower(devices) {
  return ROOMS.map(({ name }) => {
    const roomDevices = devices.filter((d) => d.room === name);
    return {
      room: name,
      powerWatts: roomDevices.reduce((sum, d) => sum + d.currentPower, 0),
      devicesOn: roomDevices.filter((d) => d.status === "on").length,
    };
  });
}

function getHoursElapsedToday(now = getOfficeNow()) {
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  return (now.getTime() - midnight.getTime()) / 3_600_000;
}

/**
 * Rough estimate mandated by the problem statement: extrapolate the *current*
 * total draw across the hours elapsed today. Documented as a known limitation
 * (a real meter would integrate power over time).
 */
function getEstimatedTodayKwh(devices, now = getOfficeNow()) {
  return round2((getTotalPower(devices) * getHoursElapsedToday(now)) / 1000);
}

function getUsageSummary(devices) {
  const now = getOfficeNow(); // office clock, so kWh/updatedAt track virtual time
  return {
    totalPowerWatts: getTotalPower(devices),
    devicesOn: getTotalDevicesOn(devices),
    totalDevices: devices.length,
    estimatedTodayKwh: getEstimatedTodayKwh(devices, now),
    hoursElapsedToday: round2(getHoursElapsedToday(now)),
    perRoom: getPerRoomPower(devices),
    updatedAt: now.toISOString(),
  };
}

module.exports = {
  getTotalPower,
  getTotalDevicesOn,
  getPerRoomPower,
  getEstimatedTodayKwh,
  getUsageSummary,
};
