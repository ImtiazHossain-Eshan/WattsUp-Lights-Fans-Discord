# System Architecture Diagram

High-level architecture of WattsUp. **No Mermaid is used** (per the problem statement) —
below is (1) an ASCII rendering you can read directly in GitHub, and (2) an exact
box/arrow inventory so the same diagram can be recreated in draw.io, Excalidraw, Figma
or Canva in a few minutes.

## 1. ASCII diagram

```
+---------------------+        +------------------------------+
|  OFFICE LIGHTS &    |        |   SIMULATED DEVICE LAYER     |
|  FANS               | ~~~~~> |   backend/src/services/      |
|  (physical devices, |  rep-  |   simulator.js               |
|  simulated only —   | resen- |   toggles 1 random device    |
|  no real hardware)  |  ted   |   every 5 seconds            |
+---------------------+   by   +---------------+--------------+
                                               | mutates state
                                               v
             +---------------------------------------------------------+
             |            BACKEND API SERVER  (source of truth)        |
             |            Node.js + Express — http://localhost:5000    |
             |                                                         |
             |  +---------------------------------------------------+  |
             |  |  DEVICE STATE STORE (in-memory, 15 devices:       |  |
             |  |  3 rooms x [2 fans @60W + 3 lights @15W])         |  |
             |  +------------+------------------+-------------------+  |
             |               |                  |                      |
             |  +------------v-----+  +---------v--------+             |
             |  | USAGE CALCULATOR |  |   ALERT ENGINE   |             |
             |  | totals, per-room |  | after-hours +    |             |
             |  | W, est. kWh      |  | long-running     |             |
             |  +------------+-----+  +---------+--------+             |
             |               |                  |                      |
             |  +------------v------------------v-------------------+  |
             |  |   REST API              |  SOCKET.IO BROADCASTER  |  |
             |  |   GET /api/health       |  devices:update         |  |
             |  |   GET /api/devices      |  rooms:update           |  |
             |  |   GET /api/rooms        |  usage:update           |  |
             |  |   GET /api/rooms/:name  |  alerts:update          |  |
             |  |   GET /api/usage        |                         |  |
             |  |   GET /api/alerts       |                         |  |
             |  +------------+------------+------------+------------+  |
             +---------------|-------------------------|--------------+
                             | REST (axios,            | Socket.IO push
                             | poll + on-demand)       | (live, no refresh)
                             v                         v
                  +-------------------+      +----------------------+
                  |   DISCORD BOT     |      |   REACT DASHBOARD    |
                  |   bot/bot.js      |      |   Vite + React       |
                  |   discord.js      |      |   localhost:5173     |
                  |   !status !room   |      |   cozy isometric 3D  |
                  |   !usage !alerts  |      |   office, glowing    |
                  |   + proactive     |      |   lights, spinning   |
                  |   alert posts     |      |   fans, live panels  |
                  +---------+---------+      +----------+-----------+
                            |                           |
                            v                           v
                  +-------------------+      +----------------------+
                  |  DISCORD CHANNEL  |      |      BROWSER         |
                  +---------+---------+      +----------+-----------+
                            |                           |
                            +------------+--------------+
                                         v
                                 +---------------+
                                 |  USER / BOSS  |
                                 +---------------+
```

## 2. Data flows (the two paths the PDF requires)

1. **Live dashboard path:**
   `Device state → simulated data (simulator.js) → backend store → Socket.IO broadcaster → React dashboard (live, no refresh)`
2. **Discord path:**
   `Device state → simulated data (simulator.js) → backend store → REST API → Discord bot → Discord message → User/Boss`

Neither client ever generates device state — both read the same backend, which is why
they always agree.

## 3. Recreate it in draw.io / Excalidraw / Figma / Canva

**Boxes (12):**

| # | Box label | Suggested color |
|---|-----------|-----------------|
| 1 | Office lights & fans (simulated) | gray |
| 2 | Simulated Device Layer — simulator.js, toggles 1 device / 5 s | orange |
| 3 | Backend API Server — Node.js + Express :5000 (large container) | blue outline |
| 4 | Device State Store — 15 devices, in-memory (inside 3) | blue |
| 5 | Usage Calculator (inside 3) | blue |
| 6 | Alert Engine (inside 3) | blue |
| 7 | REST API — 6 GET endpoints (inside 3) | teal |
| 8 | Socket.IO Broadcaster — 4 events (inside 3) | teal |
| 9 | React Dashboard — Vite :5173, isometric 3D office | purple |
| 10 | Discord Bot — discord.js, 5 commands + proactive alerts | purple |
| 11 | Discord Channel | gray |
| 12 | User / Boss | green |

**Arrows (11):**

| From → To | Label |
|-----------|-------|
| 1 → 2 | represented by |
| 2 → 4 | mutates device state every 5 s |
| 4 → 5 | reads devices |
| 4 → 6 | reads devices |
| 5 → 7 and 5 → 8 | usage summary |
| 6 → 7 and 6 → 8 | active alerts |
| 8 → 9 | Socket.IO push: devices/rooms/usage/alerts:update |
| 7 → 10 | REST: /rooms /usage /alerts (axios, 30 s alert poll) |
| 10 → 11 | command replies + proactive alert posts |
| 9 → 12 and 11 → 12 | user watches dashboard / reads Discord |

Layout hint: place 1→2 top-left, the big backend container center, dashboard bottom-right,
bot bottom-left, user centered at the bottom. Keep the four inner boxes (store, usage,
alerts, REST/Socket row) inside the backend container to emphasize "one source of truth".
