# WattsUp — Office Lights & Fans Monitor

**Real-time web dashboard + Discord bot, powered by one shared backend.**

People in our small office forget to turn off lights and fans. WattsUp makes the
invisible visible: a live isometric dashboard shows every device in every room,
a Discord bot answers "what's on right now?" from anywhere, and an alert engine calls
out after-hours waste — all fed by a **single backend source of truth**, so both views
always agree.

---

## Device-count assumption (PDF contradiction)

> The PDF contains a device-count inconsistency. It states every room has **2 fans and
> 3 lights** (= 5 devices × 3 rooms = **15 devices**), but elsewhere says "6 devices
> per room, 18 devices total". Since the actual fixed device list is 2 fans and 3
> lights per room, **this implementation uses 15 devices total** (6 fans + 9 lights).
> No invented sixth device.

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
  subtitle, purpose (`waiting_area` / `workspace`), furniture `layoutStyle`,
  accent color, wall/floor palette, description, and where its five devices hang.
  `OfficeLayout` groups devices by room, loads the matching config and renders one
  generic `Room3D`/`RoomCard` per room. Rooms are **fully procedural — no 3D model
  files**; furniture is built from primitives in `RoomFurniture.jsx`.
  - *Drawing Room* renders as a **lounge**: sofa, coffee table, rug, plants and
    wall frames — softer and warmer than the work rooms.
  - *Work Room 1* renders as a **workspace**: desks with glowing monitors, chairs,
    a whiteboard and a plant.
  - *Work Room 2* is a **workspace with a different arrangement**: desks + chairs,
    a bookshelf, a notice board and a filing cabinet.
- **`backend/src/data/devices.js` (ROOMS)** — semantic identity per room (name,
  description, `type`, `expectedUsage`) plus the **simulation profile** used by the
  weighted simulator (below). Exposed via `/api/rooms`, so the Discord bot sees the
  same purposes.

## Features

- **Isometric 3D office** rendered with **Three.js** (react-three-fiber + drei): a
  fully procedural low-poly office (no model files) under an orthographic iso camera with
  drag-to-orbit and soft contact shadows — ceiling fans **spin** and pendant lights
  **glow** (real point lights), all driven by live backend state, so every visual stays
  100% data-driven
- **Manual + auto control**: every device has a `controlMode` (`auto`/`manual`). The
  simulator only touches **auto** devices; **manual** ones are the user's. Flip a device
  with its **physical rocker wall-switch** on the room card or by clicking the fan/light in
  the 3D scene, switch it between Auto/Manual, turn a whole room (or everything) off, reset
  all back to auto, or pause the simulation — all from the dashboard. Controls **write to
  the backend first**; the UI updates from the broadcast, never from local-only state
- **Office clock** — one global, controllable virtual time (backend `clockService`) that
  every timestamp, alert age and kWh estimate derives from, so cards never disagree. Change
  the **speed** (1× → 1800×), **jump** to a preset or custom time, or **reset** to real
  time: jump to 6 PM and after-hours alerts light up everywhere at once; run at 1800× to
  age a room past the 2-hour limit in seconds
- **Live panels**: total power meter, estimated kWh today, per-room bars, per-room
  device control cards (rocker switch + Auto/Manual, animated SVG fan/light icons), alerts
  feed — updated via Socket.IO with **no page refresh**
- **Hover tooltips** on every scene device: name, room, status, watts, mode, last changed
- **Discord bot**: `!status`, `!room <name>`, `!usage`, `!alerts`, `!simulation`,
  `!turnoff`, `!help` — plus **proactive alert posts** to a channel (30 s poll, deduped by
  stable alert IDs)
- **Alert engine**: after-hours devices (outside 9 AM–5 PM) and rooms fully ON for 2+ hours
- **Simulator**: nudges one random auto device every 5 s and rebroadcasts everything —
  works headless, never invents rooms/devices, never changes wattages, never touches a
  manual device
- **One source of truth**: dashboard and bot are pure readers of the same backend

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
│       │   ├── roomService.js     # room summaries/details
│       │   └── clockService.js    # the one virtual "office clock" all time derives from
│       ├── routes/                # health, devices, rooms, usage, alerts, simulation, clock
│       └── utils/roomAliases.js   # "work1" → "Work Room 1"
├── dashboard/
│   └── src/
│       ├── App.jsx                # state + REST bootstrap + socket wiring + control actions
│       ├── api.js · socket.js     # backend clients (reads + control PATCHes)
│       ├── officeClock.js         # frontend mirror of the backend office clock
│       ├── tooltipStore.js        # external store for the hover tooltip (isolates re-renders)
│       ├── components/            # shell, header, ControlBar, TimeControl, Three.js scene
│       │                          # (OfficeLayout + Room3D + RoomFurniture + roomConfigs),
│       │                          # RoomCard, DeviceControls (rocker switch), DeviceIcon,
│       │                          # PowerMeter, AlertsPanel, DeviceTooltip
│       └── styles/app.css         # contemporary dark theme, panels, scene overlays, controls
├── bot/
│   ├── bot.js                     # all commands + proactive alert poller
│   └── assets/                    # WattsUp bot avatar (SVG source + PNG)
├── diagrams/                      # system architecture + hardware schematic
├── .gitignore
└── README.md
```

Internal working notes (demo/video script, validation & submission checklists, manual
test plan) are kept **local, not committed** — this README plus `diagrams/` are the
shipped documentation.

## Quick start

Prereq: Node.js ≥ 18. Three terminals (backend first).

```bash
# 1 — backend (source of truth)
cd backend && npm install && npm run dev        # http://localhost:5000

# 2 — dashboard
cd dashboard && npm install && npm run dev      # http://localhost:5173

# 3 — Discord bot (needs a token — see "Discord bot" below)
cd bot && npm install
copy .env.example .env                          # then fill DISCORD_TOKEN (+ ALERT_CHANNEL_ID)
npm run dev
```

`.env` files are optional for backend/dashboard (sane defaults); the bot requires
`DISCORD_TOKEN` and needs **MESSAGE CONTENT INTENT** enabled in the Discord Developer
Portal. All variables are documented in each `.env.example` and in the **Discord bot**
section below.

> **Secrets — never commit these.** Real `.env` files (Discord bot token, channel ID,
> any keys) are git-ignored (`.gitignore` → `.env`); only the placeholder
> `*.env.example` files are tracked. Never paste a real token into the repo, a commit,
> an issue or a screenshot. If a token is ever exposed, rotate it immediately: Discord
> Developer Portal → your app → **Bot → Reset Token**, then update your local `bot/.env`.

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
| `/api/clock` | `{ officeTime, speed, isRealTime, realTime }` — the virtual office clock |

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
| `/api/clock` | `{time?, speed?, reset?}` — set the office time/speed, or reset to real time |

**Socket.IO events** (full snapshot on connect, then after every simulator tick, manual
control change **and clock change**):
`devices:update` · `rooms:update` · `usage:update` · `alerts:update` · `simulation:update` · `clock:update`

## Discord bot

The bot is the boss's quick-access remote: it reads (and controls) **the exact same
backend as the dashboard**, fetching fresh data the moment a command arrives — nothing
is hardcoded, cached or generated inside the bot, so both interfaces always reflect the
same reality. Replies are rich embeds with **interactive buttons** (jump between rooms,
refresh, pause the simulation, turn a room off), and every timestamp/age is measured on
the **office clock**, so Discord matches the dashboard even at 600× demo speed.

| Command | What it does |
|---------|--------------|
| `!status` | all rooms at a glance ("Work Room 1 — all off 😴"), totals, simulation state + room buttons |
| `!room <name>` | Fan 1/2 + Light 1/2/3 states, auto/manual, room power — `drawing`, `work1`, `work room 2`… all work |
| `!usage` | total W, estimated kWh today, per-room bar breakdown |
| `!alerts` | active alerts with severity + age, or a friendly all-clear |
| `!simulation [on\|off]` | view or switch the simulated device layer |
| `!turnoff all` / `!turnoff room <name>` | switch everything (or one room) off — pinned to manual |
| `!help` | command list |

Example `!status` reply (values are always live — never these literals):

> 🏢 **Office right now**
> 🛋️ **Drawing Room** — 1 fan and 2 lights ON · 105 W
> 💼 **Work Room 1** — all off 😴
> 🖥️ **Work Room 2** — 2 fans and 3 lights ON · 165 W
>
> **Total power: 270 W** · 8/15 devices on · est. **2.14 kWh** today
> _Looks like Work Room 2 is the main power user right now._

**Proactive alerts (bonus):** the bot polls `GET /api/alerts` every 30 s, keeps a `Set`
of already-posted alert IDs, and posts **only new alerts** to `ALERT_CHANNEL_ID` — one
combined embed even when several fire at once (e.g. after jumping the office clock to
6 PM), so it never spams. If `ALERT_CHANNEL_ID` is missing, the poller stays off and
commands keep working. Invalid room names, missing arguments, a stopped backend and
malformed responses all get friendly replies instead of crashes.

### Bot setup (≈5 minutes)

1. **Create the app** — <https://discord.com/developers/applications> → *New
   Application* → name it (e.g. `WattsUp`).
2. **Get the token** — *Bot* page → *Reset Token* → copy it.
3. **Enable the intent** — same *Bot* page → toggle **MESSAGE CONTENT INTENT** ON
   (without it the bot cannot read `!commands` — the #1 setup mistake).
4. **Invite it** — *OAuth2 → URL Generator*: scope `bot`; permissions *View Channels*,
   *Send Messages*, *Read Message History* → open the generated URL, pick your server.
5. **Channel ID for alerts** — Discord → *Settings → Advanced → Developer Mode ON*,
   then right-click your alerts channel → *Copy Channel ID*.
6. **Configure & run:**

   ```bash
   cd bot && npm install
   copy .env.example .env       # macOS/Linux: cp .env.example .env
   # edit .env → DISCORD_TOKEN=…  BACKEND_URL=http://localhost:5000  ALERT_CHANNEL_ID=…
   npm run dev
   ```

   Expected console: `🤖 WattsUp bot logged in as …` and `Backend reachable ✔`. Type
   `!status` in any channel the bot can see.

Env vars: `DISCORD_TOKEN` (required) · `BACKEND_URL` (default `http://localhost:5000`) ·
`ALERT_CHANNEL_ID` (optional — proactive alerts). The PDF also encourages LLM-generated
replies; the bot ships with template-based humanized responses instead so judges can run
it without any API key — an LLM could be slotted into the view builders in `bot/bot.js`.

## The 3D dashboard, briefly

The scene is a real Three.js canvas (`react-three-fiber` + `drei`) under an orthographic
isometric camera. `<Bounds fit clip observe>` auto-fits the whole office into view on load
and on every resize (so nothing clips at any width); `OrbitControls` lets you drag to orbit.

Each room is **fully procedural — no 3D model files.** `roomConfigs.js` describes every
room (palette, grid position, furniture style, per-device ceiling layout); `Room3D` renders
a low-poly shell (floor slab, two colored walls, white trim, a door, a night window) and
`RoomFurniture` adds a small office kit (desks with glowing monitors, chairs, whiteboard,
bookshelf, filing cabinet — or a lounge sofa/rug/plants). The three rooms tile in a
honeycomb with the back room **raised one wall-height on a plinth**, so its interior stays
visible above the two front rooms.

The live devices — two ceiling fans and three pendant lamps per room — are drawn in code
too: fans spin via `useFrame` while ON, lamps switch on an emissive material plus a real
`pointLight`. Hovering a device shows the shared screen-space tooltip; a genuine click
(distinguished from an orbit drag) toggles it via the backend. Hover state lives in
`tooltipStore.js` so pointer motion re-renders only the tooltip, never the dashboard. Every
visual state (spin, glow, tooltip, watts) still comes straight from the backend device
objects, so the scene stays 100% data-driven — restyle any room in
[`src/components/roomConfigs.js`](dashboard/src/components/roomConfigs.js).

## Alert rules

Office hours **9 AM – 5 PM** (configurable via `OFFICE_START_HOUR` / `OFFICE_END_HOUR`).

1. **After-hours** (`warning`) — any device ON before 9 AM or at/after 5 PM.
2. **Long-running room** (`critical`) — all 5 devices of a room ON continuously > 2 h.

Both rules run on the **office clock**, not the wall clock — so the simplest way to demo
them is the dashboard's time controls: jump to 6 PM for after-hours, or run at 1800× to
push a room past the 2-hour limit in seconds (the `OFFICE_START_HOUR` / `LONG_RUNNING_HOURS`
env vars still work too).

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

- **Smoke test the backend:** `curl http://localhost:5000/api/health`, then `/api/devices`,
  `/api/rooms/work1`, `/api/usage`, `/api/alerts` — every value the dashboard and bot show
  comes from these.
- **Live check:** toggle a device on the dashboard and confirm the bot's `!status` reflects
  it (shared backend); watch the office update with no page refresh.
- **Force alerts on demand:** use the dashboard time controls — jump to 6 PM (after-hours)
  or run at 1800× to age a room past 2 h. The env vars `OFFICE_START_HOUR=24` and
  `LONG_RUNNING_HOURS=0.01` in `backend/.env` still work too.
- A 3-minute demo walkthrough and detailed test/validation notes are kept in the team's
  local working docs (not committed).

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
- Discord slash (/) command registration — the prefix commands + buttons already read *and* control devices
- Optional LLM-generated conversational bot replies (PDF-encouraged; template-based today so no API key is needed)
- Cost estimation (kWh × tariff) and monthly budget alerts

---

*Hackathon preliminary-round submission. Simulated data only — no real electrical
equipment was harmed in the making of this dashboard.*
