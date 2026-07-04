# Smart Office Energy Monitor — System Architecture

High-level architecture for WattsUp. **No Mermaid** (per the problem statement). This file
gives you (1) an ASCII overview you can read in GitHub, (2) an exact block + arrow plan to
recreate the diagram in draw.io / Excalidraw / Figma / Canva / PowerPoint, (3) a README
explanation paragraph, and (4) a coverage checklist.

> The same diagram is also a **live, interactive feature inside the dashboard** — see the
> "System architecture" section at the bottom of the web app (hover a block to trace its
> flows, click for details; data pulses animate along the connectors).

## 1. ASCII overview (left → right)

```
   SOURCES (left)                 BACKEND — single source of truth (center)                CLIENTS (right)
 ┌──────────────────┐    ┌──────────────────────────────────────────────────────┐   ┌─────────────────────┐
 │  Office Rooms    │    │  BACKEND API SERVER   Node.js · Express · Socket.IO    │   │  React Web Dashboard│
 │  Drawing Room    │    │                                                        │   │  live 3D office,    │
 │  Work Room 1     │    │   ┌───────────────┐        ┌────────────────────────┐  │   │  status, power,     │
 │  Work Room 2     │    │   │ Simulator Svc │──tog──▶ │ In-memory Device State │  │   │  alerts, controls   │
 │  2 fans+3 lights │    │   └───────────────┘        │ Store (15 devices)     │  │   └─────────┬───────────┘
 └────────┬─────────┘    │   ┌───────────────┐        │ status·wattage·power   │  │      ▲     │  PATCH
          │ on/off       │   │ Manual Control│──PATCH▶ │ room·lastChanged·      │  │ live │     │  toggle/
          ▼              │   │ API           │        │ turnedOnAt·controlMode │  │ push │     ▼  state/mode
 ┌──────────────────┐    │   └───────────────┘        └───────────┬────────────┘  │   ┌─────────────────────┐
 │ Simulated Device │    │        derive ┌──────────────┬─────────┼───────────┐   │   │   Discord Bot       │
 │ Layer            │──▶ │               ▼              ▼         ▼           │   │   │   discord.js        │
 │ ON/OFF, power,   │upd │        ┌───────────┐  ┌───────────┐ ┌───────────┐  │   │   │  !status !room      │
 │ timestamps, 15   │    │        │  Usage    │  │  Alert    │ │  Room     │  │   │   │  !usage !alerts     │
 │ devices          │    │        │ Calculator│  │  Engine   │ │  Summary  │  │   │   │  !help  !simulation │
 └──────────────────┘    │        └─────┬─────┘  └────┬──────┘ └─────┬─────┘  │   │   └───┬───────────▲─────┘
                         │              └─────────────┴──────────────┘        │   │       │ REST      │ proactive
 ┌──────────────────┐    │        ┌───────────────┐        ┌──────────────┐   │   │       │ requests  │ alerts
 │ Hardware concept │    │        │  REST API     │        │  Socket.IO   │───┼───┼───────┘           │
 │ ESP32+switch+LED │    │        │  /api/...     │◀──────▶│ Broadcaster  │   │   │  REST responses   │
 │ (future, 1 room) │    │        └──────┬────────┘        └──────────────┘   │   └───────────────────┘
 └──────────────────┘    └───────────────┼──────────────────────────────────┘             │
                                         │  reads / controls                               ▼
                                         └──────────────────────────────────▶  ┌─────────────────────┐
                                                                                │    User / Boss      │
                                     opens dashboard · sends commands · gets ───│  watches · commands │
                                                        alerts                  └─────────────────────┘
```

Two required data paths, one backend:

- **Live path:** Simulated Device Layer → Backend API → Socket.IO → **Web Dashboard**
- **Bot path:** Simulated Device Layer → Backend API → REST → **Discord Bot** → User

Neither client stores or invents device state — both read the same backend, so they always
match.

## 2. Blocks to draw (12)

| # | Block (label) | Group / color | Key text (keep it short) |
|---|---------------|---------------|--------------------------|
| 1 | **Office Rooms** | Devices (teal) | Drawing Room · Work Room 1 · Work Room 2 — 2 fans + 3 lights each (15 total) |
| 2 | **Simulated Device Layer** | Devices (teal) | ON/OFF states · power draw · timestamps · 15 devices |
| 3 | **Backend API Server** (large container) | Backend core (accent) | Node.js + Express + Socket.IO — single source of truth |
| 4 | **In-memory Device State Store** | Backend core | status · wattage · currentPower · room · lastChanged · turnedOnAt · controlMode |
| 5 | **Usage Calculator** | Backend core (info) | total power · per-room power · estimated kWh |
| 6 | **Alert Engine** | Alerts (amber) | after-hours · long-running room · timestamped |
| 7 | **REST API** | Backend core | GET /api/devices · /rooms · /usage · /alerts · PATCH /api/devices/:id/toggle |
| 8 | **Socket.IO Broadcaster** | Backend core (info) | devices/rooms/usage/alerts/simulation:update |
| 9 | **React Web Dashboard** | Frontend (blue) | live 3D office · status panel · power meter · alerts · manual + simulation controls |
| 10 | **Discord Bot** | Bot (cyan) | discord.js — !status · !room · !usage · !alerts · !help (+!simulation, !turnoff) |
| 11 | **User / Boss** | User (slate) | opens dashboard · sends commands · controls devices · receives alerts |
| 12 | **Representative Hardware Circuit** (side note, dashed) | Future (gray) | ESP32 + switches + LEDs, one-room concept — real AC loads need relays / current sensors |

Also show, inside/around the backend container: **Simulator Service**, **Room Summary
Service**, and **Manual Control API** (all backend-core boxes).

## 3. Arrows / flows to draw (labeled)

| Flow | From → To | Arrow label |
|------|-----------|-------------|
| A. Device simulation | Office Rooms → Simulated Device Layer → Backend → Device State Store | updates device state |
| B. Backend internal | Device State Store → Usage Calculator, → Alert Engine, → Room Summary Service; Simulator Service → State Store | derive · toggle |
| C. Dashboard real-time | Socket.IO Broadcaster → React Web Dashboard | **Live updates, no manual refresh** |
| D. Dashboard control | React Web Dashboard → Manual Control API → Device State Store | PATCH toggle/state/mode |
| E. Discord commands | Discord Bot → REST API → State Store; REST API → Discord Bot → user | !status, !room, !usage, !alerts |
| F. Proactive alerts | Alert Engine → Discord Bot → Alert Channel | proactive alert messages |
| G. User interaction | User/Boss → Web Dashboard; User/Boss → Discord Bot | opens · commands |

## 4. Layout & styling (for draw.io / Figma / Canva)

**Left-to-right, three bands.** Neutral background, grouped boxes, labeled arrows.

- **Left column** — Office Rooms (top), Simulated Device Layer (middle), ESP32 hardware
  concept (bottom, dashed "future").
- **Center** — one large **Backend API Server** container (the biggest box). Inside it:
  Device State Store (prominent, top), then Simulator Service, Usage Calculator, Alert
  Engine, Room Summary Service, REST API, Socket.IO Broadcaster, Manual Control API.
- **Right column** — React Web Dashboard (top), Discord Bot (middle), User/Boss (bottom).

**Colors — one per layer** (professional, not neon):

| Layer | Suggested color |
|-------|-----------------|
| Devices / simulation | teal / green |
| Backend core | slate with a single accent for the container + store |
| Dashboard / frontend | blue |
| Discord bot | cyan (Discord-ish, avoid purple) |
| Alerts | amber / red |
| User & hardware | neutral gray (hardware dashed) |

Keep box text short (a label + 3–5 bullets), arrows labeled, no childish icons, no
purple/neon. Emphasize the two flows that leave the backend to the two clients — that is the
"one shared backend" story.

## 5. README explanation paragraph

> This architecture uses a single backend as the source of truth. The simulated device layer
> updates the backend device store. The backend calculates power usage and alerts, then sends
> live updates to the React dashboard through Socket.IO. The Discord bot also reads from the
> same backend through REST APIs, so bot responses and dashboard values always match. Manual
> controls from the dashboard update the backend first, and the backend broadcasts the updated
> state to all clients.

## 6. Coverage checklist

The diagram (and the in-dashboard interactive version) shows:

- [x] Devices (Office Rooms — 15 devices, 6 fans + 9 lights)
- [x] Simulated device layer
- [x] Backend API server
- [x] In-memory device state store
- [x] Usage calculator
- [x] Alert engine
- [x] REST API
- [x] Socket.IO real-time broadcaster
- [x] React web dashboard
- [x] Discord bot
- [x] User / boss
- [x] Shared backend / single source of truth (both clients read one backend)
- [x] Manual control path (Dashboard → Manual Control API → State Store)
- [x] Proactive alert path (Alert Engine → Discord Bot → alert channel)
- [x] Representative hardware concept (ESP32, one room) — where real sensing would connect
