/**
 * Clean, dynamic device icons drawn as inline SVG (no emoji).
 *
 *  - Fan  ON  → blades spin (CSS animation);  OFF → still, dimmed
 *  - Light ON → warm glowing bulb + rays;      OFF → dim, no glow
 *
 * State comes entirely from the `on` prop (i.e. from backend device.status),
 * so these stay 100% data-driven. All motion/colour lives in app.css.
 */

const BLADE_ANGLES = [0, 90, 180, 270];
const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export function FanIcon({ on, size = 26, className = "" }) {
  return (
    <svg
      className={`dev-ico dev-ico-fan ${on ? "is-on" : "is-off"} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <circle className="dev-ico-ring" cx="16" cy="16" r="15" />
      <g className="fan-blades-svg">
        {BLADE_ANGLES.map((a) => (
          <ellipse
            key={a}
            className="fan-blade"
            cx="16"
            cy="9"
            rx="3.1"
            ry="6.4"
            transform={`rotate(${a} 16 16)`}
          />
        ))}
      </g>
      <circle className="fan-hub-svg" cx="16" cy="16" r="2.4" />
    </svg>
  );
}

export function LightIcon({ on, size = 26, className = "" }) {
  return (
    <svg
      className={`dev-ico dev-ico-light ${on ? "is-on" : "is-off"} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <g className="bulb-rays">
        {RAY_ANGLES.map((a) => (
          <line
            key={a}
            x1="16"
            y1="1.5"
            x2="16"
            y2="4.5"
            transform={`rotate(${a} 16 15)`}
          />
        ))}
      </g>
      <path
        className="bulb-glass"
        d="M16 4.5 a7.5 7.5 0 0 1 4.9 13.2 c-1.1 1 -1.7 2 -1.8 3.3 h-6.2 c-0.1 -1.3 -0.7 -2.3 -1.8 -3.3 A7.5 7.5 0 0 1 16 4.5 z"
      />
      <rect className="bulb-base" x="12.7" y="21.6" width="6.6" height="2.3" rx="1" />
      <rect className="bulb-base" x="13.4" y="24.3" width="5.2" height="2.2" rx="1" />
    </svg>
  );
}

/** Convenience: pick the icon by device type. */
export default function DeviceIcon({ type, on, size, className }) {
  const Icon = type === "fan" ? FanIcon : LightIcon;
  return <Icon on={on} size={size} className={className} />;
}
