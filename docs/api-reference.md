# API Reference

Base URL: `http://localhost:5000` (configurable via `PORT`). All endpoints return JSON.
`GET` endpoints read the live state; `PATCH` endpoints are the **manual control**
surface (toggle a device, set its mode, control the simulation…). The backend is the
**single source of truth**: it is the only thing that mutates the device store — the
dashboard and Discord bot never do — and every `PATCH` re-derives rooms/usage/alerts and
rebroadcasts them over Socket.IO, so all clients stay in sync.

Each device now carries a **`controlMode`** of `"auto"` or `"manual"`:

- `auto` — the simulator may toggle it (when the simulation is enabled).
- `manual` — only a user can change it; the simulator leaves it alone.

Any manual on/off change automatically sets that device to `manual`.

## GET /api/health

```json
{
  "status": "ok",
  "service": "office-power-backend",
  "timestamp": "2026-07-03T14:52:03.121Z",
  "uptimeSeconds": 42
}
```

## GET /api/devices

All 15 devices. `turnedOnAt` is `null` while a device is OFF; `currentPower` is always
consistent with `status` (fan 60 W / light 15 W when ON, 0 W when OFF).

```json
{
  "count": 15,
  "devices": [
    {
      "id": "drawing-room-fan-1",
      "name": "Fan 1",
      "type": "fan",
      "room": "Drawing Room",
      "status": "on",
      "controlMode": "auto",
      "wattage": 60,
      "currentPower": 60,
      "lastChanged": "2026-07-03T14:51:58.480Z",
      "turnedOnAt": "2026-07-03T14:51:58.480Z"
    }
  ]
}
```

## PATCH /api/devices/:id/toggle

Flip a device on↔off (manual control). Sets `controlMode: "manual"` and updates
`status`, `currentPower`, `lastChanged`, `turnedOnAt`. Returns `{ ok, device }`.
Unknown id → **404** `{ "error": "unknown-device", … }`.

## PATCH /api/devices/:id/state

Set an explicit state. Body: `{"status":"on"|"off"}` **or** `{"on":true|false}`.
Also pins the device to `manual`. Returns `{ ok, device }`. Missing/invalid body →
**400**; unknown id → **404**.

## PATCH /api/devices/:id/mode

Switch a single device's control mode **without** changing its on/off state.
Body: `{"mode":"auto"|"manual"}`. Returns `{ ok, device }`. Invalid mode → **400**.

## PATCH /api/devices/reset-auto

Hand **every** device back to the simulator (`controlMode: "auto"`), leaving on/off
state untouched. Returns `{ ok, count, devices }`.

## PATCH /api/devices/all-off

Turn **every** device off and pin them to `manual` (so they stay off even while the
simulation runs — "Reset all to Auto" hands them back afterwards). Returns
`{ ok, count, devices }`.

## GET /api/rooms

Summaries for the three fixed rooms (each includes its full `devices` array).

```json
{
  "count": 3,
  "rooms": [
    {
      "room": "Drawing Room",
      "description": "Waiting area",
      "fansOn": 1,
      "lightsOn": 2,
      "devicesOn": 3,
      "totalDevices": 5,
      "totalPower": 90,
      "devices": ["… 5 device objects …"]
    }
  ]
}
```

## GET /api/rooms/:roomName

Same shape as one entry of `/api/rooms`. `:roomName` accepts aliases —
`drawing`, `drawing-room`, `drawing room`, `work1`, `work-room-1`, `work room 1`,
`work2`, `work-room-2`, `work room 2` (case-insensitive; `-`/`_`/spaces
interchangeable; full names like `Work Room 2` also work).

Unknown room → **404**:

```json
{
  "error": "unknown-room",
  "message": "No room matches \"kitchen\".",
  "validRooms": ["Drawing Room", "Work Room 1", "Work Room 2"],
  "hint": "Try \"drawing\", \"work1\" or \"work2\"."
}
```

## PATCH /api/rooms/:roomName/all-off

Turn one room's devices off and pin them to `manual`. `:roomName` accepts the same
aliases as the GET route. Returns `{ ok, room, count, devices }`; unknown room → **404**.

## GET /api/usage

```json
{
  "totalPowerWatts": 255,
  "devicesOn": 8,
  "totalDevices": 15,
  "estimatedTodayKwh": 3.79,
  "hoursElapsedToday": 14.87,
  "perRoom": [
    { "room": "Drawing Room", "powerWatts": 90, "devicesOn": 3 },
    { "room": "Work Room 1", "powerWatts": 150, "devicesOn": 4 },
    { "room": "Work Room 2", "powerWatts": 15, "devicesOn": 1 }
  ],
  "updatedAt": "2026-07-03T14:52:03.121Z"
}
```

`estimatedTodayKwh = totalPowerWatts × hoursElapsedToday ÷ 1000`, rounded to 2 dp
(simple extrapolation mandated by the problem statement).

## GET /api/alerts

Currently **active** alerts. `deviceId` is present on after-hours alerts only. IDs are
stable while a condition persists (they encode the ON-session start), which is how the
bot dedupes proactive posts; timestamps are pinned to first detection.

```json
{
  "count": 1,
  "alerts": [
    {
      "id": "after-hours-drawing-room-light-2-1751554318480",
      "type": "after-hours",
      "room": "Drawing Room",
      "deviceId": "drawing-room-light-2",
      "message": "Light 2 in Drawing Room is ON outside office hours (9 AM–5 PM).",
      "severity": "warning",
      "timestamp": "2026-07-03T17:01:12.004Z"
    }
  ]
}
```

Alert types: `after-hours` (severity `warning`) · `long-running-room` (severity
`critical`, fires when all 5 devices of a room have been ON for more than 2 h).

## GET /api/simulation

Whether the simulated device layer is running, plus live auto/manual counts.

```json
{
  "enabled": true,
  "intervalMs": 5000,
  "autoDevices": 12,
  "manualDevices": 3,
  "totalDevices": 15
}
```

## PATCH /api/simulation

Enable or disable the simulator. Body: `{"enabled":true|false}`. Returns the same
shape as the GET. While disabled, devices only change through manual control; while
enabled, one random **auto** device is toggled every `intervalMs`. Invalid body → **400**.

## GET /api/clock

The virtual **office clock** every timestamp, alert and kWh estimate is derived from.

```json
{
  "officeTime": "2026-07-04T18:00:00.000Z",
  "speed": 60,
  "isRealTime": false,
  "realTime": "2026-07-04T09:14:22.001Z"
}
```

`officeNow = anchorVirtual + (realNow − anchorReal) × speed`. `isRealTime` is true when
speed is 1× and the office time is within ~2 s of real time.

## PATCH /api/clock

Change the office clock. Body accepts any of:

- `{"time":"18:00"}` — set the time of day (`HH:mm` or `HH:mm:ss`; keeps the current date)
  or any full date string `Date.parse` accepts.
- `{"speed":60}` — run virtual time faster (0–3600×; `0` freezes it).
- `{"reset":true}` — snap back to real time at 1×.

Returns the same shape as the GET. Because a time change can flip after-hours /
long-running conditions, the backend rebroadcasts **everything**. Empty/invalid body → **400**.

## Socket.IO events (server → client)

Connect to the base URL with socket.io-client. On connection the server immediately
emits a full snapshot; afterwards all events are re-emitted after every simulator tick
(~5 s) **and after every manual control or clock change** (`PATCH`), so the dashboard
reflects actions instantly.

| Event | Payload |
|-------|---------|
| `devices:update` | array of 15 device objects (incl. `controlMode`) |
| `rooms:update` | array of 3 room summaries |
| `usage:update` | usage summary object |
| `alerts:update` | array of active alerts |
| `simulation:update` | simulation state (`enabled`, `intervalMs`, auto/manual counts) |
| `clock:update` | office clock (`officeTime`, `speed`, `isRealTime`, `realTime`) |
