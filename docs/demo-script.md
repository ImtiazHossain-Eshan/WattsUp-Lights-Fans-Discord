# 3-Minute Demo Script

**Before recording:** backend + dashboard + bot all running; Discord open in a second
window; for guaranteed alerts start the backend with demo knobs:
`OFFICE_START_HOUR=24` and `LONG_RUNNING_HOURS=0.01` in `backend/.env` (see
docs/testing-plan.md). Practice once — 3 minutes is short.

---

### 0:00 – 0:20 — The problem
> "In our small office, people constantly forget lights and fans. Nobody knows what's
> ON right now or what it costs. WattsUp fixes that: one live dashboard, one Discord
> bot, and — the key part — **one shared backend**, so both always show the same truth."

*Screen: dashboard already open, devices visibly flipping.*

### 0:20 – 0:50 — Architecture
> "A simulated device layer stands in for real switches — it toggles one of our 15
> devices every 5 seconds. The Node/Express backend owns all state: it recalculates
> power, per-room usage, estimated kWh and alerts, then pushes updates over Socket.IO
> to the dashboard, while the Discord bot reads the same REST API. Neither client ever
> invents data."

*Screen: diagrams/system-architecture.md, trace the two arrows with the cursor.*

### 0:50 – 1:40 — Dashboard (the star)
> "Here's the office as a cutaway isometric scene — Drawing Room, Work Room 1 and 2,
> each with 2 fans and 3 lights. Lamps glow and cast light pools when ON; fans spin.
> Watch — a device just flipped, no refresh needed."

- Hover a fan → tooltip: name, room, status, watts, last changed.
- Point at the header: total watts, estimated kWh today, devices ON, Live badge.
- Point right: power meter with per-room bars; alerts panel.
- Scroll: all 15 devices grouped by room, timestamps ticking.

### 1:40 – 2:20 — Discord bot
> "Same data, from the boss's pocket."

- `!status` → all-room summary. Compare a number with the dashboard header — equal.
- `!room drawing` → 5 devices with states. Also show `!room work1` alias.
- `!usage` → total watts + kWh + bar breakdown.
- `!alerts` → active alerts — and point at the proactive alert the bot posted to the
  alerts channel by itself.

### 2:20 – 2:45 — Hardware schematic
> "For real sensing: an ESP32 per room reads the five wall switches as digital inputs,
> LEDs represent devices, and an ACS712 measures real current. Mains switching would
> need relays, opto-isolation and fuses — never GPIO pins — so for the hackathon the
> power draw is simulated in software."

*Screen: diagrams/hardware-schematic.md pin table.*

### 2:45 – 3:00 — Closing
> "One backend as the single source of truth, two synchronized views, realistic
> simulation, alerts that catch forgetful humans. That's WattsUp — thanks!"

*Screen: back to dashboard, a light flips ON as you say it (it will — every 5 s).*
