/**
 * Office clock — the single virtual time source for all domain logic.
 *
 * officeNow = anchorVirtual + (realNow − anchorReal) × speed
 *
 * Everything time-based (device timestamps, after-hours & long-running alerts,
 * today's kWh estimate, the simulator's occupancy profiles) asks THIS module
 * for "now", so the whole system can be demoed at any time of day and any
 * speed: set the clock to 6 PM to watch after-hours alerts appear, run at 600×
 * to age a room past the 2-hour limit in seconds, reset to follow real time.
 *
 * Depends on nothing (leaf module) so every service can import it cycle-free.
 */

const MAX_SPEED = 3600; // 1 real second = 1 virtual hour, plenty for demos
const TIME_RE = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/; // "HH:mm" or "HH:mm:ss"

let anchorRealMs = Date.now();
let anchorVirtualMs = anchorRealMs;
let speed = 1;

function getOfficeNow() {
  return new Date(anchorVirtualMs + (Date.now() - anchorRealMs) * speed);
}

/** Serializable snapshot for GET /api/clock and the `clock:update` event. */
function getClockState() {
  const officeNow = getOfficeNow();
  const realNow = Date.now();
  return {
    officeTime: officeNow.toISOString(),
    speed,
    isRealTime: speed === 1 && Math.abs(officeNow.getTime() - realNow) < 2000,
    realTime: new Date(realNow).toISOString(),
  };
}

/** Re-anchor at the current virtual instant so changes never make time jump. */
function rebase() {
  anchorVirtualMs = getOfficeNow().getTime();
  anchorRealMs = Date.now();
}

/**
 * Apply a clock change: { time?, speed?, reset? }. `time` accepts "HH:mm[:ss]"
 * (keeps the current virtual date) or any full date string Date.parse accepts.
 * Returns { error } on invalid input, otherwise { state }.
 */
function configureClock({ time, speed: nextSpeed, reset } = {}) {
  if (reset) {
    anchorRealMs = Date.now();
    anchorVirtualMs = anchorRealMs;
    speed = 1;
    return { state: getClockState() };
  }

  if (nextSpeed !== undefined) {
    const value = Number(nextSpeed);
    if (!Number.isFinite(value) || value < 0 || value > MAX_SPEED) {
      return { error: `"speed" must be a number between 0 and ${MAX_SPEED}.` };
    }
    rebase();
    speed = value;
  }

  if (time !== undefined) {
    if (typeof time !== "string" || time.trim() === "") {
      return { error: '"time" must be "HH:mm", "HH:mm:ss" or a full date string.' };
    }
    const clockMatch = TIME_RE.exec(time.trim());
    let targetMs;
    if (clockMatch) {
      const [, h, m, s] = clockMatch;
      if (Number(h) > 23 || Number(m) > 59 || Number(s || 0) > 59) {
        return { error: `"${time}" is not a valid time of day.` };
      }
      const target = getOfficeNow(); // keep the current virtual date
      target.setHours(Number(h), Number(m), Number(s || 0), 0);
      targetMs = target.getTime();
    } else {
      targetMs = Date.parse(time);
      if (Number.isNaN(targetMs)) {
        return { error: `Could not parse "${time}" as a time or date.` };
      }
    }
    anchorVirtualMs = targetMs;
    anchorRealMs = Date.now();
  }

  return { state: getClockState() };
}

module.exports = { getOfficeNow, getClockState, configureClock };
