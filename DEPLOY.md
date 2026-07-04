# Deploying WattsUp on DigitalOcean App Platform

WattsUp ships as **one App Platform app** on a single HTTPS domain:

| Route | Component | Type |
|-------|-----------|------|
| `/` | dashboard (React/Vite build) | Static Site |
| `/api` (+ `/api/socket.io`) | backend (Express + Socket.IO) | Web Service |
| — | Discord bot | Worker (no inbound HTTP) |

Because the dashboard and API share one origin, there's **no CORS to set up** and the
frontend needs **no backend URL** — it calls `/api` relatively, and Socket.IO runs at
`/api/socket.io`. HTTPS/WSS is automatic. The spec is in [`.do/app.yaml`](.do/app.yaml).

> **Why App Platform and not Vercel/Netlify?** The backend is a long-lived process holding
> live WebSocket connections plus a `setInterval` simulator and the office clock — it needs
> an always-on server, which serverless/static hosts can't provide.

---

## 0. One-time prerequisites

1. **Redeem the DigitalOcean credit** — from your GitHub Student Developer Pack, follow the
   DigitalOcean offer to get **$200 for 12 months**. (This app runs ~$10/mo, so the credit
   lasts well over a year.)
2. **A Discord bot token** (only if you want the bot live) — Discord Developer Portal → your
   app → **Bot** → *Reset Token*, and enable **MESSAGE CONTENT INTENT** on that same page.
3. *(optional)* `doctl` CLI installed and authed (`doctl auth init`) if you prefer the CLI.

## 1. Push the code to GitHub

App Platform builds from your repo, so the production branch must contain the latest code.

```bash
git add -A
git commit -m "Deploy: App Platform config + same-origin wiring"
# push to the branch named in .do/app.yaml (default: main)
git push origin HEAD:main
```

> The spec currently targets **`main`**. If you deploy from a different branch, change every
> `branch:` in [`.do/app.yaml`](.do/app.yaml) to match.

## 2. Create the app

**Option A — UI (easiest):**
1. https://cloud.digitalocean.com/apps → **Create App** → **GitHub** → pick
   `ImtiazHossain-Eshan/WattsUp-Lights-Fans-Discord` and the branch.
2. App Platform detects `.do/app.yaml` and pre-fills all three components. Review → **Create**.

**Option B — CLI:**
```bash
doctl apps create --spec .do/app.yaml
```

## 3. Set the bot's secrets (skip if not deploying the bot)

In the app → **Settings → `bot` component → Environment Variables**:
- `DISCORD_TOKEN` → your token — mark it **Encrypted**.
- `ALERT_CHANNEL_ID` → the channel ID for proactive alerts (right-click a channel → *Copy
  Channel ID*; enable Developer Mode first). Leave blank to disable proactive posts.

Save → the app redeploys the bot.

## 4. Open it

When the build finishes you get a URL like `https://wattsup-xxxxx.ondigitalocean.app`.
Open it — the 3D dashboard loads, the **Live** badge turns green, and devices start
animating. Add the bot to your server with an OAuth2 URL (scopes `bot`, permissions *Send
Messages* + *Read Message History*), then try `!status` / `!alerts`.

## 5. (Optional) Custom domain — also in your Student Pack

Grab a free domain (**Name.com** `.app`/`.dev`, **Namecheap** `.me`, or the free `.tech`).
Then App Platform → **Settings → Domains → Add Domain**, enter it, and create the CNAME/A
records it shows at your registrar. TLS is issued automatically. (`.app`/`.dev` force HTTPS —
fine here, since everything is HTTPS anyway.)

---

## Notes & gotchas

- **State is in-memory.** Every deploy/restart resets devices to the initial 8-ON pattern and
  the clock to real time. That's expected for this demo — no database needed (so the
  MongoDB Atlas credit isn't required).
- **Costs.** `basic-xxs` (backend) + `basic-xxs` (bot) ≈ $10/mo; the static site is free. If
  App Platform rejects `instance_size_slug`, delete those lines and pick the smallest ($5)
  size in the UI. Drop the `bot` worker to halve the cost.
- **Local dev is unchanged.** Locally the dashboard (`:5173`) still talks to the backend
  (`:5000`) — `api.js` falls back to `http://localhost:5000` in dev, and Socket.IO uses the
  same `/api/socket.io` path in both dev and prod.
- **Hosting the backend separately?** Set the dashboard's `VITE_BACKEND_URL` (build-time) to
  the backend's HTTPS URL and the backend's `CLIENT_URL` to the dashboard origin; everything
  else already works cross-origin (the backend's CORS defaults to `*`).
- **Force alerts in the live demo** with the dashboard clock (jump to 6 PM, or 1800× speed) —
  no restart needed.
