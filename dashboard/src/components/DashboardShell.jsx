import { useCallback, useState } from "react";
import HeaderSummary from "./HeaderSummary.jsx";
import ControlBar from "./ControlBar.jsx";
import OfficeLayout from "./OfficeLayout.jsx";
import RoomCard from "./RoomCard.jsx";
import PowerMeter from "./PowerMeter.jsx";
import AlertsPanel from "./AlertsPanel.jsx";
import BotCommandGuide from "./BotCommandGuide.jsx";
import DeviceTooltip from "./DeviceTooltip.jsx";
import { AlertTriangleIcon, LayoutIcon } from "./Icons.jsx";
import { ROOM_ORDER, roomConfigs } from "./roomConfigs.js";

/**
 * Page frame. Layout (top → bottom): header stats · banners · office scene +
 * alerts · per-room device control cards · power breakdown / simulation
 * controls / bot guide. All data & actions flow through props from App.jsx.
 */
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
  // One shared tooltip rendered in screen space (outside the 3D canvas)
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
        <span className="splash-spinner" aria-hidden="true" />
        <p>Connecting to the office…</p>
      </div>
    );
  }

  const roomSummaries = Object.fromEntries((rooms || []).map((r) => [r.room, r]));

  return (
    <div className="shell">
      <HeaderSummary
        usage={usage}
        alerts={alerts}
        simulation={simulation}
        connected={connected}
      />

      {!connected && (
        <div className="error-banner" role="alert">
          <AlertTriangleIcon size={16} />
          <p>{error || "Lost connection to the backend — reconnecting automatically…"}</p>
        </div>
      )}

      {actionError && (
        <div className="error-banner error-banner--action" role="alert">
          <AlertTriangleIcon size={16} />
          <p>{actionError}</p>
        </div>
      )}

      <main className="layout">
        <section className="scene-column">
          <div className="scene-head">
            <h2>
              <LayoutIcon size={15} /> Office layout
            </h2>
            <span className="scene-hint">
              drag to orbit · click a device to toggle · hover for details
            </span>
          </div>
          <OfficeLayout
            devices={devices}
            busy={busy}
            onDeviceHover={handleDeviceHover}
            onDeviceToggle={actions.toggleDevice}
          />
        </section>

        <aside className="side-column">
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

      <section className="bottom-grid">
        <PowerMeter usage={usage} />
        <ControlBar
          simulation={simulation}
          busy={busy}
          onToggleSim={actions.toggleSimulation}
          onResetAuto={actions.resetAllToAuto}
          onAllOff={actions.turnAllOff}
        />
        <BotCommandGuide />
      </section>

      <footer className="footer">
        <span>
          WattsUp · one shared backend feeds this dashboard and the Discord bot — same
          data, two views.
        </span>
      </footer>

      <DeviceTooltip tooltip={tooltip} />
    </div>
  );
}
