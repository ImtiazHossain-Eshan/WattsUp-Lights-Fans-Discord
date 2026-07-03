import { useCallback, useState } from "react";
import HeaderSummary from "./HeaderSummary.jsx";
import ControlBar from "./ControlBar.jsx";
import OfficeLayout from "./OfficeLayout.jsx";
import RoomCard from "./RoomCard.jsx";
import PowerMeter from "./PowerMeter.jsx";
import AlertsPanel from "./AlertsPanel.jsx";
import BotCommandGuide from "./BotCommandGuide.jsx";
import DeviceTooltip from "./DeviceTooltip.jsx";
import { ROOM_ORDER, roomConfigs } from "./roomConfigs.js";

export default function DashboardShell({
  devices,
  rooms,
  usage,
  alerts,
  simulation,
  connected,
  loading,
  error,
  busy,
  actionError,
  actions,
}) {
  // One shared tooltip rendered in screen space (outside the 3D transforms)
  // so text stays crisp: { device, x, y } | null
  const [tooltip, setTooltip] = useState(null);

  const handleDeviceHover = useCallback((device, event) => {
    if (!device || !event) {
      setTooltip(null);
    } else {
      setTooltip({ device, x: event.clientX, y: event.clientY });
    }
  }, []);

  if (loading) {
    return (
      <div className="splash">
        <div className="splash-bolt">⚡</div>
        <p>Connecting to the office…</p>
      </div>
    );
  }

  const roomSummaries = Object.fromEntries((rooms || []).map((r) => [r.room, r]));

  return (
    <div className="shell">
      <HeaderSummary usage={usage} alerts={alerts} connected={connected} />

      {!connected && (
        <div className="error-banner" role="alert">
          <span>⚠️</span>
          <p>{error || "Lost connection to the backend — reconnecting automatically…"}</p>
        </div>
      )}

      {actionError && (
        <div className="error-banner error-banner--action" role="alert">
          <span>⚠️</span>
          <p>{actionError}</p>
        </div>
      )}

      <ControlBar
        simulation={simulation}
        busy={busy}
        onToggleSim={actions.toggleSimulation}
        onResetAuto={actions.resetAllToAuto}
        onAllOff={actions.turnAllOff}
      />

      <main className="layout">
        <section className="scene-column">
          <OfficeLayout
            devices={devices}
            busy={busy}
            onDeviceHover={handleDeviceHover}
            onDeviceToggle={actions.toggleDevice}
          />
        </section>

        <aside className="side-column">
          <PowerMeter usage={usage} />
          <AlertsPanel alerts={alerts} />
        </aside>
      </main>

      <section className="room-cards-grid">
        {ROOM_ORDER.map((name) => (
          <RoomCard
            key={name}
            roomName={name}
            roomConfig={roomConfigs[name]}
            devices={devices.filter((d) => d.room === name)}
            usage={roomSummaries[name]}
            alerts={alerts.filter((a) => a.room === name)}
            busy={busy}
            onToggle={actions.toggleDevice}
            onSetMode={actions.setDeviceMode}
            onRoomOff={actions.turnRoomOff}
          />
        ))}
      </section>

      <section className="bottom-row bottom-row--single">
        <BotCommandGuide />
      </section>

      <footer className="footer">
        <span>
          WattsUp · one shared backend feeds this dashboard and the Discord bot — same
          data, two windows.
        </span>
      </footer>

      <DeviceTooltip tooltip={tooltip} />
    </div>
  );
}
