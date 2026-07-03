# ⚡ WattsUp — Office Lights & Fans Monitor

**Real-time web dashboard + Discord bot, powered by one shared backend.**

People in our small office forget to turn off lights and fans. WattsUp makes the
invisible visible: a cozy isometric live dashboard shows every device in every room,
a Discord bot answers "what's on right now?" from anywhere, and an alert engine calls
out after-hours waste — all fed by a **single backend source of truth**, so both views
always agree.

---

## ⚠️ Device-count assumption (PDF contradiction)

> The PDF contains a device-count inconsistency. It states every room has **2 fans and
> 3 lights** (= 5 devices × 3 rooms = **15 devices**), but elsewhere says "6 devices
> per room, 18 devices total". Since the actual fixed device list is 2 fans and 3
> lights per room, **this implementation uses 15 devices total** (6 fans + 9 lights).
> No invented sixth device. Also documented in `docs/validation-checklist.md`.

## The office — same devices, different rooms

**Every room has exactly the same device structure: 2 fans + 3 lights.** What differs
is each room's *purpose* — and the dashboard makes that visible: different furniture,
layout, accent and simulation behavior per room.

| Room | Purpose | Expected usage | Accent | Devices |
|------|---------|----------------|--------|---------|
| Drawing Room | **Waiting / lounge area** — used occasionally by visitors | low | green/slate | Fan 1, Fan 2, Light 1, Light 2, Light 3 |
| Work Room 1 | **Employee work area** — primary workspace | high | blue/slate | Fan 1, Fan 2, Light 1, Light 2, Light 3 |
| Work Room 2 | **Employee work area** — second workspace, different arrangement | high | teal/slate | Fan 1, Fan 2, Light 1, Light 2, Light 3 |

Fan = **60 W** when ON · Light = **15 W** when ON · anything OFF = 0 W.
Office max: 495 W. Only simulated device data exists — **no people data anywhere**.

### Room identities & configs

All room-specific behavior is driven by two small configs — no per-room components,
no duplicated code:

- **`dashboard/src/components/roomConfigs.js`** — visual identity per room: label,
  subtitle, purpose (`waiting_area` / `workspace`), furniture list, `layoutStyle`,
  accent color, description, which furnished room of the low-poly GLB backs it, and
  where its five devices hang. `OfficeLayout` groups devices by room, loads the
  matching config and renders one generic `Room3D`/`RoomCard` per room.
  - *Drawing Room* renders as a **lounge**: sofa, center table, TV dresser, plant,
    wall frames and a rug — softer and warmer than the work rooms.
  - *Work Room 1* renders as a **workspace**: desk, chair, PC setup, wall shelves,
    projector screen and a whiteboard.
  - *Work Room 2* is a **workspace with a different arrangement**: desks + chairs
    laid out differently, bookshelf, notice boards, an extra monitor workstation and
    a filing cabinet.
- **`backend/src/data/devices.js` (ROOMS)** — semantic identity per room (name,
  description, `type`, `expectedUsage`) plus the **simulation profile** used by the
  weighted simulator (below). Exposed via `/api/rooms`, so the Discord bot sees the
  same purposes.

## Features

- 🏠 **Cozy isometric 3D office** rendered with **Three.js** (react-three-fiber + drei):
  real GLB room models under an orthographic iso camera with drag-to-orbit, warm lighting
  and soft contact shadows — ceiling fans **spin** and pendant lights **glow** (real point
  lights), all driven by live backend state. Devices are drawn procedurally on top of the
  models, so every visual stays 100% data-driven
- 🎛️ **Manual + auto control**: every device has a `controlMode` (`auto`/`manual`). The
  simulator only touches **auto** devices; **manual** ones are the user's. Toggle any
  device's power or mode, click a fan/light in the 3D scene to toggle it, turn a whole
  room (or everything) off, reset all back to auto, or flip the simulation on/off — all
  from the dashboard. Controls **write to the backend first**; the UI updates from the
  broadcast, never from local-only state
- 📊 **Live panels**: total power meter, estimated kWh today, per-room bars, per-room
  device control cards (ON/OFF + Auto/Manual, dynamic SVG fan/light icons), alerts feed
  — updated via Socket.IO with **no page refresh**
- 🖱️ **Hover tooltips** on every scene device: name, room, status, watts, mode, last changed
- 🤖 **Discord bot**: `!status`, `!room <name>`, `!usage`, `!alerts`, `!help` — plus
  **proactive alert posts** to a channel (30 s poll, deduped by stable alert IDs)
- 🚨 **Alert engine**: after-hours devices (outside 9 AM–5 PM) and rooms fully ON for 2+ hours
- 🔁 **Simulator**: toggles one random device every 5 s and rebroadcasts everything —
  works headless, never invents rooms/devices, never changes wattages
- 🔌 **One source of truth**: dashboard and bot are pure readers of the same backend

## Architecture

```
                      ┌─ SIMULATED DEVICE LAYER (simulator.js, 1 toggle / 5 s)
                      ▼
   BACKEND — Node.js + Express :5000  (single source of truth)
   in-memory device store (15) · usage calculator · alert engine
        │                                     │
        │ REST /api/*                         │ Socket.IO push
        ▼                                     ▼
   DISCORD BOT (discord.js)              REACT DASHBOARD (Vite :5173)
   commands + proactive alerts           isometric live office
        ▼                                     ▼
   Discord channel  ─────────►  USER / BOSS  ◄───────── browser
```

Full diagram + draw.io/Excalidraw recreation guide: [`diagrams/system-architecture.md`](diagrams/system-architecture.md)
(no Mermaid, per the problem statement). Data flows:

- Device state → simulated data → backend → **Socket.IO** → live dashboard
- Device state → simulated data → backend → **REST API** → Discord bot → Discord message

The dashboard never generates device state. The bot never generates device state.
The backend owns everything.

## Tech stack

| Part | Stack |
|------|-------|
| Backend | Node.js, Express 4, Socket.IO 4, CORS, dotenv (in-memory store) |
| Dashboard | React 18, Vite 5, Three.js (react-three-fiber + drei), socket.io-client, axios, hand-written CSS |
| Bot | discord.js 14, axios, dotenv |
| Diagrams | Markdown/ASCII + recreation guides (draw.io/Excalidraw/Figma/Canva) |

## Folder structure

```
├── backend/
│   └── src/
│       ├── server.js              # Express + Socket.IO + simulator bootstrap
│       ├── socket.js              # io setup, snapshot-on-connect, emitState()
│       ├── data/devices.js        # the 15-device store (source of truth, incl. controlMode)
│       ├── services/
│       │   ├── simulator.js       # simulated device layer (toggles AUTO devices when enabled)
│       │   ├── simulationState.js # the simulation on/off flag + snapshot
│       │   ├── deviceService.js   # the one place that mutates device state / mode
│       │   ├── usageService.js    # totals, per-room W, estimated kWh
│       │   ├── alertService.js    # after-hours + long-running rules
│       │   └── roomService.js     # room summaries/details
│       ├── routes/                # health, devices, rooms, usage, alerts, simulation
│       └── utils/roomAliases.js   # "work1" → "Work Room 1"
├── dashboard/
│   ├── public/models/            # GLB room assets (room-iso.glb + props)
│   └── src/
│       ├── App.jsx                # state + REST bootstrap + socket wiring + control actions
│       ├── api.js · socket.js     # backend clients (reads + control PATCHes)
│       ├── components/            # shell, header, ControlBar, Three.js scene (OfficeScene3D +
│       │                          # Room3D + scene3d.config), DevicePanel cards, DeviceIcon
│       │                          # (SVG fan/light), ToggleSwitch, meter, tooltip, alerts
│       └── styles/app.css         # glassmorphism panels + scene overlays + control styles
├── bot/bot.js                     # all commands + proactive alert poller
├── diagrams/                      # system architecture + hardware schematic
├── docs/                          # setup, demo script, validation, API, testing
└── README.md
```

## Quick start

Prereq: Node.js ≥ 18. Three terminals (backend first). Full guide: [`docs/setup-guide.md`](docs/setup-guide.md)

```bash
# 1 — backend (source of truth)
cd backend && npm install && npm run dev        # http://localhost:5000

# 2 — dashboard
cd dashboard && npm install && npm run dev      # http://localhost:5173

# 3 — Discord bot (needs a token — see docs/setup-guide.md)
cd bot && npm install
copy .env.example .env                          # then fill DISCORD_TOKEN (+ ALERT_CHANNEL_ID)
npm run dev
```

`.env` files are optional for backend/dashboard (sane defaults); the bot requires
`DISCORD_TOKEN` and needs **MESSAGE CONTENT INTENT** enabled in the Discord Developer
Portal. All variables are documented in each `\.env.example` and in the setup guide.

## API

**Read (GET)**

| Endpoint | Returns |
|----------|---------|
| `/api/health` | `{ status, service, timestamp, uptimeSeconds }` |
| `/api/devices` | `{ count: 15, devices: [...] }` (each device has `controlMode`) |
| `/api/rooms` | `{ count: 3, rooms: [summaries incl. devices] }` |
| `/api/rooms/:roomName` | one room; aliases `drawing`/`work1`/`work room 2`…; 404 + valid list if unknown |
| `/api/usage` | total W, devices on, estimated kWh today, per-room breakdown |
| `/api/alerts` | active alerts with stable IDs |
| `/api/simulation` | `{ enabled, intervalMs, autoDevices, manualDevices, totalDevices }` |

**Control (PATCH)** — the manual-control surface. Each one re-derives rooms/usage/alerts
and rebroadcasts over Socket.IO, so every client updates immediately.

| Endpoint | Does |
|----------|------|
| `/api/devices/:id/toggle` | flip on↔off (sets `controlMode: manual`) |
| `/api/devices/:id/state` | set on/off explicitly (`{status}` or `{on}`; sets manual) |
| `/api/devices/:id/mode` | set `controlMode` `auto`/`manual` (no state change) |
| `/api/devices/reset-auto` | hand every device back to the simulator (all `auto`) |
| `/api/devices/all-off` | turn everything off + pin to `manual` |
| `/api/rooms/:roomName/all-off` | turn one room off + pin to `manual` |
| `/api/simulation` | `{enabled}` — enable/disable the simulator |

Examples with full payloads: [`docs/api-reference.md`](docs/api-reference.md)

**Socket.IO events** (full snapshot on connect, then after every simulator tick **and
every manual control change**):
`devices:update` · `rooms:update` · `usage:update` · `alerts:update` · `simulation:update`

## Bot commands

| Command | What it does |
|---------|--------------|
| `!status` | all-room summary + totals + simulation state |
| `!room <name>` | one room's 5 devices + power + 🔄 auto / 🔒 manual (aliases accepted) |
| `!usage` | total W, estimated kWh today, per-room ▰▰▱ bars |
| `!alerts` | active alerts, or a friendly all-clear |
| `!help` | command list |

Replies are generated from live API data at message time — nothing hardcoded. New
alerts are also posted proactively to `ALERT_CHANNEL_ID` (30 s poll, each alert once).

## The 3D dashboard, briefly

The scene is a real Three.js canvas (`react-three-fiber` + `drei`) under an orthographic
isometric camera with `OrbitControls` (drag to orbit). Each of the three rooms loads a
GLB model (`public/models/room-iso.glb`), auto-normalized to a common footprint so its
floor sits at `y=0` regardless of the source model's scale. The live devices — two ceiling
fans and three pendant lamps per room — are **built procedurally in code**, not baked into
the model: fans rotate via `useFrame` while ON, lamps switch on an emissive material plus a
real `pointLight`, and each device forwards react-three-fiber pointer events (with
`clientX/clientY`) to the shared screen-space tooltip. The room models are decorative; every
visual state (spin, glow, tooltip, watts) still comes straight from the backend device
objects, so the scene stays 100% data-driven. Models, per-room rotation and device layout
are swappable via [`src/components/scene3d.config.js`](dashboard/src/components/scene3d.config.js).

## Alert rules

Office hours **9 AM – 5 PM** (configurable via `OFFICE_START_HOUR` / `OFFICE_END_HOUR`).

1. **After-hours** (`warning`) — any device ON before 9 AM or at/after 5 PM.
2. **Long-running room** (`critical`) — all 5 devices of a room ON continuously > 2 h.

Alerts carry `id, type, room, deviceId?, message, timestamp, severity`. IDs encode the
ON-session start, so they're stable while the condition persists (that's the bot's
dedupe key) and timestamps don't drift between recalculations.

## Simulation & control

`simulator.js` toggles one random **auto** device every `SIMULATION_INTERVAL_MS` (5 s
default) **while the simulation is enabled**, updating `status`, `currentPower`,
`lastChanged`, `turnedOnAt`, then recalculates room summaries, usage and alerts and emits
the socket events. It only ever mutates the fixed 15-device store — no new rooms, no new
devices, no people, no wattage drift — and it **never touches a `manual` device**.

Manual control (dashboard buttons, scene clicks, or `PATCH` calls) sets a device to
`manual` so the simulator won't overwrite it; **Reset all to Auto** hands everything back.
The simulation itself can be paused/resumed live (`PATCH /api/simulation`, or start paused
with `SIMULATION_ENABLED=false`). Every control change goes through the backend and is
rebroadcast, so the dashboard and Discord bot always agree.

## Testing & demo

- Manual test plan (backend, API, simulator, dashboard, sockets, bot, alerts, invalid
  input): [`docs/testing-plan.md`](docs/testing-plan.md)
- To force alerts during a daytime demo: `OFFICE_START_HOUR=24` (after-hours) and
  `LONG_RUNNING_HOURS=0.01` (long-running) in `backend/.env`
- 3-minute demo script with timestamps: [`docs/demo-script.md`](docs/demo-script.md)
- Requirement-by-requirement checklist: [`docs/validation-checklist.md`](docs/validation-checklist.md)

## Hardware (concept only)

One representative room circuit — ESP32 + 5 switch inputs (`INPUT_PULLUP`) + 5 LED
indicators + optional ACS712 current sensor with a 3.3 V divider — with pin mapping,
Wokwi part names, illustrative firmware, and the safety story (relays, opto-isolation,
fuses; GPIOs never switch mains): [`diagrams/hardware-schematic.md`](diagrams/hardware-schematic.md)

## Known limitations

- In-memory store: state resets on backend restart (fine for a hackathon demo).
- `estimatedTodayKwh` extrapolates the *current* draw across hours elapsed today (the
  formula the PDF mandates) rather than integrating power over time.
- Alert rules are time-of-day based, so during office hours with a healthy office the
  alerts panel is legitimately empty (env knobs above make them demoable).
- The bot polls alerts every 30 s (per spec), so proactive posts can lag up to 30 s.

## Future improvements

- Persist device history (SQLite) → real kWh integration + daily/weekly charts
- Push the control path to hardware: a real ESP32 acting on `PATCH /api/devices/:id/*`
- Discord slash commands to *control* devices (read + control already share one backend)
- Cost estimation (kWh × tariff) and monthly budget alerts

---

*Hackathon preliminary-round submission. Simulated data only — no real electrical
equipment was harmed in the making of this dashboard.* ⚡
