import { AlertTriangleIcon, AlertOctagonIcon, CheckCircleIcon } from "./Icons.jsx";
import { useOfficeNow, relOfficeTime } from "../officeClock.js";

const SEVERITY_ICON = { warning: AlertTriangleIcon, critical: AlertOctagonIcon };

/** Active alerts (after-hours devices, long-running rooms) with severity styling.
 *  Ages are measured on the OFFICE clock, consistent with every other panel. */
export default function AlertsPanel({ alerts }) {
  const nowMs = useOfficeNow(1000);
  const sorted = [...alerts].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  return (
    <div className="panel alerts-panel">
      <h2>
        <AlertTriangleIcon size={15} /> Alerts
        {alerts.length > 0 && <small>{alerts.length} active</small>}
      </h2>

      {sorted.length === 0 ? (
        <div className="alerts-empty">
          <CheckCircleIcon size={18} />
          <p>All clear — nothing running after hours, no long-running rooms.</p>
        </div>
      ) : (
        <ul className="alert-list">
          {sorted.map((alert) => {
            const Icon = SEVERITY_ICON[alert.severity] ?? AlertTriangleIcon;
            return (
              <li key={alert.id} className={`alert alert--${alert.severity}`}>
                <span className="alert-ico">
                  <Icon size={16} />
                </span>
                <div>
                  <p>{alert.message}</p>
                  <small>
                    <span className="alert-room">{alert.room}</span> ·{" "}
                    {relOfficeTime(alert.timestamp, nowMs)}
                  </small>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
