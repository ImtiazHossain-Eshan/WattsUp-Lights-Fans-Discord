# API Reference

Base URL: `http://localhost:5000` (configurable via `PORT`). All endpoints are `GET`
and return JSON. There are intentionally **no write endpoints** — only the simulator
mutates state, which is what keeps the backend the single source of truth.

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
      "wattage": 60,
      "currentPower": 60,
      "lastChanged": "2026-07-03T14:51:58.480Z",
      "turnedOnAt": "2026-07-03T14:51:58.480Z"
    }
  ]
}
```

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

## Socket.IO events (server → client)

Connect to the base URL with socket.io-client. On connection the server immediately
emits a full snapshot; afterwards all four events are re-emitted after every simulator
tick (~5 s).

| Event | Payload |
|-------|---------|
| `devices:update` | array of 15 device objects |
| `rooms:update` | array of 3 room summaries |
| `usage:update` | usage summary object |
| `alerts:update` | array of active alerts |
