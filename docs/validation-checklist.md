# Validation Checklist — every PDF requirement mapped to the implementation

> **Device-count note:** The PDF contains a device-count inconsistency (it lists
> 2 fans + 3 lights per room, yet elsewhere says "6 devices per room / 18 devices
> total"). Since the actual fixed device list is 2 fans and 3 lights per room, **this
> implementation uses 15 devices total** (6 fans + 9 lights).

## Core deliverables

- [x] **High-level system diagram** — `diagrams/system-architecture.md` (ASCII + draw.io/Excalidraw recreation guide; **no Mermaid**)
- [x] **Hardware schematic (Wokwi/Tinkercad style)** — `diagrams/hardware-schematic.md` (one-room ESP32 circuit, pin table, safety notes)
- [x] **Simulated device data** — `backend/src/data/devices.js` + `services/simulator.js`
- [x] **Real-time web dashboard** — `dashboard/` (Socket.IO, no manual refresh)
- [x] **Discord bot** — `bot/bot.js`
- [x] **Shared backend source of truth** — `backend/` owns all state; both clients only read it
- [x] **Public codebase with README** — root `README.md`
- [x] **Diagrams in repository** — `diagrams/`
- [x] **Code structure & documentation** — layered backend (data/services/routes/utils), component-per-file dashboard, `docs/`

## Data model

- [x] 3 fixed rooms: Drawing Room (waiting area), Work Room 1, Work Room 2 (work areas)
- [x] Per room: Fan 1, Fan 2, Light 1, Light 2, Light 3 → 15 devices, never more/less
- [x] Device fields: `id, name, type, room, status, wattage, currentPower, lastChanged, turnedOnAt`
- [x] Fan 60 W ON, Light 15 W ON, 0 W OFF; `currentPower` always consistent with `status`
- [x] `turnedOnAt` set only while ON (`null` when OFF); ISO timestamps throughout
- [x] Initial state is realistically mixed (8 of 15 ON), not all-ON
- [x] No people data, no names/emails/phones — devices only

## Backend

- [x] `GET /api/health` · `/api/devices` · `/api/rooms` · `/api/rooms/:roomName` · `/api/usage` · `/api/alerts`
- [x] Room aliases: drawing / drawing-room / drawing room / work1 / work-room-1 / work room 1 / work2 / work-room-2 / work room 2 (+ case-insensitive, `_` tolerated); invalid → 404 + valid list
- [x] Usage: total W, per-room W, devices ON, estimated kWh today (`totalPower × hoursSoFar ÷ 1000`, 2 dp)
- [x] Alert 1: device ON before 9 AM or ≥ 5 PM → after-hours `warning`
- [x] Alert 2: all 5 room devices ON > 2 h → long-running `critical`
- [x] Alert fields: `id, type, room, deviceId (optional), message, timestamp, severity`; stable IDs; no duplicates per cycle
- [x] Simulator: toggles 1 random device / 5 s; updates status, currentPower, lastChanged, turnedOnAt; recalculates rooms/usage/alerts; emits all 4 socket events; never creates rooms/devices, never touches wattage; runs with zero clients
- [x] Socket.IO: `devices:update`, `rooms:update`, `usage:update`, `alerts:update` + full snapshot on connect

## Dashboard

- [x] Live updates via Socket.IO — zero manual refresh
- [x] Live device status panel (all 15, grouped by room, timestamps)
- [x] Live total power meter + estimated kWh
- [x] Per-room power breakdown bars
- [x] Active alerts panel with severity styles + friendly empty state
- [x] Visual office layout: lights glow, fans spin — rendered with Three.js (react-three-fiber + drei) loading real GLB room models, no Mermaid
- [x] Cozy isometric scene: 3 rooms in a row (GLB models under an orthographic iso camera, drag-to-orbit), warm lighting, dark burgundy background, soft contact shadows
- [x] Glassmorphism floating panels, smooth animations, responsive layout
- [x] Drawing Room: furnished GLB room model + 2 fans + 3 lights (fans/lights data-driven; per-room model swappable in `scene3d.config.js`)
- [x] Work Rooms: furnished GLB room model + 2 fans + 3 lights each (fans/lights data-driven; per-room model swappable in `scene3d.config.js`)
- [x] Hover tooltip on every device: name, room, status, current power, last changed
- [x] Connection status indicator; graceful offline banner + auto-reconnect

## Discord bot

- [x] `!status` — all-room summary (from `/api/rooms` + `/api/usage`)
- [x] `!room <name>` — per-room detail incl. Fan 1/2 + Light 1/2/3 states and room power; alias support; helpful invalid-room reply
- [x] `!usage` — total W, estimated kWh, per-room ▰▱ breakdown
- [x] `!alerts` — active alerts or friendly all-clear
- [x] `!help` — command list
- [x] Friendly, humanized, short replies; zero hardcoded/random data — everything fetched live
- [x] Proactive alerts: polls `/api/alerts` every 30 s, posted-ID `Set`, posts only new alerts, no spam
- [x] Edge cases: backend offline, invalid room, missing `!room` arg, empty alerts, API error, missing token (friendly exit), missing/wrong channel ID (single warning)

## Explicitly excluded (per problem statement / instructions)

- [x] No Mermaid anywhere
- [x] No 6th device per room / no 18-device interpretation (documented assumption above)
- [x] No fake people data of any kind
- [x] No real hardware; hardware design is documentation-only
