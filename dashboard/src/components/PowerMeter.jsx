// Absolute maxima with every device ON: office 6x60 + 9x15 = 495 W,
// single room 2x60 + 3x15 = 165 W. Used to scale the meter bars.
const OFFICE_MAX_W = 495;
const ROOM_MAX_W = 165;

/** Live power meter — total draw, estimated kWh today and per-room bars. */
export default function PowerMeter({ usage }) {
  const total = usage?.totalPowerWatts ?? 0;
  const pct = Math.min(100, Math.round((total / OFFICE_MAX_W) * 100));

  return (
    <div className="panel power-meter">
      <h2>
        <span>⚡</span> Power meter
      </h2>

      <div className="meter-total">
        <strong>{usage ? total : "—"}</strong>
        <span>watts right now</span>
      </div>

      <div className="meter-bar">
        <div className="meter-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="meter-scale">
        <span>0 W</span>
        <span>{OFFICE_MAX_W} W max</span>
      </div>

      <div className="meter-kwh">
        <span>📅 Estimated usage today</span>
        <strong>{usage ? `${usage.estimatedTodayKwh} kWh` : "—"}</strong>
      </div>

      <h3 className="meter-subhead">Per-room breakdown</h3>
      <ul className="room-bars">
        {(usage?.perRoom ?? []).map((room) => (
          <li key={room.room}>
            <div className="room-bar-label">
              <span>{room.room}</span>
              <span>
                {room.powerWatts} W · {room.devicesOn} on
              </span>
            </div>
            <div className="room-bar">
              <div
                className="room-bar-fill"
                style={{ width: `${Math.min(100, (room.powerWatts / ROOM_MAX_W) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
