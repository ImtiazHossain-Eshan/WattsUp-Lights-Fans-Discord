import DeviceControls from "./DeviceControls.jsx";
import { useOfficeNow } from "../officeClock.js";

const TYPE_LABELS = { waiting_area: "Waiting area", workspace: "Workspace" };

/**
 * One room's live control card, styled by its roomConfig (accent, subtitle,
 * purpose tag, expected usage, description) — the same reusable component
 * renders all three rooms; only the config differs. All data comes from the
 * backend (devices, usage summary, alerts); all actions write to the backend.
 */
export default function RoomCard({
  roomName,
  roomConfig,
  devices,
  usage,
  alerts,
  busy,
  onToggle,
  onSetMode,
  onRoomOff,
}) {
  const alertCount = alerts.length;
  // Office-clock "now", ticking once a second — device ages follow virtual time.
  const nowMs = useOfficeNow(1000);

  return (
    <div className="panel room-card" style={{ "--room-accent": roomConfig.accentColor }}>
      <div className="room-card-head">
        <span className="room-card-dot" aria-hidden="true" />
        <div className="room-card-titles">
          <h3>{roomName}</h3>
          <p className="room-card-sub">{roomConfig.subtitle}</p>
        </div>
        <span className="room-tag">{TYPE_LABELS[roomConfig.type] || roomConfig.type}</span>
      </div>

      <div className="room-card-stats">
        <span className="room-card-power">{usage?.totalPower ?? 0} W</span>
        <span className="room-card-count">
          {usage?.devicesOn ?? 0}/{usage?.totalDevices ?? devices.length} on
        </span>
        {alertCount > 0 && (
          <span className="room-alert-chip">
            {alertCount} alert{alertCount > 1 ? "s" : ""}
          </span>
        )}
        <button
          type="button"
          className="btn btn--sm btn--ghost room-card-off"
          disabled={busy}
          onClick={() => onRoomOff(roomName)}
        >
          Turn room off
        </button>
      </div>

      <ul className="device-card-list">
        {devices.map((d) => (
          <DeviceControls
            key={d.id}
            device={d}
            busy={busy}
            nowMs={nowMs}
            onToggle={onToggle}
            onSetMode={onSetMode}
          />
        ))}
      </ul>

      <p className="room-card-desc">
        {roomConfig.description}
        <span className="room-card-usage"> Expected usage: {roomConfig.expectedUsage}.</span>
      </p>
    </div>
  );
}
