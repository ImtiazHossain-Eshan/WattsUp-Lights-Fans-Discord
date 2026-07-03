/**
 * Pedestal fan — spins while device.status === "on", stands still when off.
 * Rendered as a camera-facing sprite anchored to the floor; state comes purely
 * from the backend device object.
 */
export default function FanDevice({ device, pos, onDeviceHover }) {
  if (!device || !pos) return null;
  const on = device.status === "on";

  return (
    <div className="anchor" style={{ left: `${pos.x}px`, top: `${pos.y}px` }}>
      <div className={`floor-pool fan-pool ${on ? "is-on" : ""}`} aria-hidden="true" />
      <div
        className={`sprite device fan ${on ? "fan--on" : "fan--off"}`}
        onMouseEnter={(e) => onDeviceHover(device, e)}
        onMouseMove={(e) => onDeviceHover(device, e)}
        onMouseLeave={() => onDeviceHover(null, null)}
        role="img"
        aria-label={`${device.name}, ${device.room}, ${on ? "on" : "off"}`}
      >
        <div className="fan-head">
          <div className="fan-blades">
            <i />
            <i />
            <i />
          </div>
          <div className="fan-hub" />
        </div>
        <div className="fan-pole" />
        <div className="fan-base" />
      </div>
    </div>
  );
}
