const ROOM_ORDER = ["Drawing Room", "Work Room 1", "Work Room 2"];

function shortTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Live status list — all 15 devices grouped by room. */
export default function DevicePanel({ devices, rooms }) {
  const roomPower = Object.fromEntries((rooms || []).map((r) => [r.room, r.totalPower]));

  return (
    <div className="panel device-panel">
      <h2>
        <span>🗂️</span> Device status
        <small>{devices.length} devices · live</small>
      </h2>

      <div className="device-groups">
        {ROOM_ORDER.map((roomName) => {
          const roomDevices = devices.filter((d) => d.room === roomName);
          return (
            <div key={roomName} className="device-group">
              <h3>
                {roomName}
                <span className="group-power">{roomPower[roomName] ?? 0} W</span>
              </h3>
              <ul>
                {roomDevices.map((d) => {
                  const on = d.status === "on";
                  return (
                    <li key={d.id} className={`device-row ${on ? "device-row--on" : ""}`}>
                      <span className="device-ico">{d.type === "fan" ? "🌀" : "💡"}</span>
                      <span className="device-name">{d.name}</span>
                      <span className={`pill ${on ? "pill--on" : "pill--off"}`}>
                        {on ? "ON" : "OFF"}
                      </span>
                      <span className="device-power">{d.currentPower} W</span>
                      <span className="device-time" title="Last changed">
                        {shortTime(d.lastChanged)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
