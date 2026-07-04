# Manual Testing Plan

Everything is verifiable from a terminal + browser + Discord. `curl` commands work in
PowerShell (`curl.exe`) and bash.

## 1. Backend tests

| # | Step | Expected |
|---|------|----------|
| B1 | `npm run dev` in /backend | banner + `[simulator] running` log, no crash |
| B2 | `curl http://localhost:5000/api/health` | `"status":"ok"` |
| B3 | `curl http://localhost:5000/` | endpoint index JSON |
| B4 | `curl http://localhost:5000/api/nope` | JSON 404, not an HTML error page |

## 2. API tests

| # | Step | Expected |
|---|------|----------|
| A1 | `/api/devices` | `count: 15`; per room exactly 2 fans + 3 lights |
| A2 | `/api/devices` | every ON device: `currentPower === wattage` (60/15) and `turnedOnAt` set; every OFF device: 0 W and `turnedOnAt: null` |
| A3 | `/api/rooms` | 3 rooms, each `totalDevices: 5`; `totalPower` = sum of its devices |
| A4 | `/api/rooms/drawing`, `/rooms/drawing-room`, `/rooms/drawing%20room` | all return Drawing Room |
| A5 | `/api/rooms/work1`, `/rooms/work-room-1`, `/rooms/WORK%20ROOM%202` | correct rooms (aliases + case-insensitive) |
| A6 | `/api/rooms/kitchen` | 404 with `validRooms` list |
| A7 | `/api/usage` | `totalPowerWatts` = sum over `perRoom`; kWh has 2 dp |
| A8 | `/api/alerts` | during office hours with mixed devices: `[]`; see §7 to force alerts |

## 3. Simulator tests

| # | Step | Expected |
|---|------|----------|
| S1 | Watch backend console 20 s | ~4 toggle logs, different devices, only the 15 known ones |
| S2 | `/api/devices` twice, 6 s apart | exactly the toggled device(s) changed; `lastChanged` updated only for them |
| S3 | Let it run 10 min | still 15 devices, 3 rooms, wattages still 60/15 (never mutated) |
| S4 | Run backend with **no** dashboard/bot connected | simulator keeps logging (works headless) |

## 4. Dashboard tests

| # | Step | Expected |
|---|------|----------|
| D1 | Open :5173 with backend up | scene renders, **Live** badge green, header stats populated |
| D2 | Wait ~5 s without refreshing | a device flips: light glow appears/disappears or a fan starts/stops spinning; device panel row + power meter update |
| D3 | Hover a fan and a lamp in the scene | tooltip: name, room, status, current power, last changed |
| D4 | Compare header total W with `/api/usage` | equal |
| D5 | Kill the backend | banner + **Offline** badge; restart backend → auto-reconnects and refreshes without a manual reload |
| D6 | Narrow the window to phone width | layout stacks, scene scales down, still usable |

## 5. Socket tests

| # | Step | Expected |
|---|------|----------|
| K1 | Browser devtools → Network → WS | one socket.io connection, frames every ~5 s |
| K2 | Frames contain | `devices:update`, `rooms:update`, `usage:update`, `alerts:update` |
| K3 | On (re)connect | immediate full snapshot (dashboard renders instantly) |

## 6. Bot tests

| # | Step | Expected |
|---|------|----------|
| T1 | `npm start` without .env | friendly "Missing DISCORD_TOKEN" message, exit code 1 (no stack trace) |
| T2 | `!status` | 3 rooms + totals matching the dashboard at that moment |
| T3 | `!room drawing`, `!room work-room-1`, `!room WORK ROOM 2` | correct rooms via aliases |
| T4 | `!room kitchen` | friendly unknown-room reply listing valid rooms |
| T5 | `!room` (no argument) | usage hint, no crash |
| T6 | `!usage` | totals + per-room ▰▱ bars, matches `/api/usage` |
| T7 | `!alerts` with none active | friendly all-clear message |
| T8 | Stop the backend, run `!status` | "couldn't reach the office backend" reply, bot stays alive |
| T9 | Unknown command `!foo` | bot stays silent (doesn't spam) |

## 7. Alert tests (force alerts on demand)

The rules run on the **office clock**, so the quickest path is the clock controls (dashboard
time bar, or `PATCH /api/clock`) — no restart required:

1. **After-hours:** jump the clock to `18:00` (`PATCH /api/clock {"time":"18:00"}`) → every
   ON device yields a `warning` alert. Check `/api/alerts`, the dashboard alerts panel,
   `!alerts`, and (within 30 s) the proactive post in the Discord alert channel.
2. **Long-running room:** turn a room's 5 devices ON, then set speed to `1800×`
   (`PATCH /api/clock {"speed":1800}`) → within seconds the room passes the 2-hour limit and
   a `critical` alert appears. Reset with `{"reset":true}`.
3. **No duplicates:** leave the bot running through several polls → each alert is
   posted to the channel exactly once (stable IDs + posted-ID set).

The env knobs still work as a static alternative: `OFFICE_START_HOUR=24` (all-after-hours)
and `LONG_RUNNING_HOURS=0.01` (~36 s) in `backend/.env`, then restart.
4. Restore defaults afterwards.

## 8. Invalid input & resilience

| # | Step | Expected |
|---|------|----------|
| I1 | `/api/rooms/%20%20` | 404 unknown-room |
| I2 | Dashboard started before backend | error banner, then auto-recovers when backend starts |
| I3 | Bot started before backend | login succeeds; commands answer "can't reach backend" until it's up; alert poll logs one quiet warning, keeps retrying |
| I4 | Wrong `ALERT_CHANNEL_ID` | one console warning, commands unaffected |
