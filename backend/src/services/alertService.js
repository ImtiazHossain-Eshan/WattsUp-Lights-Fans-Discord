/**
 * Alert engine.
 *
 * Rule 1 (after-hours, severity "warning"):
 *   any device ON before OFFICE_START_HOUR or at/after OFFICE_END_HOUR.
 * Rule 2 (long-running room, severity "critical"):
 *   all 5 devices of a room ON continuously for more than LONG_RUNNING_HOURS.
 *
 * Alert IDs are stable while the underlying condition persists (they encode the
 * device/room plus the ON-session start time), so the Discord bot can dedupe
 * proactive posts. Timestamps are pinned to when the alert was first generated.
 */

const { ROOMS } = require("../data/devices");
const { getOfficeNow } = require("./clockService");

const OFFICE_START_HOUR = Number.parseInt(process.env.OFFICE_START_HOUR, 10) || 9;
const OFFICE_END_HOUR = Number.parseInt(process.env.OFFICE_END_HOUR, 10) || 17;
const LONG_RUNNING_HOURS = Number.parseFloat(process.env.LONG_RUNNING_HOURS) || 2;

// alert id -> ISO timestamp of when it was first seen, so regenerating alerts
// every simulator tick doesn't make timestamps drift. Pruned when alerts clear.
const firstSeenAt = new Map();

function formatHour(hour24) {
  if (hour24 === 0 || hour24 === 24) return "12 AM";
  if (hour24 === 12) return "12 PM";
  return hour24 < 12 ? `${hour24} AM` : `${hour24 - 12} PM`;
}

const OFFICE_HOURS_LABEL = `${formatHour(OFFICE_START_HOUR)}–${formatHour(OFFICE_END_HOUR)}`;

function isAfterHours(now = getOfficeNow()) {
  const hour = now.getHours();
  return hour < OFFICE_START_HOUR || hour >= OFFICE_END_HOUR;
}

function buildAfterHoursAlerts(devices, now, seenIds) {
  if (!isAfterHours(now)) return [];

  const alerts = [];
  for (const device of devices) {
    if (device.status !== "on") continue;
    const sessionStart = Date.parse(device.turnedOnAt || device.lastChanged) || 0;
    const id = `after-hours-${device.id}-${sessionStart}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    alerts.push({
      id,
      type: "after-hours",
      room: device.room,
      deviceId: device.id,
      message: `${device.name} in ${device.room} is ON outside office hours (${OFFICE_HOURS_LABEL}).`,
      severity: "warning",
    });
  }
  return alerts;
}

function buildLongRunningAlerts(devices, now, seenIds) {
  const thresholdMs = LONG_RUNNING_HOURS * 3_600_000;
  const alerts = [];

  for (const room of ROOMS) {
    const roomDevices = devices.filter((d) => d.room === room.name);
    const allOnLongEnough =
      roomDevices.length > 0 &&
      roomDevices.every(
        (d) =>
          d.status === "on" &&
          d.turnedOnAt &&
          now.getTime() - Date.parse(d.turnedOnAt) > thresholdMs
      );
    if (!allOnLongEnough) continue;

    // The condition started when the *last* device joined the all-ON state.
    const newestOnMs = Math.max(...roomDevices.map((d) => Date.parse(d.turnedOnAt)));
    const runningHours = ((now.getTime() - newestOnMs) / 3_600_000).toFixed(1);
    const id = `long-running-${room.slug}-${newestOnMs}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    alerts.push({
      id,
      type: "long-running-room",
      room: room.name,
      message: `All ${roomDevices.length} devices in ${room.name} have been ON continuously for ${runningHours}h (limit: ${LONG_RUNNING_HOURS}h). Someone probably forgot them.`,
      severity: "critical",
    });
  }
  return alerts;
}

function generateAlerts(devices, now = getOfficeNow()) {
  const seenIds = new Set(); // prevents duplicates within one generation cycle
  const alerts = [
    ...buildAfterHoursAlerts(devices, now, seenIds),
    ...buildLongRunningAlerts(devices, now, seenIds),
  ];

  // Pin timestamps to first sighting; prune entries whose condition cleared.
  const activeIds = new Set(alerts.map((a) => a.id));
  for (const id of firstSeenAt.keys()) {
    if (!activeIds.has(id)) firstSeenAt.delete(id);
  }
  for (const alert of alerts) {
    if (!firstSeenAt.has(alert.id)) firstSeenAt.set(alert.id, now.toISOString());
    alert.timestamp = firstSeenAt.get(alert.id);
  }

  return alerts;
}

module.exports = {
  generateAlerts,
  isAfterHours,
  OFFICE_START_HOUR,
  OFFICE_END_HOUR,
  LONG_RUNNING_HOURS,
};
