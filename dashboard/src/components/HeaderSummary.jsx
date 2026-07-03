import ConnectionStatus from "./ConnectionStatus.jsx";
import Logo from "./Logo.jsx";
import {
  BoltIcon,
  CalendarIcon,
  PlugIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ActivityIcon,
} from "./Icons.jsx";

export default function HeaderSummary({ usage, alerts, simulation, connected }) {
  const simEnabled = Boolean(simulation?.enabled);

  const stats = [
    {
      label: "Total power",
      value: usage ? `${usage.totalPowerWatts} W` : "—",
      Icon: BoltIcon,
    },
    {
      label: "Est. today",
      value: usage ? `${usage.estimatedTodayKwh} kWh` : "—",
      Icon: CalendarIcon,
    },
    {
      label: "Devices on",
      value: usage ? `${usage.devicesOn} / ${usage.totalDevices}` : "—",
      Icon: PlugIcon,
    },
    {
      label: "Active alerts",
      value: String(alerts.length),
      Icon: alerts.length > 0 ? AlertTriangleIcon : CheckCircleIcon,
      tone: alerts.length > 0 ? "alert" : "ok",
    },
    {
      label: "Simulation",
      value: simulation ? (simEnabled ? "Running" : "Paused") : "—",
      Icon: ActivityIcon,
      tone: simEnabled ? "ok" : undefined,
    },
  ];

  return (
    <header className="header">
      <Logo />

      <div className="header-stats">
        {stats.map(({ label, value, Icon, tone }) => (
          <div key={label} className={`stat-chip${tone ? ` stat-chip--${tone}` : ""}`}>
            <span className="stat-icon">
              <Icon size={15} />
            </span>
            <div>
              <strong>{value}</strong>
              <small>{label}</small>
            </div>
          </div>
        ))}
        <ConnectionStatus connected={connected} />
      </div>
    </header>
  );
}
