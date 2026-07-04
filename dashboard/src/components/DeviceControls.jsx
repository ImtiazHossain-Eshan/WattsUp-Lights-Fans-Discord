import DeviceIcon from "./DeviceIcon.jsx";
import { formatOfficeTime, relOfficeTime } from "../officeClock.js";

/** Auto/Manual segmented control — doubles as the mode badge (active = current mode). */
function ModeToggle({ mode, pending, onSetMode }) {
  return (
    <div className="mode-toggle" role="group" aria-label="Control mode">
      <button
        type="button"
        className={`mode-btn mode-btn--auto ${mode === "auto" ? "active" : ""}`}
        aria-pressed={mode === "auto"}
        disabled={pending || mode === "auto"}
        onClick={() => onSetMode("auto")}
      >
        Auto
      </button>
      <button
        type="button"
        className={`mode-btn mode-btn--manual ${mode === "manual" ? "active" : ""}`}
        aria-pressed={mode === "manual"}
        disabled={pending || mode === "manual"}
        onClick={() => onSetMode("manual")}
      >
        Manual
      </button>
    </div>
  );
}

/**
 * Physical-style rocker wall switch: a plate with screws and a tilting rocker
 * key (I = on, O = off) plus a status LED. Pressing it toggles the device via
 * the backend — the tilt/glow only ever renders the broadcast state.
 */
function RockerSwitch({ on, type, pending, label, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`rocker rocker--${type} ${on ? "is-on" : ""} ${pending ? "is-pending" : ""}`}
      disabled={pending}
      onClick={onToggle}
    >
      <span className="rocker-led" aria-hidden="true" />
      <span className="rocker-well" aria-hidden="true">
        <span className="rocker-key">
          <span className="rocker-mark rocker-mark--i">I</span>
          <span className="rocker-mark rocker-mark--o">O</span>
        </span>
      </span>
      <span className="rocker-screw rocker-screw--t" aria-hidden="true" />
      <span className="rocker-screw rocker-screw--b" aria-hidden="true" />
    </button>
  );
}

/**
 * One device's live row: SVG icon (spinning fan / glowing bulb), power, the
 * office-clock timestamp of its last change, Auto/Manual mode control, and a
 * physical rocker switch. Every action calls the backend first (handlers from
 * App.jsx); the row re-renders when the backend broadcasts the new state.
 * `nowMs` is the ticking OFFICE time (passed by RoomCard) so relative ages
 * follow the virtual clock, not the wall clock.
 */
export default function DeviceControls({ device, pending, nowMs, onToggle, onSetMode }) {
  const on = device.status === "on";
  return (
    <li
      className={`device-card device-card--${device.type} ${on ? "is-on" : "is-off"} mode-${device.controlMode}`}
    >
      <div className="device-card-main">
        <div className="device-card-head">
          <DeviceIcon type={device.type} on={on} />
          <span className="device-card-name">{device.name}</span>
          <span className="device-card-power">{device.currentPower} W</span>
        </div>

        <div className="device-card-meta">
          <span
            className="device-card-time"
            title={`Last changed at ${formatOfficeTime(device.lastChanged)} (office time)`}
          >
            {on && device.turnedOnAt
              ? `on since ${formatOfficeTime(device.turnedOnAt, { seconds: false })}`
              : `changed ${relOfficeTime(device.lastChanged, nowMs)}`}
          </span>
        </div>

        <ModeToggle
          mode={device.controlMode}
          pending={pending}
          onSetMode={(mode) => onSetMode(device.id, mode)}
        />
      </div>

      <RockerSwitch
        on={on}
        type={device.type}
        pending={pending}
        label={`Turn ${device.name} ${on ? "off" : "on"}`}
        onToggle={() => onToggle(device.id)}
      />
    </li>
  );
}
