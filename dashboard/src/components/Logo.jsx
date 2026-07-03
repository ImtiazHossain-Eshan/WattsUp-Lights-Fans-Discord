/**
 * WattsUp brand mark — a modern, mono/matrix-flavoured logo.
 *
 * A hexagonal energy core: a slowly rotating brand-pink conic ring, a glassy
 * dark tile, and a stylised lightning bolt with a vertical "charge" shimmer.
 * The wordmark is Geist Mono with a blinking terminal caret. All motion is
 * CSS (see app.css) so it stays cheap and always-on.
 */
export default function Logo() {
  return (
    <div className="brand">
      <span className="brand-logo" aria-hidden="true">
        <span className="brand-logo-ring" />
        <svg viewBox="0 0 44 44" className="brand-logo-svg">
          <defs>
            <linearGradient id="wu-bolt" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ff8fb0" />
              <stop offset="0.5" stopColor="#f44174" />
              <stop offset="1" stopColor="#c81e56" />
            </linearGradient>
            <clipPath id="wu-bolt-clip">
              <path d="M25 7 13.6 24.2a1 1 0 0 0 .84 1.55H20l-2 11.4a.7.7 0 0 0 1.27.52L31 20.3a1 1 0 0 0-.84-1.55H24l2.3-10.4A.7.7 0 0 0 25 7Z" />
            </clipPath>
          </defs>
          {/* hex tile */}
          <path
            className="brand-logo-tile"
            d="M22 2.6 37.7 11.7a3 3 0 0 1 1.5 2.6v15.4a3 3 0 0 1-1.5 2.6L22 41.4a3 3 0 0 1-3 0L3.3 32.3a3 3 0 0 1-1.5-2.6V14.3a3 3 0 0 1 1.5-2.6L19 2.6a3 3 0 0 1 3 0Z"
          />
          {/* bolt + shimmer sweep */}
          <g clipPath="url(#wu-bolt-clip)">
            <rect x="10" y="5" width="24" height="34" fill="url(#wu-bolt)" />
            <rect className="brand-logo-shine" x="10" y="5" width="24" height="7" />
          </g>
        </svg>
      </span>

      <div className="brand-text">
        <h1>
          Watts<span className="brand-accent">Up</span>
          <i className="brand-caret" aria-hidden="true" />
        </h1>
        <p>
          <span className="brand-tag-dot" aria-hidden="true" />
          office energy monitor
        </p>
      </div>
    </div>
  );
}
