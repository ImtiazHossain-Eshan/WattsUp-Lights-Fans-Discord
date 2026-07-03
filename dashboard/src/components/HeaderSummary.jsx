import ConnectionStatus from "./ConnectionStatus.jsx";

export default function HeaderSummary({ usage, alerts, connected }) {
  const stats = [
    {
      label: "Total power",
      value: usage ? `${usage.totalPowerWatts} W` : "—",
      icon: "⚡",
    },
    {
      label: "Est. today",
      value: usage ? `${usage.estimatedTodayKwh} kWh` : "—",
      icon: "📅",
    },
    {
      label: "Devices on",
      value: usage ? `${usage.devicesOn} / ${usage.totalDevices}` : "—",
      icon: "🔌",
    },
    {
      label: "Active alerts",
      value: String(alerts.length),
      icon: alerts.length > 0 ? "🚨" : "✅",
      tone: alerts.length > 0 ? "alert" : "ok",
    },
  ];

  return (
    <header className="header">
      <div className="brand">
        <span className="brand-bolt">⚡</span>
        <div>
          <h1>WattsUp</h1>
          <p>Office lights &amp; fans · live monitor</p>
        </div>
      </div>

      <div className="header-stats">
        {stats.map((s) => (
          <div key={s.label} className={`stat-chip ${s.tone ? `stat-chip--${s.tone}` : ""}`}>
            <span className="stat-icon">{s.icon}</span>
            <div>
              <strong>{s.value}</strong>
              <small>{s.label}</small>
            </div>
          </div>
        ))}
        <ConnectionStatus connected={connected} />
      </div>
    </header>
  );
}
