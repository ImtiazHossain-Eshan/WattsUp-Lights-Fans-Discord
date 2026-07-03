/**
 * Pendant lamp — warm glow + a pool of light on the floor while ON, dim and
 * gray when OFF. Sprite faces the camera; the light pool lies on the floor
 * plane so it deforms correctly with the isometric projection.
 */
export default function LightDevice({ device, pos, onDeviceHover }) {
  if (!device || !pos) return null;
  const on = device.status === "on";

  return (
    <div className="anchor" style={{ left: `${pos.x}px`, top: `${pos.y}px` }}>
      <div className={`floor-pool light-pool ${on ? "is-on" : ""}`} aria-hidden="true" />
      <div
        className={`sprite device light ${on ? "light--on" : "light--off"}`}
        onMouseEnter={(e) => onDeviceHover(device, e)}
        onMouseMove={(e) => onDeviceHover(device, e)}
        onMouseLeave={() => onDeviceHover(null, null)}
        role="img"
        aria-label={`${device.name}, ${device.room}, ${on ? "on" : "off"}`}
      >
        <div className="light-cord" />
        <div className="light-shade" />
        <div className="light-bulb" />
      </div>
    </div>
  );
}
