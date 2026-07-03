/**
 * Frontend mirror of the backend office clock (services/clockService.js).
 *
 * The backend broadcasts `clock:update` with { officeTime, speed }; we anchor
 * that instant against the local wall clock and extrapolate between updates:
 *
 *   officeNow = anchorVirtual + (realNow − anchorReal) × speed
 *
 * Every timestamp in the app (device "last changed", alert ages, the clock
 * readout) is rendered relative to THIS clock, so speeding up / rewinding the
 * office time keeps the whole dashboard telling one consistent story.
 */

import { useEffect, useState } from "react";

let anchorVirtualMs = Date.now();
let anchorRealMs = Date.now();
let speed = 1;

/** Called from App whenever the backend pushes a clock snapshot. */
export function syncOfficeClock(state) {
  const parsed = Date.parse(state?.officeTime ?? "");
  if (Number.isNaN(parsed)) return;
  anchorVirtualMs = parsed;
  anchorRealMs = Date.now();
  const nextSpeed = Number(state.speed);
  speed = Number.isFinite(nextSpeed) ? nextSpeed : 1;
}

export function officeNowMs() {
  return anchorVirtualMs + (Date.now() - anchorRealMs) * speed;
}

/** Ticking office-time hook; re-renders the caller every `tickMs`. */
export function useOfficeNow(tickMs = 1000) {
  const [now, setNow] = useState(officeNowMs);
  useEffect(() => {
    const timer = setInterval(() => setNow(officeNowMs()), tickMs);
    return () => clearInterval(timer);
  }, [tickMs]);
  return now;
}

export function formatOfficeTime(msOrIso, { seconds = true } = {}) {
  const ms = typeof msOrIso === "string" ? Date.parse(msOrIso) : msOrIso;
  if (!Number.isFinite(ms)) return "—";
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    ...(seconds ? { second: "2-digit" } : {}),
  });
}

export function formatOfficeDate(ms) {
  if (!Number.isFinite(ms)) return "—";
  return new Date(ms).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** "just now" / "4m ago" / "2h 05m ago" measured on the OFFICE clock. */
export function relOfficeTime(iso, nowMs = officeNowMs()) {
  const then = Date.parse(iso ?? "");
  if (Number.isNaN(then)) return "—";
  const mins = Math.floor((nowMs - then) / 60000);
  if (mins < 1) return "just now"; // includes clock jumped backwards
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${String(mins % 60).padStart(2, "0")}m ago`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h ago`;
}
