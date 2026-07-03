import { useState } from "react";
import { ClockIcon } from "./Icons.jsx";
import { useOfficeNow, formatOfficeTime, formatOfficeDate } from "../officeClock.js";

const SPEEDS = [
  { value: 1, label: "1×" },
  { value: 60, label: "60×" },
  { value: 300, label: "300×" },
  { value: 1800, label: "1800×" },
];

const JUMPS = [
  { label: "9 AM", time: "09:00" },
  { label: "1 PM", time: "13:00" },
  { label: "6 PM", time: "18:00" },
  { label: "11 PM", time: "23:00" },
];

/**
 * The office clock bar — one global, controllable time source. Every timestamp
 * and alert in the app derives from this clock (backend clockService), so
 * jumping to 6 PM makes after-hours alerts appear everywhere at once, and
 * running at 1800× ages rooms past the 2-hour limit in seconds. Reset follows
 * real time again. All changes write to the backend first.
 */
export default function TimeControl({ clock, busy, onSetTime, onSetSpeed, onReset }) {
  const nowMs = useOfficeNow(250); // fast tick so high speeds visibly race
  const [customTime, setCustomTime] = useState("");

  const speed = clock?.speed ?? 1;
  const isReal = Boolean(clock?.isRealTime);
  const hour = new Date(nowMs).getHours();
  const inOfficeHours = hour >= 9 && hour < 17;

  return (
    <div className="panel clock-bar" role="group" aria-label="Office clock controls">
      <div className="clock-readout">
        <span className="clock-ico">
          <ClockIcon size={17} />
        </span>
        <div className="clock-digits">
          <strong>{formatOfficeTime(nowMs)}</strong>
          <span>{formatOfficeDate(nowMs)}</span>
        </div>
        <span
          className={`clock-phase ${inOfficeHours ? "clock-phase--office" : "clock-phase--after"}`}
          title="Office hours are 9 AM – 5 PM; devices ON outside them raise alerts"
        >
          {inOfficeHours ? "Office hours" : "After hours"}
        </span>
      </div>

      <div className="clock-group">
        <span className="clock-group-label">Speed</span>
        <div className="seg" role="group" aria-label="Clock speed">
          {SPEEDS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={`seg-btn ${speed === value ? "active" : ""}`}
              aria-pressed={speed === value}
              disabled={busy}
              onClick={() => onSetSpeed(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="clock-group">
        <span className="clock-group-label">Jump to</span>
        <div className="seg" role="group" aria-label="Jump to time">
          {JUMPS.map(({ label, time }) => (
            <button
              key={time}
              type="button"
              className="seg-btn"
              disabled={busy}
              onClick={() => onSetTime(time)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="clock-custom">
          <input
            type="time"
            className="clock-input"
            value={customTime}
            aria-label="Custom office time"
            disabled={busy}
            onChange={(e) => setCustomTime(e.target.value)}
          />
          <button
            type="button"
            className="btn btn--sm"
            disabled={busy || !customTime}
            onClick={() => customTime && onSetTime(customTime)}
          >
            Set
          </button>
        </div>
      </div>

      <div className="clock-group clock-group--end">
        <span
          className={`clock-live-dot ${isReal ? "is-live" : ""}`}
          title={isReal ? "Following real time" : "Simulated time (differs from real time)"}
          aria-hidden="true"
        />
        <button
          type="button"
          className="btn btn--sm"
          disabled={busy || isReal}
          onClick={onReset}
          title="Snap back to real time at 1× speed"
        >
          Reset to real time
        </button>
      </div>
    </div>
  );
}
