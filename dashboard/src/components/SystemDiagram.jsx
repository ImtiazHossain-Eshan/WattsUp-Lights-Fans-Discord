import { useEffect, useMemo, useRef, useState } from "react";
import { SitemapIcon } from "./Icons.jsx";

/**
 * System-architecture scene, rendered live inside the dashboard.
 *
 * Instead of a flat boxes-and-arrows chart, the flow is staged as an isometric
 * 3D scene: three floating glass slabs (Sources · Backend · Clients) hovering
 * over a glowing grid floor, wired together by connectors that carry animated
 * "energy" pulses — fitting for an electricity monitor. The whole world tilts
 * with the pointer (parallax) and each card floats above its footprint on a
 * soft shadow. Hover a card to trace its flows (others dim); click for detail.
 *
 * A few cards surface LIVE backend numbers (devices on, active alerts,
 * connection, simulation) so the scene mirrors real state.
 *
 * Pure React + SVG + CSS 3D transforms — no Mermaid, no diagram libs.
 */

// ── flat design canvas; the whole thing is scaled to fit + tilted in 3D ──────
const CANVAS = { w: 1200, h: 620 };

// the label layer floats above the cards at this depth; to keep the chips
// aligned with the wires (which sit near the base plane) we pre-shrink them so
// the perspective enlargement at LABEL_Z cancels out. See .arch3d-labels.
const PERSPECTIVE = 1700;
const WIRE_Z = 2;
const LABEL_Z = 110;
const LABEL_FIX = (PERSPECTIVE - LABEL_Z) / (PERSPECTIVE - WIRE_Z);

// backend "slab" that visually contains the core submodules
const SLAB = { x: 330, y: 58, w: 530, h: 420 };

// ── node model (coordinates in the flat CANVAS space) ────────────────────────
const NODES = [
  // ── sources (left) ──
  { id: "office", grp: "device", x: 40, y: 92, w: 224, h: 96, depth: 18,
    title: "Office Rooms", sub: "3 rooms · 15 devices",
    lines: ["Drawing Room, Work Room 1 & 2", "2 fans + 3 lights each"] },
  { id: "sim", grp: "device", x: 40, y: 212, w: 224, h: 112, depth: 30,
    title: "Simulated Device Layer", sub: "dynamic dummy data",
    lines: ["ON/OFF states · power draw", "timestamps · 15 devices"] },
  { id: "hw", grp: "future", x: 40, y: 348, w: 224, h: 96, depth: 8,
    title: "Hardware Concept", sub: "ESP32 · one room (future)",
    lines: ["switches + LED indicators", "real AC → relays + sensors"] },

  // ── backend core (center slab) ──
  { id: "store", grp: "store", x: 352, y: 116, w: 486, h: 88, depth: 54,
    title: "Device State Store", sub: "in-memory · 15 devices",
    lines: ["status · wattage · currentPower", "room · lastChanged · turnedOnAt",
      "controlMode (auto / manual)"] },
  { id: "simsvc", grp: "backend", x: 352, y: 224, w: 152, h: 86, depth: 34,
    title: "Simulator Service", sub: "nudges auto devices",
    lines: ["toggles one random auto device", "toward its room's occupancy"] },
  { id: "usage", grp: "info", x: 519, y: 224, w: 152, h: 86, depth: 34,
    title: "Usage Calculator", sub: "power + kWh",
    lines: ["total & per-room W", "estimated kWh today"] },
  { id: "alert", grp: "alert", x: 686, y: 224, w: 152, h: 86, depth: 34,
    title: "Alert Engine", sub: "anomaly detection",
    lines: ["after-hours devices", "long-running rooms"] },
  { id: "rest", grp: "backend", x: 352, y: 332, w: 152, h: 96, depth: 40,
    title: "REST API", sub: "request / control",
    lines: ["GET /api/devices, /rooms", "/usage, /alerts", "PATCH …/toggle"] },
  { id: "socket", grp: "info", x: 519, y: 332, w: 152, h: 96, depth: 40,
    title: "Socket.IO", sub: "real-time push",
    lines: ["devices · rooms · usage", "alerts · simulation", "clock : update"] },
  { id: "manual", grp: "backend", x: 686, y: 332, w: 152, h: 96, depth: 40,
    title: "Manual Control", sub: "writes device state",
    lines: ["PATCH toggle · state · mode", "all-off · reset-auto"] },

  // ── clients (right) ──
  { id: "dash", grp: "frontend", x: 930, y: 96, w: 236, h: 132, depth: 60,
    title: "React Dashboard", sub: "main visual interface",
    lines: ["live 3D office layout", "status · power · alerts", "manual + simulation controls"] },
  { id: "bot", grp: "bot", x: 930, y: 252, w: 236, h: 124, depth: 46,
    title: "Discord Bot", sub: "discord.js",
    lines: ["!status · !room · !usage", "!alerts · !help", "!simulation · !turnoff"] },
  { id: "user", grp: "user", x: 930, y: 400, w: 236, h: 108, depth: 22,
    title: "User / Boss", sub: "watches & controls",
    lines: ["opens dashboard · sends commands", "controls devices · gets alerts"] },
];
const MAP = Object.fromEntries(NODES.map((n) => [n.id, n]));

// anchor point on a node rect, as a fraction of its box
const P = (id, fx, fy) => {
  const n = MAP[id];
  return [Math.round(n.x + fx * n.w), Math.round(n.y + fy * n.h)];
};
const f = (p) => `${p[0]},${p[1]}`;
const curve = (p0, c1, c2, p1) => `M${f(p0)} C${f(c1)} ${f(c2)} ${f(p1)}`;
const line = (p0, p1) => `M${f(p0)} L${f(p1)}`;

// ── edge model ───────────────────────────────────────────────────────────────
const EDGES = [
  // hero energy flows (animated pulses)
  { id: "sim-store", from: "sim", to: "store", kind: "device", flow: true,
    d: curve(P("sim", 1, 0.4), [312, 268], [332, 168], P("store", 0, 0.6)),
    label: "updates state", lp: [300, 214] },
  { id: "socket-dash", from: "socket", to: "dash", kind: "info", flow: true,
    d: curve(P("socket", 1, 0.4), [770, 366], [820, 176], P("dash", 0, 0.62)),
    label: "live push", lp: [886, 206] },
  { id: "bot-rest", from: "bot", to: "rest", kind: "bot", flow: true, bi: true,
    d: curve(P("bot", 0, 0.5), [640, 476], [430, 506], P("rest", 0.5, 1)),
    label: "REST · read-only", lp: [556, 506] },
  { id: "alert-bot", from: "alert", to: "bot", kind: "alert", flow: true,
    d: curve(P("alert", 1, 0.55), [890, 276], [900, 300], P("bot", 0, 0.35)),
    label: "alerts", lp: [886, 268] },
  { id: "dash-manual", from: "dash", to: "manual", kind: "info", flow: true,
    d: curve(P("dash", 0, 0.92), [910, 306], [800, 306], P("manual", 0.5, 0)),
    label: "control", lp: [884, 300] },

  // user interaction (delivery, no pulses)
  { id: "user-dash", from: "user", to: "dash", kind: "user",
    d: curve(P("user", 0.92, 0), [1190, 386], [1190, 244], P("dash", 0.92, 1)),
    label: "opens", lp: [1192, 306] },
  { id: "user-bot", from: "user", to: "bot", kind: "user",
    d: line(P("user", 0.34, 0), P("bot", 0.34, 1)),
    label: "commands · replies", lp: [1048, 390] },
  { id: "bot-user", from: "bot", to: "user", kind: "bot",
    d: line(P("bot", 0.66, 1), P("user", 0.66, 0)) },

  // backend internals (subtle, no pulses / no labels)
  { id: "simsvc-store", from: "simsvc", to: "store", kind: "muted",
    d: line(P("simsvc", 0.5, 0), P("store", 0.28, 1)) },
  { id: "store-usage", from: "store", to: "usage", kind: "muted",
    d: line(P("store", 0.5, 1), P("usage", 0.5, 0)) },
  { id: "store-alert", from: "store", to: "alert", kind: "muted",
    d: curve(P("store", 0.72, 1), [762, 210], [762, 216], P("alert", 0.5, 0)) },
  { id: "manual-store", from: "manual", to: "store", kind: "muted",
    d: curve(P("manual", 1, 0.4), [872, 366], [872, 168], P("store", 1, 0.5)) },
];

// adjacency for hover highlighting
const NEIGHBORS = (() => {
  const m = {};
  for (const n of NODES) m[n.id] = new Set();
  for (const e of EDGES) {
    m[e.from].add(e.to);
    m[e.to].add(e.from);
  }
  return m;
})();

const GROUP_LABEL = {
  device: "Devices / simulation",
  backend: "Backend core",
  store: "State store",
  info: "Real-time / usage",
  alert: "Alerts",
  frontend: "Web dashboard",
  bot: "Discord bot",
  user: "User",
  future: "Hardware (future)",
};

export default function SystemDiagram({ devices = [], alerts = [], simulation, connected }) {
  const [open, setOpen] = useState(true);
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [scale, setScale] = useState(1);
  const [padX, setPadX] = useState(0);
  const active = hovered || selected;

  const viewportRef = useRef(null);
  const worldRef = useRef(null);

  // scale the fixed-size canvas to fit the panel width
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      // leave a margin so 3D-raised cards near the edges never clip
      const s = Math.min(1.06, w / CANVAS.w) * 0.93;
      setScale(s);
      setPadX(Math.max(0, (w - CANVAS.w * s) / 2));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  // pointer parallax — tilt the world around a base isometric pose
  const onMove = (e) => {
    const world = worldRef.current;
    if (!world) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    world.style.setProperty("--rx", `${(-py * 5).toFixed(2)}deg`);
    world.style.setProperty("--ry", `${(px * 8).toFixed(2)}deg`);
  };
  const onLeave = () => {
    const world = worldRef.current;
    if (!world) return;
    world.style.setProperty("--rx", "0deg");
    world.style.setProperty("--ry", "0deg");
  };

  // live annotations for a few nodes
  const live = useMemo(() => {
    const on = devices.filter((d) => d.status === "on").length;
    return {
      store: devices.length ? `${on}/${devices.length} on` : null,
      alert: alerts.length ? `${alerts.length} active` : "0 active",
      dash: connected ? "live" : "offline",
      bot: connected ? "online" : null,
      sim: simulation ? (simulation.enabled ? "running" : "paused") : null,
    };
  }, [devices, alerts, simulation, connected]);

  const detail = active ? MAP[active] : null;

  const nodeState = (id) => {
    if (!active) return "";
    if (id === active) return "is-hot";
    return NEIGHBORS[active]?.has(id) ? "is-hot" : "is-dim";
  };
  const edgeState = (e) => {
    if (!active) return "";
    return e.from === active || e.to === active ? "is-hot" : "is-dim";
  };

  return (
    <section className="panel sysdiagram">
      <h2>
        <SitemapIcon size={15} /> System architecture
        <button
          type="button"
          className="btn btn--sm sysdiagram-toggle"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide" : "Show"}
        </button>
      </h2>

      {open && (
        <>
          <p className="sysdiagram-lead">
            One shared backend is the single source of truth: the simulated device layer
            updates it, and both the dashboard (via Socket.IO) and the Discord bot (via REST)
            read the same state — so they always match.{" "}
            <span className="sysdiagram-lead-hint">Move your pointer to orbit · hover a slab to trace its flows.</span>
          </p>

          <div
            className={`arch3d-viewport ${active ? "has-active" : ""}`}
            ref={viewportRef}
            style={{ height: `${Math.round(CANVAS.h * scale + 40)}px` }}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            onClick={() => setSelected(null)}
          >
            <div
              className="arch3d-scaler"
              style={{ width: CANVAS.w, height: CANVAS.h, left: padX, top: 20, transform: `scale(${scale})` }}
            >
              <div className="arch3d-world" ref={worldRef}>
                {/* glowing grid floor beneath everything */}
                <div className="arch3d-floor" aria-hidden="true" />

                {/* lane titles */}
                <div className="arch3d-lane arch3d-lane--src" style={laneStyle(24, 40)}>Sources</div>
                <div className="arch3d-lane arch3d-lane--cli" style={laneStyle(930, 60)}>Clients</div>

                {/* backend slab */}
                <div
                  className={`arch3d-slab ${active && active !== "store" && !NEIGHBORS[active]?.has("store") ? "is-back" : ""}`}
                  style={{ left: SLAB.x, top: SLAB.y, width: SLAB.w, height: SLAB.h }}
                  aria-hidden="true"
                >
                  <span className="arch3d-slab-title">Backend · single source of truth</span>
                  <span className="arch3d-slab-sub">Node.js · Express · Socket.IO</span>
                </div>

                {/* connectors + energy pulses (flat SVG in the same tilted plane) */}
                <svg
                  className="arch3d-wires"
                  viewBox={`0 0 ${CANVAS.w} ${CANVAS.h}`}
                  role="img"
                  aria-label="WattsUp system architecture: devices and simulator feed one backend, which serves the React dashboard over Socket.IO and the Discord bot over REST."
                >
                  <defs>
                    <marker id="a3-arrow" markerWidth="9" markerHeight="9" refX="6.5" refY="4.5"
                      orient="auto" markerUnits="userSpaceOnUse">
                      <path d="M1,1 L8,4.5 L1,8 z" fill="context-stroke" />
                    </marker>
                    <marker id="a3-arrow-start" markerWidth="9" markerHeight="9" refX="2.5" refY="4.5"
                      orient="auto-start-reverse" markerUnits="userSpaceOnUse">
                      <path d="M1,1 L8,4.5 L1,8 z" fill="context-stroke" />
                    </marker>
                  </defs>

                  {EDGES.map((e) => (
                    <g key={e.id} className={`a3-edge a3-edge--${e.kind} ${edgeState(e)}`}>
                      {/* soft glow underlay */}
                      <path d={e.d} className="a3-edge-glow" />
                      {/* the wire */}
                      <path
                        id={`a3-${e.id}`}
                        d={e.d}
                        className="a3-edge-path"
                        markerEnd="url(#a3-arrow)"
                        markerStart={e.bi ? "url(#a3-arrow-start)" : undefined}
                      />
                      {/* travelling energy */}
                      {e.flow && (
                        <>
                          <circle className="a3-pulse a3-pulse--trail" r="5">
                            <animateMotion dur="2.6s" repeatCount="indefinite" rotate="auto">
                              <mpath href={`#a3-${e.id}`} />
                            </animateMotion>
                          </circle>
                          <circle className="a3-pulse" r="3">
                            <animateMotion dur="2.6s" repeatCount="indefinite" rotate="auto">
                              <mpath href={`#a3-${e.id}`} />
                            </animateMotion>
                          </circle>
                        </>
                      )}
                    </g>
                  ))}
                </svg>

                {/* floating node cards */}
                {NODES.map((n) => (
                  <div
                    key={n.id}
                    className={`arch3d-node arch3d-node--${n.grp} ${nodeState(n.id)} ${selected === n.id ? "is-sel" : ""}`}
                    style={{
                      left: n.x,
                      top: n.y,
                      width: n.w,
                      height: n.h,
                      "--z": `${n.depth}px`,
                    }}
                    onMouseEnter={() => setHovered(n.id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setSelected((s) => (s === n.id ? null : n.id));
                    }}
                  >
                    <div className="arch3d-node-face">
                      <div className="arch3d-node-head">
                        <span className="arch3d-node-dot" aria-hidden="true" />
                        <span className="arch3d-node-title">{n.title}</span>
                        {live[n.id] && <span className="arch3d-node-live">{live[n.id]}</span>}
                      </div>
                      <div className="arch3d-node-sub">{n.sub}</div>
                    </div>
                  </div>
                ))}

                {/* edge labels on the very top layer, so cards never cover them */}
                <svg
                  className="arch3d-labels"
                  viewBox={`0 0 ${CANVAS.w} ${CANVAS.h}`}
                  aria-hidden="true"
                >
                  <g transform={`translate(${CANVAS.w / 2} ${CANVAS.h / 2}) scale(${LABEL_FIX}) translate(${-CANVAS.w / 2} ${-CANVAS.h / 2})`}>
                    {EDGES.filter((e) => e.label).map((e) => {
                      const w = Math.round(e.label.length * 5.6 + 16);
                      return (
                        <g key={e.id} className={`a3-label a3-edge--${e.kind} ${edgeState(e)}`}>
                          <rect className="a3-label-bg" x={e.lp[0] - w / 2} y={e.lp[1] - 9}
                            width={w} height="17" rx="6" />
                          <text className="a3-label-text" x={e.lp[0]} y={e.lp[1] + 3.5}
                            textAnchor="middle">
                            {e.label}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>
              </div>
            </div>
          </div>

          <div className="sysdiagram-footer">
            <div className="sysdiagram-legend">
              {["device", "backend", "info", "alert", "frontend", "bot", "future"].map((g) => (
                <span key={g} className={`sd-key sd-key--${g}`}>
                  <i /> {GROUP_LABEL[g]}
                </span>
              ))}
            </div>

            <div className={`sysdiagram-detail ${detail ? "is-shown" : ""}`}>
              {detail ? (
                <>
                  <div className="sysdiagram-detail-head">
                    <span className={`sd-node-dot arch3d-node--${detail.grp}`} aria-hidden="true" />
                    <strong>{detail.title}</strong>
                    <span className="sysdiagram-detail-grp">{GROUP_LABEL[detail.grp]}</span>
                  </div>
                  <p>{detail.sub}</p>
                  {detail.lines.length > 0 && (
                    <ul>
                      {detail.lines.map((l) => (
                        <li key={l}>{l}</li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <p className="sysdiagram-detail-hint">
                  Hover or tap a slab to trace its data flows and see details.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

// lane title chips are positioned in the flat canvas space
function laneStyle(x, y) {
  return { left: x, top: y };
}
