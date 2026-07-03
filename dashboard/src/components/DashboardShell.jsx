import { useCallback, useState } from "react";
import HeaderSummary from "./HeaderSummary.jsx";
import OfficeScene3D from "./OfficeScene3D.jsx";
import DevicePanel from "./DevicePanel.jsx";
import PowerMeter from "./PowerMeter.jsx";
import AlertsPanel from "./AlertsPanel.jsx";
import BotCommandGuide from "./BotCommandGuide.jsx";
import DeviceTooltip from "./DeviceTooltip.jsx";

export default function DashboardShell({
  devices,
  rooms,
  usage,
  alerts,
  connected,
  loading,
  error,
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

  return (
    <div className="shell">
      <HeaderSummary usage={usage} alerts={alerts} connected={connected} />

      {!connected && (
        <div className="error-banner" role="alert">
          <span>⚠️</span>
          <p>{error || "Lost connection to the backend — reconnecting automatically…"}</p>
        </div>
      )}

      <main className="layout">
        <section className="scene-column">
          <OfficeScene3D devices={devices} onDeviceHover={handleDeviceHover} />
        </section>

        <aside className="side-column">
          <PowerMeter usage={usage} />
          <AlertsPanel alerts={alerts} />
        </aside>
      </main>

      <section className="bottom-row">
        <DevicePanel devices={devices} rooms={rooms} />
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
