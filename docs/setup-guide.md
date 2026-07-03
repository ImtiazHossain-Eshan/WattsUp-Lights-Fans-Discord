# Setup Guide

Three processes share one backend: **backend** (required first), **dashboard**, **bot**.
Node.js ≥ 18 required (`node -v`).

## 1. Backend (source of truth) — required

```bash
cd backend
npm install
copy .env.example .env        # macOS/Linux: cp .env.example .env  (optional — defaults work)
npm run dev                   # or: npm start
```

Expected console output:

```
[simulator] running — toggling one random device every 5s
⚡ WattsUp backend (source of truth) is up
   REST API   → http://localhost:5000/api
```

Sanity check: open <http://localhost:5000/api/health> — you should see `"status": "ok"`.
Every ~5 s the console logs a toggle like `[simulator] Work Room 1 · Light 2 → OFF`.

## 2. Dashboard

```bash
cd dashboard
npm install
copy .env.example .env        # optional — defaults to http://localhost:5000
npm run dev
```

Open <http://localhost:5173>. You should see the isometric office with the
**Live** badge green, lights glowing, fans spinning, and device states flipping
every few seconds **without refreshing**.

## 3. Discord bot

### 3a. Create the Discord application (one time)

1. <https://discord.com/developers/applications> → **New Application**.
2. **Bot** page → **Reset Token** → copy the token.
3. Same page → enable **MESSAGE CONTENT INTENT** (required for `!commands` — the
   most common setup mistake).
4. **OAuth2 → URL Generator**: scope `bot`; permissions **View Channels**,
   **Send Messages**, **Read Message History**. Open the generated URL and invite
   the bot to your server.
5. For proactive alerts: Discord → Settings → Advanced → **Developer Mode ON**,
   then right-click your alerts channel → **Copy Channel ID**.

### 3b. Run it

```bash
cd bot
npm install
copy .env.example .env
# edit .env: DISCORD_TOKEN=...  ALERT_CHANNEL_ID=...  (BACKEND_URL default is fine)
npm run dev
```

Expected: `🤖 WattsUp bot logged in as <name>`. In any channel the bot can read,
type `!status`.

## Environment variables

| File | Variable | Default | Purpose |
|------|----------|---------|---------|
| backend/.env | `PORT` | 5000 | API + Socket.IO port |
| backend/.env | `CLIENT_URL` | `*` | CORS origin (set `http://localhost:5173` to lock down) |
| backend/.env | `SIMULATION_INTERVAL_MS` | 5000 | simulator tick |
| backend/.env | `OFFICE_START_HOUR` / `OFFICE_END_HOUR` | 9 / 17 | office hours for alerts |
| backend/.env | `LONG_RUNNING_HOURS` | 2 | long-running room threshold |
| dashboard/.env | `VITE_BACKEND_URL` | `http://localhost:5000` | backend address |
| bot/.env | `DISCORD_TOKEN` | — (required) | bot login |
| bot/.env | `BACKEND_URL` | `http://localhost:5000` | backend address |
| bot/.env | `ALERT_CHANNEL_ID` | — (optional) | proactive alert channel |

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Dashboard shows "Offline" | backend not running, or `VITE_BACKEND_URL` wrong |
| Bot replies nothing | MESSAGE CONTENT INTENT not enabled, or bot can't see the channel |
| `disallowed intents` on bot start | enable MESSAGE CONTENT INTENT, restart |
| Port 5000 busy | change `PORT` in backend/.env **and** the two client env files |
| No alerts ever appear | expected during office hours — see docs/testing-plan.md to force them |
