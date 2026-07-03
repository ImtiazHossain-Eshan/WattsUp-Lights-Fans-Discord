import DeviceIcon from "./DeviceIcon.jsx";
import ToggleSwitch from "./ToggleSwitch.jsx";

function shortTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Auto/Manual segmented control — doubles as the mode badge (active = current mode). */
function ModeToggle({ mode, busy, onSetMode }) {
  return (
    <div className="mode-toggle" role="group" aria-label="Control mode">
      <button
        type="button"
        className={`mode-btn mode-btn--auto ${mode === "auto" ? "active" : ""}`}
        aria-pressed={mode === "auto"}
        disabled={busy || mode === "auto"}
        onClick={() => onSetMode("auto")}
      >
        Auto
      </button>
      <button
        type="button"
        className={`mode-btn mode-btn--manual ${mode === "manual" ? "active" : ""}`}
        aria-pressed={mode === "manual"}
        disabled={busy || mode === "manual"}
        onClick={() => onSetMode("manual")}
      >
        Manual
      </button>
    </div>
  );
}

/**
 * One device's live row: SVG icon (spinning fan / glowing bulb), ON/OFF badge,
 * power, ON/OFF switch and Auto/Manual mode control. Every action calls the
 * backend first (handlers passed down from App.jsx); the row re-renders when
 * the backend broadcasts the new state.
 */
export default function DeviceControls({ device, busy, onToggle, onSetMode }) {
  const on = device.status === "on";
  return (
    <li className={`device-card ${on ? "is-on" : "is-off"} mode-${device.controlMode}`}>
      <div className="device-card-head">
        <DeviceIcon type={device.type} on={on} />
        <span className="device-card-name">{device.name}</span>
        <span className={`badge ${on ? "badge--on" : "badge--off"}`}>
          {on ? "ON" : "OFF"}
        </span>
      </div>

      <div className="device-card-meta">
        <span className="device-card-power">{device.currentPower} W</span>
        <span className="device-card-time" title="Last changed">
          {shortTime(device.lastChanged)}
        </span>
      </div>

      <div className="device-card-controls">
        <ToggleSwitch
          checked={on}
          busy={busy}
          label={on ? "On" : "Off"}
          onChange={() => onToggle(device.id)}
        />
        <ModeToggle
          mode={device.controlMode}
          busy={busy}
          onSetMode={(mode) => onSetMode(device.id, mode)}
        />
      </div>
    </li>
  );
}
