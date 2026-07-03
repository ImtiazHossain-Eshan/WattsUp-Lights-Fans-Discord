import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { SunIcon, MoonIcon, RotateIcon } from "./Icons.jsx";
import { officeNowMs, useOfficeNow, formatOfficeDate } from "../officeClock.js";

const SPEEDS = [
  { value: 1, label: "1×" },
  { value: 60, label: "60×" },
  { value: 300, label: "300×" },
  { value: 1800, label: "1800×" },
];

const JUMPS = [
  { label: "09:00", time: "09:00" },
  { label: "13:00", time: "13:00" },
  { label: "18:00", time: "18:00" },
  { label: "23:00", time: "23:00" },
];

const OFFICE_START = 9;
const OFFICE_END = 17;
const DIAL = 74; // viewBox size
const C = DIAL / 2;
const R = 30;

/** point on a circle, 0° = top, clockwise */
function polar(r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(rad), C + r * Math.sin(rad)];
}
function arc(r, startDeg, endDeg) {
  const [x1, y1] = polar(r, startDeg);
  const [x2, y2] = polar(r, endDeg);
  const large = (endDeg - startDeg + 360) % 360 > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}
function dayFraction(ms) {
  const d = new Date(ms);
  return (
    (d.getHours() * 3600 +
      d.getMinutes() * 60 +
      d.getSeconds() +
      d.getMilliseconds() / 1000) /
    86400
  );
}

/** The live time face — a smoothly sweeping 24h dial (framer-motion rAF). */
function TimeDial() {
  const handRef = useRef(null);
  const glowRef = useRef(null);

  // Smoothly sweep the hand every frame straight off the office clock, so it
  // races visibly at high speed and never fights React's render cadence.
  useEffect(() => {
    let raf;
    const tick = () => {
      const angle = dayFraction(officeNowMs()) * 360;
      const t = `rotate(${angle} ${C} ${C})`;
      if (handRef.current) handRef.current.setAttribute("transform", t);
      if (glowRef.current) glowRef.current.setAttribute("transform", t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const officeArc = arc(R, (OFFICE_START / 24) * 360, (OFFICE_END / 24) * 360);
  const ticks = Array.from({ length: 24 }, (_, h) => {
    const major = h % 6 === 0;
    const [x1, y1] = polar(R + 4, h * 15);
    const [x2, y2] = polar(R + (major ? 9 : 6.5), h * 15);
    return { x1, y1, x2, y2, major, key: h };
  });

  return (
    <div className="clock-dial">
      <svg viewBox={`0 0 ${DIAL} ${DIAL}`} className="clock-dial-svg">
        <circle className="clock-dial-track" cx={C} cy={C} r={R} />
        {/* office-hours highlight arc */}
        <path className="clock-dial-office" d={officeArc} />
        {/* hour ticks */}
        {ticks.map((t) => (
          <line
            key={t.key}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            className={`clock-tick ${t.major ? "is-major" : ""}`}
          />
        ))}
        {/* sweeping hand + soft glow wedge */}
        <g ref={glowRef}>
          <line className="clock-hand-glow" x1={C} y1={C} x2={C} y2={C - R - 2} />
        </g>
        <g ref={handRef}>
          <line className="clock-hand" x1={C} y1={C + 5} x2={C} y2={C - R - 1} />
          <circle className="clock-hand-tip" cx={C} cy={C - R - 1} r="1.9" />
        </g>
        <circle className="clock-dial-hub" cx={C} cy={C} r="2.4" />
      </svg>
    </div>
  );
}

/**
 * Office clock — the dashboard's global, controllable time source. A live 24h
 * dial, a big monospace readout, speed control, jump presets and a custom time,
 * all writing to the backend clock service. Everything time-based in the app
 * (device ages, alerts, kWh) derives from this clock, so jumping to 18:00 makes
 * after-hours alerts appear everywhere and 1800× ages rooms in seconds.
 */
export default function TimeControl({ clock, busy, onSetTime, onSetSpeed, onReset }) {
  const nowMs = useOfficeNow(200);
  const [customTime, setCustomTime] = useState("");

  const speed = clock?.speed ?? 1;
  const isReal = Boolean(clock?.isRealTime);
  const d = new Date(nowMs);
  const hour = d.getHours();
  const inOfficeHours = hour >= OFFICE_START && hour < OFFICE_END;
  const isDay = hour >= 6 && hour < 18;

  const hh = String(((hour + 11) % 12) + 1).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const ampm = hour < 12 ? "AM" : "PM";

  const container = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.06, delayChildren: 0.02 } },
  };
  const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.section
      className={`panel clockbar ${speed > 1 ? "is-fast" : ""}`}
      role="group"
      aria-label="Office clock controls"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <div className="clockbar-glow" aria-hidden="true" />

      <motion.div className="clockbar-face" variants={item}>
        <TimeDial />
        <div className="clockbar-readout">
          <div className="clock-time" aria-live="off">
            <span>{hh}</span>
            <span className="clock-colon">:</span>
            <span>{mm}</span>
            <span className="clock-colon clock-colon--sec">:</span>
            <span className="clock-sec">{ss}</span>
            <span className="clock-ampm">{ampm}</span>
          </div>
          <div className="clock-sub">
            <span className="clock-date">{formatOfficeDate(nowMs)}</span>
            <span
              className={`clock-phase ${inOfficeHours ? "is-office" : "is-after"}`}
              title="Office hours 9 AM – 5 PM. Devices ON outside them raise alerts."
            >
              <span className="clock-phase-ico">
                {isDay ? <SunIcon size={12} /> : <MoonIcon size={12} />}
              </span>
              {inOfficeHours ? "Office hours" : "After hours"}
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div className="clockbar-controls" variants={item}>
        <div className="clock-field">
          <label>Speed</label>
          <div className="seg" role="group" aria-label="Clock speed">
            {SPEEDS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`seg-btn ${speed === value ? "active" : ""}`}
                aria-pressed={speed === value}
                disabled={busy}
                onClick={() => onSetSpeed(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="clock-field">
          <label>Jump to</label>
          <div className="clock-jumps">
            {JUMPS.map(({ label, time }) => (
              <button
                key={time}
                type="button"
                className="chip"
                disabled={busy}
                onClick={() => onSetTime(time)}
              >
                {label}
              </button>
            ))}
            <span className="clock-custom">
              <input
                type="time"
                className="clock-input"
                value={customTime}
                aria-label="Custom office time"
                disabled={busy}
                onChange={(e) => setCustomTime(e.target.value)}
              />
              <button
                type="button"
                className="btn btn--sm btn--brand"
                disabled={busy || !customTime}
                onClick={() => customTime && onSetTime(customTime)}
              >
                Set
              </button>
            </span>
          </div>
        </div>

        <button
          type="button"
          className={`clock-reset ${isReal ? "is-real" : ""}`}
          disabled={busy || isReal}
          onClick={onReset}
          title="Snap the clock back to real time at 1× speed"
        >
          <RotateIcon size={14} />
          {isReal ? "Live · real time" : "Reset to real time"}
        </button>
      </motion.div>
    </motion.section>
  );
}
