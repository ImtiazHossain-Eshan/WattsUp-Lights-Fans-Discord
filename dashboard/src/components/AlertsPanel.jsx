import { AlertTriangleIcon, AlertOctagonIcon, CheckCircleIcon } from "./Icons.jsx";

function relTime(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

const SEVERITY_ICON = { warning: AlertTriangleIcon, critical: AlertOctagonIcon };

/** Active alerts (after-hours devices, long-running rooms) with severity styling. */
export default function AlertsPanel({ alerts }) {
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
                    {relTime(alert.timestamp)}
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
