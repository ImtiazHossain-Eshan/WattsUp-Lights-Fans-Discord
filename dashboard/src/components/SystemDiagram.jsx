import { useMemo, useState } from "react";
import { SitemapIcon } from "./Icons.jsx";

/**
 * Interactive system-architecture diagram, rendered live inside the dashboard.
 *
 * Left → right: device/simulation sources · the backend "single source of truth"
 * container (with its submodules) · the two clients + the user. Hover any block
 * to trace its flows (others dim); click for a detail card. Data pulses animate
 * along the main connectors. A few blocks show LIVE backend numbers (devices on,
 * active alerts, connection, simulation) so the diagram mirrors real state.
 *
 * Pure SVG + foreignObject cards (themed with app.css) — no Mermaid, no libs.
 */

// ── node model (coordinates in a 1280×648 viewBox) ─────────────────────────
const NODES = [
  // sources (left)
  { id: "office", grp: "device", x: 28, y: 56, w: 224, h: 116, title: "Office Rooms",
    sub: "3 rooms · 15 devices", lines: ["Drawing Room, Work Room 1 & 2", "2 fans + 3 lights each"] },
  { id: "sim", grp: "device", x: 28, y: 238, w: 224, h: 126, title: "Simulated Device Layer",
    sub: "dynamic dummy data", lines: ["ON/OFF states · power draw", "timestamps · 15 devices"] },
  { id: "hw", grp: "future", x: 28, y: 430, w: 224, h: 104, title: "Hardware Concept",
    sub: "ESP32 · one room (future)", lines: ["switches + LED indicators", "real AC → relays + sensors"] },

  // backend submodules (center)
  { id: "simsvc", grp: "backend", x: 320, y: 100, w: 250, h: 76, title: "Simulator Service",
    sub: "nudges auto devices", lines: [] },
  { id: "store", grp: "store", x: 598, y: 96, w: 284, h: 120, title: "Device State Store",
    sub: "in-memory · 15 devices",
    lines: ["status · wattage · currentPower", "room · lastChanged · turnedOnAt", "controlMode (auto / manual)"] },
  { id: "usage", grp: "info", x: 320, y: 238, w: 176, h: 92, title: "Usage Calculator",
    sub: "power + kWh", lines: ["total & per-room W", "estimated kWh today"] },
  { id: "alert", grp: "alert", x: 512, y: 238, w: 176, h: 92, title: "Alert Engine",
    sub: "anomaly detection", lines: ["after-hours devices", "long-running rooms"] },
  { id: "room", grp: "backend", x: 704, y: 238, w: 178, h: 92, title: "Room Summary",
    sub: "per-room rollups", lines: ["fans / lights on", "room power"] },
  { id: "rest", grp: "backend", x: 320, y: 386, w: 176, h: 104, title: "REST API",
    sub: "request / control", lines: ["GET /api/devices, /rooms", "/usage, /alerts", "PATCH …/toggle"] },
  { id: "socket", grp: "info", x: 512, y: 386, w: 176, h: 104, title: "Socket.IO Broadcaster",
    sub: "real-time push", lines: ["devices · rooms · usage", "alerts · simulation", "clock : update"] },
  { id: "manual", grp: "backend", x: 704, y: 386, w: 178, h: 104, title: "Manual Control API",
    sub: "writes device state", lines: ["PATCH toggle · state · mode", "all-off · reset-auto"] },

  // clients (right)
  { id: "dash", grp: "frontend", x: 948, y: 52, w: 304, h: 150, title: "React Web Dashboard",
    sub: "main visual interface", lines: ["live 3D office layout", "status · power · alerts", "manual + simulation controls"] },
  { id: "bot", grp: "bot", x: 948, y: 250, w: 304, h: 150, title: "Discord Bot",
    sub: "discord.js", lines: ["!status · !room · !usage", "!alerts · !help", "!simulation · !turnoff"] },
  { id: "user", grp: "user", x: 948, y: 448, w: 304, h: 110, title: "User / Boss",
    sub: "watches & controls", lines: ["opens dashboard · sends commands", "controls devices · gets alerts"] },
];
const MAP = Object.fromEntries(NODES.map((n) => [n.id, n]));

// backend container box (drawn behind the submodules)
const BACKEND = { x: 300, y: 32, w: 600, h: 484 };

// ── edge model ─────────────────────────────────────────────────────────────
const P = (id, fx, fy) => {
  const n = MAP[id];
  return [Math.round(n.x + fx * n.w), Math.round(n.y + fy * n.h)];
};
const f = (p) => `${p[0]},${p[1]}`;
const curve = (p0, c1, c2, p1) => `M${f(p0)} C${f(c1)} ${f(c2)} ${f(p1)}`;
const line = (p0, p1) => `M${f(p0)} L${f(p1)}`;

const EDGES = [
  // external hero flows (animated)
  { id: "sim-store", from: "sim", to: "store", kind: "device", flow: true,
    d: curve(P("sim", 1, 0.5), [430, 301], [470, 155], P("store", 0, 0.5)),
    label: "updates state", lp: [430, 214] },
  { id: "socket-dash", from: "socket", to: "dash", kind: "ok", flow: true,
    d: curve(P("socket", 1, 0.5), [812, 438], [812, 127], P("dash", 0, 0.5)),
    label: "live · no refresh", lp: [740, 356] },
  { id: "dash-manual", from: "dash", to: "manual", kind: "info", flow: true,
    d: curve(P("dash", 0, 0.9), [948, 320], [793, 300], P("manual", 0.5, 0)),
    label: "PATCH state/mode", lp: [872, 356] },
  { id: "bot-rest", from: "bot", to: "rest", kind: "bot", flow: true, bi: true,
    d: curve(P("bot", 0.5, 1), [1100, 600], [408, 600], P("rest", 0.5, 1)),
    label: "REST · !status !room !usage !alerts", lp: [754, 606] },
  { id: "alert-bot", from: "alert", to: "bot", kind: "alert", flow: true,
    d: curve(P("alert", 0.5, 1), [600, 626], [1000, 560], P("bot", 0.18, 1)),
    label: "proactive alerts", lp: [792, 628] },

  // delivery + user interaction
  { id: "bot-user", from: "bot", to: "user", kind: "bot",
    d: line(P("bot", 0.86, 1), P("user", 0.86, 0)), label: "replies · alerts", lp: [1235, 424] },
  { id: "user-dash", from: "user", to: "dash", kind: "user",
    d: curve(P("user", 0.97, 0.2), [1270, 470], [1270, 190], P("dash", 0.97, 1)),
    label: "opens", lp: [1268, 330] },
  { id: "user-bot", from: "user", to: "bot", kind: "user",
    d: line(P("user", 0.42, 0), P("bot", 0.42, 1)), label: "commands", lp: [1092, 424] },

  // backend internals (subtle, no flow dots)
  { id: "simsvc-store", from: "simsvc", to: "store", kind: "muted",
    d: line(P("simsvc", 1, 0.5), P("store", 0, 0.35)), label: "toggle", lp: [584, 128] },
  { id: "store-usage", from: "store", to: "usage", kind: "muted",
    d: curve(P("store", 0.5, 1), [600, 230], [408, 230], P("usage", 0.5, 0)) },
  { id: "store-alert", from: "store", to: "alert", kind: "muted",
    d: curve(P("store", 0.5, 1), [690, 230], [600, 232], P("alert", 0.5, 0)) },
  { id: "store-room", from: "store", to: "room", kind: "muted",
    d: curve(P("store", 0.5, 1), [772, 230], [793, 232], P("room", 0.5, 0)) },
  { id: "manual-store", from: "manual", to: "store", kind: "muted",
    d: curve(P("manual", 1, 0.5), [896, 438], [896, 155], P("store", 1, 0.5)),
    label: "writes", lp: [900, 300] },
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
  const active = hovered || selected;

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
            read the same state — so they always match. Hover a block to trace its flows.
          </p>

          <div className="sysdiagram-stage">
            <svg
              viewBox="0 0 1280 648"
              className={`sysdiagram-svg ${active ? "has-active" : ""}`}
              role="img"
              aria-label="WattsUp system architecture: devices and simulator feed one backend, which serves the React dashboard over Socket.IO and the Discord bot over REST."
              onClick={() => setSelected(null)}
            >
              <defs>
                <marker id="sd-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5"
                  orient="auto" markerUnits="userSpaceOnUse">
                  <path d="M1,1 L8,4.5 L1,8 z" fill="context-stroke" />
                </marker>
                <marker id="sd-arrow-start" markerWidth="9" markerHeight="9" refX="2" refY="4.5"
                  orient="auto-start-reverse" markerUnits="userSpaceOnUse">
                  <path d="M1,1 L8,4.5 L1,8 z" fill="context-stroke" />
                </marker>
              </defs>

              {/* backend container */}
              <g className={`sd-container ${nodeState("store") === "is-dim" && active !== "store" ? "" : ""}`}>
                <rect x={BACKEND.x} y={BACKEND.y} width={BACKEND.w} height={BACKEND.h}
                  rx="16" className="sd-container-box" />
                <text x={BACKEND.x + 20} y={BACKEND.y + 26} className="sd-container-title">
                  Backend API Server
                </text>
                <text x={BACKEND.x + 20} y={BACKEND.y + 44} className="sd-container-sub">
                  Node.js · Express · Socket.IO — single source of truth
                </text>
              </g>

              {/* edges */}
              <g className="sd-edges">
                {EDGES.map((e) => (
                  <g key={e.id} className={`sd-edge sd-edge--${e.kind} ${edgeState(e)}`}>
                    <path
                      id={`sd-${e.id}`}
                      d={e.d}
                      className="sd-edge-path"
                      markerEnd="url(#sd-arrow)"
                      markerStart={e.bi ? "url(#sd-arrow-start)" : undefined}
                    />
                    {e.flow && (
                      <circle className="sd-flow" r="3.4">
                        <animateMotion dur="2.4s" repeatCount="indefinite" rotate="auto">
                          <mpath href={`#sd-${e.id}`} />
                        </animateMotion>
                      </circle>
                    )}
                  </g>
                ))}
              </g>

              {/* nodes */}
              <g className="sd-nodes">
                {NODES.map((n) => (
                  <foreignObject key={n.id} x={n.x} y={n.y} width={n.w} height={n.h}
                    className={`sd-node-fo ${nodeState(n.id)}`}>
                    <div
                      className={`sd-node sd-node--${n.grp} ${selected === n.id ? "is-sel" : ""}`}
                      onMouseEnter={() => setHovered(n.id)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setSelected((s) => (s === n.id ? null : n.id));
                      }}
                    >
                      <div className="sd-node-head">
                        <span className="sd-node-dot" aria-hidden="true" />
                        <span className="sd-node-title">{n.title}</span>
                        {live[n.id] && <span className="sd-node-live">{live[n.id]}</span>}
                      </div>
                      <div className="sd-node-sub">{n.sub}</div>
                    </div>
                  </foreignObject>
                ))}
              </g>

              {/* edge labels on a top layer, as chips, so they stay readable
                  even where a connector passes near a node card */}
              <g className="sd-labels">
                {EDGES.filter((e) => e.label).map((e) => {
                  const w = Math.round(e.label.length * 5.7 + 16);
                  return (
                    <g key={e.id} className={`sd-label sd-edge--${e.kind} ${edgeState(e)}`}>
                      <rect className="sd-label-bg" x={e.lp[0] - w / 2} y={e.lp[1] - 9}
                        width={w} height="17" rx="5" />
                      <text className="sd-edge-label" x={e.lp[0]} y={e.lp[1] + 3.5}
                        textAnchor="middle">
                        {e.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
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
                    <span className={`sd-node-dot sd-node--${detail.grp}`} aria-hidden="true" />
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
                  Hover or tap a block to trace its data flows and see details.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
