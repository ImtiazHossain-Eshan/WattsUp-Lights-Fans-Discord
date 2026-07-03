/**
 * WattsUp Discord bot.
 *
 * Every reply is built from live backend data (GET /api/...) — nothing is
 * hardcoded or generated inside the bot, so Discord and the web dashboard
 * always agree. Also polls /api/alerts every 30s and proactively posts NEW
 * alerts to ALERT_CHANNEL_ID (deduped by stable alert id).
 */

require("dotenv").config();

const { Client, GatewayIntentBits, Events } = require("discord.js");
const axios = require("axios");

const TOKEN = process.env.DISCORD_TOKEN;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
const ALERT_CHANNEL_ID = process.env.ALERT_CHANNEL_ID;
const ALERT_POLL_MS = 30_000;
const PREFIX = "!";

if (!TOKEN || TOKEN === "your_discord_bot_token_here") {
  console.error(
    [
      "❌ Missing DISCORD_TOKEN.",
      "   1. Copy bot/.env.example to bot/.env",
      "   2. Create an app at https://discord.com/developers/applications",
      "   3. Bot page → Reset Token → paste it into .env",
      '   4. Same page: enable "MESSAGE CONTENT INTENT"',
    ].join("\n")
  );
  process.exit(1);
}

const api = axios.create({ baseURL: `${BACKEND_URL}/api`, timeout: 5000 });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

/* ---------- formatting helpers ---------- */

const ROOM_EMOJI = {
  "Drawing Room": "🛋️",
  "Work Room 1": "💼",
  "Work Room 2": "🖥️",
};

const SEVERITY_EMOJI = { warning: "⚠️", critical: "🚨" };
const ROOM_MAX_W = 165; // 2x60W fans + 3x15W lights

function roomEmoji(name) {
  return ROOM_EMOJI[name] || "🚪";
}

function powerBar(watts, maxWatts = ROOM_MAX_W, slots = 8) {
  const filled = Math.min(slots, Math.round((watts / maxWatts) * slots));
  return "▰".repeat(filled) + "▱".repeat(slots - filled);
}

function relTime(iso) {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

function deviceLine(d) {
  const icon = d.type === "fan" ? "🌀" : "💡";
  return d.status === "on"
    ? `${icon} **${d.name}** — 🟢 ON · ${d.currentPower} W (since ${relTime(d.turnedOnAt) || "a moment ago"})`
    : `${icon} **${d.name}** — ⚫ off`;
}

function backendDownMessage() {
  return (
    `😵 I couldn't reach the office backend at \`${BACKEND_URL}\`. ` +
    "Is it running? (`npm run dev` inside `/backend`) — I'll be ready as soon as it's back."
  );
}

/* ---------- command handlers (all data comes from the backend) ---------- */

async function handleStatus(message) {
  const [roomsRes, usageRes] = await Promise.all([api.get("/rooms"), api.get("/usage")]);
  const { rooms } = roomsRes.data;
  const usage = usageRes.data;

  const lines = rooms.map(
    (r) =>
      `${roomEmoji(r.room)} **${r.room}** · ${r.totalPower} W — ` +
      `${r.fansOn}/2 fans, ${r.lightsOn}/3 lights on`
  );

  await message.reply(
    [
      `🏢 **Office right now** — ${usage.totalPowerWatts} W total, ` +
        `${usage.devicesOn} of ${usage.totalDevices} devices on`,
      "",
      ...lines,
      "",
      `📅 Estimated usage today: **${usage.estimatedTodayKwh} kWh**`,
      "💡 Try `!room drawing` for a closer look.",
    ].join("\n")
  );
}

async function handleRoom(message, args) {
  if (args.length === 0) {
    return message.reply(
      "🤔 Which room? Try `!room drawing`, `!room work1` or `!room work room 2`."
    );
  }

  const roomQuery = args.join(" ");
  try {
    const { data: room } = await api.get(`/rooms/${encodeURIComponent(roomQuery)}`);
    const deviceLines = room.devices.map(deviceLine);
    await message.reply(
      [
        `${roomEmoji(room.room)} **${room.room}** (${room.description}) — ` +
          `${room.devicesOn}/${room.totalDevices} on · **${room.totalPower} W**`,
        "",
        ...deviceLines,
      ].join("\n")
    );
  } catch (err) {
    if (err.response?.status === 404) {
      const validRooms = err.response.data?.validRooms?.join(", ") || "Drawing Room, Work Room 1, Work Room 2";
      return message.reply(
        `🙈 I don't know a room called **${roomQuery}**. We have: ${validRooms}. ` +
          "Shortcuts like `drawing`, `work1`, `work2` work too!"
      );
    }
    throw err; // network/backend errors → outer handler
  }
}

async function handleUsage(message) {
  const { data: usage } = await api.get("/usage");

  const roomLines = usage.perRoom.map(
    (r) =>
      `${roomEmoji(r.room)} ${r.room.padEnd(12)} ${powerBar(r.powerWatts)} ${r.powerWatts} W · ${r.devicesOn} on`
  );

  await message.reply(
    [
      `⚡ **Power check** — **${usage.totalPowerWatts} W** being drawn right now ` +
        `(${usage.devicesOn}/${usage.totalDevices} devices on)`,
      `📅 Estimated usage so far today: **${usage.estimatedTodayKwh} kWh** ` +
        `(${usage.hoursElapsedToday} h into the day)`,
      "",
      ...roomLines,
    ].join("\n")
  );
}

async function handleAlerts(message) {
  const { data } = await api.get("/alerts");
  const alerts = data.alerts;

  if (alerts.length === 0) {
    return message.reply(
      "✅ All clear — nothing running after hours and no rooms left on for ages. The office is behaving itself! 🎉"
    );
  }

  const lines = alerts.map(
    (a) =>
      `${SEVERITY_EMOJI[a.severity] || "⚠️"} [${a.room}] ${a.message} _(${relTime(a.timestamp)})_`
  );

  await message.reply(
    [`🚨 **${alerts.length} active alert${alerts.length > 1 ? "s" : ""}:**`, "", ...lines].join("\n")
  );
}

async function handleHelp(message) {
  await message.reply(
    [
      "👋 **WattsUp bot** — I watch the office lights & fans (live from the shared backend):",
      "",
      "`!status` — all-room summary",
      "`!room <name>` — one room in detail (`drawing`, `work1`, `work room 2`…)",
      "`!usage` — total power, estimated kWh today, per-room breakdown",
      "`!alerts` — active after-hours / long-running alerts",
      "`!help` — this list",
      "",
      "I also post new alerts to the alert channel automatically. 🚨",
    ].join("\n")
  );
}

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const [rawCmd, ...args] = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const cmd = (rawCmd || "").toLowerCase();

  try {
    switch (cmd) {
      case "status":
        return await handleStatus(message);
      case "room":
        return await handleRoom(message, args);
      case "usage":
        return await handleUsage(message);
      case "alerts":
        return await handleAlerts(message);
      case "help":
        return await handleHelp(message);
      default:
        return; // stay quiet on unknown ! prefixes — could belong to another bot
    }
  } catch (err) {
    console.error(`[bot] "${cmd}" failed:`, err.message);
    const reply = err.request && !err.response ? backendDownMessage() : "😬 Something went wrong fetching that — try again in a moment.";
    await message.reply(reply).catch(() => {});
  }
});

/* ---------- proactive alerts: poll /api/alerts, post only NEW ones ---------- */

const postedAlertIds = new Set();
let channelWarningShown = false;
let pollErrorShown = false;

function formatAlertPost(alert) {
  return [
    `${SEVERITY_EMOJI[alert.severity] || "⚠️"} **New office alert!**`,
    `${roomEmoji(alert.room)} [${alert.room}] ${alert.message}`,
  ].join("\n");
}

async function pollAlerts() {
  try {
    const { data } = await api.get("/alerts");
    pollErrorShown = false;

    const fresh = (data.alerts || []).filter((a) => !postedAlertIds.has(a.id));
    if (fresh.length === 0) return;

    const channel = await client.channels.fetch(ALERT_CHANNEL_ID).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      if (!channelWarningShown) {
        console.warn(
          `[alerts] ALERT_CHANNEL_ID "${ALERT_CHANNEL_ID}" is not a text channel I can see — proactive alerts skipped.`
        );
        channelWarningShown = true;
      }
      return;
    }

    for (const alert of fresh) {
      await channel.send(formatAlertPost(alert));
      postedAlertIds.add(alert.id);
      console.log(`[alerts] posted ${alert.id}`);
    }

    // keep the dedupe set from growing forever on long runs
    if (postedAlertIds.size > 500) {
      const activeIds = new Set((data.alerts || []).map((a) => a.id));
      for (const id of postedAlertIds) {
        if (!activeIds.has(id)) postedAlertIds.delete(id);
      }
    }
  } catch (err) {
    if (!pollErrorShown) {
      console.warn(`[alerts] cannot poll backend (${err.message}) — will keep retrying quietly.`);
      pollErrorShown = true;
    }
  }
}

/* ---------- startup ---------- */

client.once(Events.ClientReady, (c) => {
  console.log("──────────────────────────────────────────────");
  console.log(`🤖 WattsUp bot logged in as ${c.user.tag}`);
  console.log(`   Backend → ${BACKEND_URL}`);
  if (ALERT_CHANNEL_ID && ALERT_CHANNEL_ID !== "your_discord_channel_id_here") {
    console.log(`   Proactive alerts → channel ${ALERT_CHANNEL_ID} (every ${ALERT_POLL_MS / 1000}s)`);
    setInterval(pollAlerts, ALERT_POLL_MS);
    pollAlerts(); // first check immediately so demos don't wait 30s
  } else {
    console.log("   Proactive alerts → disabled (no ALERT_CHANNEL_ID set)");
  }
  console.log("──────────────────────────────────────────────");
});

client.login(TOKEN).catch((err) => {
  if (String(err.message).includes("disallowed intents")) {
    console.error(
      '❌ Discord rejected the login: enable "MESSAGE CONTENT INTENT" in the Developer Portal → Bot page, then restart.'
    );
  } else {
    console.error("❌ Discord login failed — double-check DISCORD_TOKEN in bot/.env:", err.message);
  }
  process.exit(1);
});
