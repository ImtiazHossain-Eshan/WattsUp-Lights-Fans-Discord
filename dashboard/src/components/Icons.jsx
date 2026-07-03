/**
 * Minimal stroke-style SVG icon set (no emoji, no icon-font dependency).
 * All icons inherit `currentColor` so their tone is controlled purely by CSS.
 */

function Svg({ size = 16, children, filled = false, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function BoltIcon({ size, className }) {
  return (
    <Svg size={size} className={className} filled>
      <path d="M13 2 4.6 13.4a.5.5 0 0 0 .4.8H10l-1 7.3a.4.4 0 0 0 .72.3L19.4 10.6a.5.5 0 0 0-.4-.8H14l1-7.3a.4.4 0 0 0-.72-.3z" />
    </Svg>
  );
}

export function GaugeIcon({ size, className }) {
  return (
    <Svg size={size} className={className}>
      <path d="M4.5 19a9.5 9.5 0 1 1 15 0" />
      <path d="M12 13.5 16 8.5" />
      <circle cx="12" cy="14.5" r="1.6" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function CalendarIcon({ size, className }) {
  return (
    <Svg size={size} className={className}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 2.8V6.5M16 2.8V6.5" />
    </Svg>
  );
}

export function PlugIcon({ size, className }) {
  return (
    <Svg size={size} className={className}>
      <path d="M9 2.5V8M15 2.5V8" />
      <path d="M6.5 8h11v3.5a5.5 5.5 0 0 1-11 0z" />
      <path d="M12 17v4.5" />
    </Svg>
  );
}

export function AlertTriangleIcon({ size, className }) {
  return (
    <Svg size={size} className={className}>
      <path d="M12 3.5 21.5 20h-19z" />
      <path d="M12 9.5v4.5" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function AlertOctagonIcon({ size, className }) {
  return (
    <Svg size={size} className={className}>
      <path d="M8.2 2.5h7.6l5.7 5.7v7.6l-5.7 5.7H8.2l-5.7-5.7V8.2z" />
      <path d="M12 7.5v5.5" />
      <circle cx="12" cy="16.5" r="0.9" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function CheckCircleIcon({ size, className }) {
  return (
    <Svg size={size} className={className}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="m8 12.2 2.8 2.8L16.4 9" />
    </Svg>
  );
}

export function ActivityIcon({ size, className }) {
  return (
    <Svg size={size} className={className}>
      <path d="M2.5 12h4l3-7.5 5 15 3-7.5h4" />
    </Svg>
  );
}

export function BotIcon({ size, className }) {
  return (
    <Svg size={size} className={className}>
      <rect x="4.5" y="8" width="15" height="11" rx="3" />
      <path d="M12 8V4.5M12 4.5a1.4 1.4 0 1 0-.01 0z" />
      <circle cx="9" cy="13" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13" r="1" fill="currentColor" stroke="none" />
      <path d="M9.5 16.2h5" />
    </Svg>
  );
}

export function ClockIcon({ size, className }) {
  return (
    <Svg size={size} className={className}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 6.5V12l3.5 2.5" />
    </Svg>
  );
}

export function LayoutIcon({ size, className }) {
  return (
    <Svg size={size} className={className}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
      <path d="M3.5 12H12M12 3.5V20.5" />
    </Svg>
  );
}

export function SunIcon({ size, className }) {
  return (
    <Svg size={size} className={className}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.5M12 19v2.5M4.4 4.4l1.8 1.8M17.8 17.8l1.8 1.8M2.5 12H5M19 12h2.5M4.4 19.6l1.8-1.8M17.8 6.2l1.8-1.8" />
    </Svg>
  );
}

export function MoonIcon({ size, className }) {
  return (
    <Svg size={size} className={className}>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
    </Svg>
  );
}

export function RotateIcon({ size, className }) {
  return (
    <Svg size={size} className={className}>
      <path d="M4.2 12a7.8 7.8 0 1 0 2.2-5.4" />
      <path d="M3.6 4.4v4h4" />
    </Svg>
  );
}
