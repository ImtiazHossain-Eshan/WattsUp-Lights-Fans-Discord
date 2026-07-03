/**
 * Room summaries — per-room device grouping with power and ON counts.
 */

const { ROOMS } = require("../data/devices");

function summarizeRoom(roomMeta, devices) {
  const roomDevices = devices.filter((d) => d.room === roomMeta.name);
  return {
    room: roomMeta.name,
    description: roomMeta.description,
    type: roomMeta.type,
    expectedUsage: roomMeta.expectedUsage,
    fansOn: roomDevices.filter((d) => d.type === "fan" && d.status === "on").length,
    lightsOn: roomDevices.filter((d) => d.type === "light" && d.status === "on").length,
    devicesOn: roomDevices.filter((d) => d.status === "on").length,
    totalDevices: roomDevices.length,
    totalPower: roomDevices.reduce((sum, d) => sum + d.currentPower, 0),
    devices: roomDevices,
  };
}

function getRoomSummaries(devices) {
  return ROOMS.map((room) => summarizeRoom(room, devices));
}

/** roomName must already be canonical (use utils/roomAliases first). */
function getRoomDetails(devices, roomName) {
  const roomMeta = ROOMS.find((r) => r.name === roomName);
  return roomMeta ? summarizeRoom(roomMeta, devices) : null;
}

module.exports = { getRoomSummaries, getRoomDetails };
