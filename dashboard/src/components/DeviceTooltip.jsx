import DeviceIcon from "./DeviceIcon.jsx";

function formatTime(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  const rel =
    mins < 1 ? "just now" : mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  return `${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })} · ${rel}`;
}

/**
 * Screen-space hover card. Rendered outside the 3D transforms so the text is
 * always crisp; follows the cursor and clamps to the viewport.
 */
export default function DeviceTooltip({ tooltip }) {
  if (!tooltip?.device) return null;
  const { device, x, y } = tooltip;
  const on = device.status === "on";

  const style = {
    left: `${Math.min(x + 16, window.innerWidth - 250)}px`,
    top: `${Math.min(y + 16, window.innerHeight - 150)}px`,
  };

  return (
    <div className="tooltip" style={style} role="tooltip">
      <div className="tooltip-title">
        <DeviceIcon type={device.type} on={on} size={20} />
        <strong>{device.name}</strong>
        <span className={`pill ${on ? "pill--on" : "pill--off"}`}>
          {on ? "ON" : "OFF"}
        </span>
      </div>
      <dl>
        <div>
          <dt>Room</dt>
          <dd>{device.room}</dd>
        </div>
        <div>
          <dt>Mode</dt>
          <dd className={`mode-text mode-text--${device.controlMode}`}>
            {device.controlMode === "manual" ? "Manual" : "Auto"}
          </dd>
        </div>
        <div>
          <dt>Click</dt>
          <dd>to toggle (manual)</dd>
        </div>
        <div>
          <dt>Power</dt>
          <dd>
            {device.currentPower} W {on && <em>(rated {device.wattage} W)</em>}
          </dd>
        </div>
        <div>
          <dt>Last changed</dt>
          <dd>{formatTime(device.lastChanged)}</dd>
        </div>
        {on && device.turnedOnAt && (
          <div>
            <dt>On since</dt>
            <dd>{formatTime(device.turnedOnAt)}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
