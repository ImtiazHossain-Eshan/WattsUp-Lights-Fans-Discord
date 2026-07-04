/**
 * WattsUp Discord bot — the boss's quick-access remote control.
 *
 * Every reply is rendered from LIVE backend data (the same API the dashboard
 * uses) at the moment the command arrives — nothing is hardcoded, cached or
 * invented here, so Discord and the web dashboard always agree.
 *
 *   Simulated Device Layer → Backend API → Web Dashboard
 *                                        → THIS BOT
 *
 * Commands: !status · !room <name> · !usage · !alerts · !help
 * Control:  !simulation [on|off] · !turnoff all · !turnoff room <name>
 * Extras:   interactive buttons on every view, proactive alert posts
 *           (30 s poll, deduped by stable alert IDs), office-clock-aware
 *           timestamps ("since 22m ago" measured on the office clock).
 *
 * The formatters are exported and the Discord client only starts when this
 * file is the entrypoint, so the views can be smoke-tested headlessly:
 *   node -e "require('./bot.js').buildHelpView()"
 */

require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActivityType,
} = require("discord.js");
const axios = require("axios");

/* ============================== config ============================== */

const TOKEN = process.env.DISCORD_TOKEN;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
const ALERT_CHANNEL_ID = process.env.ALERT_CHANNEL_ID;
const ALERT_POLL_MS = 30_000;
const PREFIX = "!";

// Embed colors — same semantic palette as the dashboard theme.
const COLOR = {
  brand: 0xf44174, // hot pink — neutral/branded views
  ok: 0x00cc88,
  info: 0x0ea5e9,
  warn: 0xff8833,
  crit: 0xff3355,
  idle: 0x666666,
};

const OFFICE_MAX_W = 495; // 6 fans x 60W + 9 lights x 15W
const ROOM_MAX_W = 165; // 2 fans + 3 lights

/* ============================ API layer ============================= */
/* Small helpers around the shared backend — the single source of truth. */

const api = axios.create({ baseURL: `${BACKEND_URL}/api`, timeout: 5000 });

const getRooms = async () => (await api.get("/rooms")).data.rooms;
const getRoom = async (query) =>
  (await api.get(`/rooms/${encodeURIComponent(query)}`)).data;
const getUsage = async () => (await api.get("/usage")).data;
const getAlerts = async () => (await api.get("/alerts")).data.alerts;
const getSimulation = async () => (await api.get("/simulation")).data;
const getClock = async () => (await api.get("/clock")).data;
const patchSimulation = async (enabled) =>
  (await api.patch("/simulation", { enabled })).data;
const patchAllOff = async () => (await api.patch("/devices/all-off")).data;
const patchRoomOff = async (query) =>
  (await api.patch(`/rooms/${encodeURIComponent(query)}/all-off`)).data;

/** Clock fetch that never breaks a view — falls back to real time. */
async function getClockSafe() {
  try {
    return await getClock();
  } catch {
    return { officeTime: new Date().toISOString(), speed: 1, isRealTime: true };
  }
}

const isBackendDown = (err) => Boolean(err.request && !err.response);

/* ==================== office-clock time helpers ===================== */
/* All ages/stamps are measured on the OFFICE clock (the backend's virtual
   time), so the bot matches the dashboard even at 600x demo speed. */

function officeNowMs(clock) {
  const parsed = Date.parse(clock?.officeTime);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function relOfficeTime(iso, clock) {
  if (!iso) return "";
  const diffMin = Math.floor((officeNowMs(clock) - Date.parse(iso)) / 60_000);
  if (!Number.isFinite(diffMin) || diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ${diffMin % 60}m ago`;
}

function officeClockStamp(clock) {
  const time = new Date(officeNowMs(clock)).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const speed = clock?.speed ?? 1;
  return clock?.isRealTime ? `Office time ${time}` : `Office time ${time} · ${speed}× sim`;
}

const footer = (clock) => ({ text: `${officeClockStamp(clock)} · live shared backend` });

/* ======================= formatting helpers ======================== */

const ROOM_EMOJI = { "Drawing Room": "🛋️", "Work Room 1": "💼", "Work Room 2": "🖥️" };
const SEVERITY_EMOJI = { warning: "⚠️", critical: "🚨" };

const roomEmoji = (name) => ROOM_EMOJI[name] || "🚪";

function powerBar(watts, maxWatts, slots = 10) {
  const filled = Math.max(0, Math.min(slots, Math.round((watts / maxWatts) * slots)));
  return "█".repeat(filled) + "░".repeat(slots - filled);
}

/** "1 fan and 2 lights ON" / "all off" — the PDF's phrasing, from real counts. */
function roomPhrase(room) {
  if ((room.devicesOn ?? 0) === 0) return "all off 😴";
  if (room.devicesOn === room.totalDevices) return `everything ON (${room.totalPower} W) 😅`;
  const parts = [];
  if (room.fansOn > 0) parts.push(`${room.fansOn} fan${room.fansOn > 1 ? "s" : ""}`);
  if (room.lightsOn > 0) parts.push(`${room.lightsOn} light${room.lightsOn > 1 ? "s" : ""}`);
  return `${parts.join(" and ")} ON · ${room.totalPower} W`;
}

function deviceLine(d, clock) {
  const icon = d.type === "fan" ? "🌀" : "💡";
  const mode = d.controlMode === "manual" ? "manual" : "auto";
  return d.status === "on"
    ? `${icon} **${d.name}** — 🟢 ON · ${d.currentPower} W · ${mode} · since ${relOfficeTime(d.turnedOnAt, clock)}`
    : `${icon} **${d.name}** — ⚫ off · ${mode}`;
}

/** One deterministic, data-driven "human" observation for the status view. */
function statusInsight(rooms, usage) {
  if (usage.devicesOn === 0) return "The whole office is dark — beautifully frugal. 🌙";
  if (usage.devicesOn === usage.totalDevices)
    return "Every single device is running — the meter is sprinting. 😅";
  const top = [...rooms].sort((a, b) => b.totalPower - a.totalPower)[0];
  if (top && top.totalPower > 0) {
    const share = Math.round((top.totalPower / Math.max(usage.totalPowerWatts, 1)) * 100);
    return share >= 60
      ? `${top.room} is the main power user right now (${share}% of the draw).`
      : `Biggest consumer at the moment: ${top.room} at ${top.totalPower} W.`;
  }
  return "";
}

const backendDownText = () =>
  `😵 I can't reach the office backend at \`${BACKEND_URL}\` right now. ` +
  "Is it running? (`npm run dev` inside `/backend`) — I'll answer as soon as it's back.";

/* ============================ views ================================ */
/* Each view = { embeds, components } so commands AND buttons share them. */

const btn = (id, label, style = ButtonStyle.Secondary) =>
  new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(style);

function navRow(current) {
  const items = [
    ["v:status", "🏢 Status"],
    ["v:usage", "⚡ Usage"],
    ["v:alerts", "🚨 Alerts"],
  ].filter(([id]) => id !== current);
  return new ActionRowBuilder().addComponents(
    btn(current, "↻ Refresh", ButtonStyle.Primary),
    ...items.map(([id, label]) => btn(id, label))
  );
}

function roomButtonsRow(rooms) {
  return new ActionRowBuilder().addComponents(
    rooms.slice(0, 5).map((r) => btn(`v:room:${r.room}`, `${roomEmoji(r.room)} ${r.room}`))
  );
}

async function buildStatusView() {
  const [rooms, usage, sim, clock] = await Promise.all([
    getRooms(),
    getUsage(),
    getSimulation(),
    getClockSafe(),
  ]);

  const roomLines = rooms.map(
    (r) => `${roomEmoji(r.room)} **${r.room}** — ${roomPhrase(r)}`
  );
  const insight = statusInsight(rooms, usage);

  const embed = new EmbedBuilder()
    .setColor(usage.devicesOn === 0 ? COLOR.ok : COLOR.brand)
    .setTitle("🏢 Office right now")
    .setDescription(
      [
        ...roomLines,
        "",
        `**Total power: ${usage.totalPowerWatts} W** · ${usage.devicesOn}/${usage.totalDevices} devices on · est. **${usage.estimatedTodayKwh} kWh** today`,
        sim.enabled
          ? `🔁 Simulation running (${sim.autoDevices} auto / ${sim.manualDevices} manual)`
          : `⏸️ Simulation paused (${sim.manualDevices} manual)`,
        insight ? `\n_${insight}_` : "",
      ]
        .filter((line) => line !== "")
        .join("\n")
    )
    .setFooter(footer(clock));

  return { embeds: [embed], components: [roomButtonsRow(rooms), navRow("v:status")] };
}

async function buildRoomView(query) {
  const [room, clock] = await Promise.all([getRoom(query), getClockSafe()]);

  const embed = new EmbedBuilder()
    .setColor(room.devicesOn > 0 ? COLOR.brand : COLOR.idle)
    .setTitle(`${roomEmoji(room.room)} ${room.room}`)
    .setDescription(
      [
        `_${room.description}_ · expected usage: ${room.expectedUsage || "—"}`,
        "",
        ...room.devices.map((d) => deviceLine(d, clock)),
        "",
        `**Current room power: ${room.totalPower} W** (${room.devicesOn}/${room.totalDevices} on)`,
        `\`${powerBar(room.totalPower, ROOM_MAX_W)}\` ${Math.round((room.totalPower / ROOM_MAX_W) * 100)}% of room max`,
      ].join("\n")
    )
    .setFooter(footer(clock));

  const actions = new ActionRowBuilder().addComponents(
    btn(`v:room:${room.room}`, "↻ Refresh", ButtonStyle.Primary),
    btn(`a:roomoff:${room.room}`, "⏻ Turn room off", ButtonStyle.Danger),
    btn("v:status", "← Office")
  );
  return { embeds: [embed], components: [actions] };
}

async function buildUsageView() {
  const [usage, clock] = await Promise.all([getUsage(), getClockSafe()]);

  const rows = usage.perRoom.map(
    (r) =>
      `${r.room.padEnd(13)} ${powerBar(r.powerWatts, ROOM_MAX_W)} ${String(r.powerWatts).padStart(3)} W · ${r.devicesOn} on`
  );

  const embed = new EmbedBuilder()
    .setColor(COLOR.info)
    .setTitle("⚡ Power update")
    .setDescription(
      [
        `The office is currently drawing **${usage.totalPowerWatts} W** (${usage.devicesOn}/${usage.totalDevices} devices on).`,
        `Estimated usage today: **${usage.estimatedTodayKwh} kWh** — ${usage.hoursElapsedToday} h into the office day.`,
        "",
        "```",
        `${"Office".padEnd(13)} ${powerBar(usage.totalPowerWatts, OFFICE_MAX_W)} ${String(usage.totalPowerWatts).padStart(3)} W total`,
        ...rows,
        "```",
      ].join("\n")
    )
    .setFooter(footer(clock));

  return { embeds: [embed], components: [navRow("v:usage")] };
}

async function buildAlertsView() {
  const [alerts, clock] = await Promise.all([getAlerts(), getClockSafe()]);

  if (alerts.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(COLOR.ok)
      .setTitle("✅ No active alerts")
      .setDescription(
        "Office looks calm — nothing running after hours and no rooms left on for 2+ hours. 🎉"
      )
      .setFooter(footer(clock));
    return { embeds: [embed], components: [navRow("v:alerts")] };
  }

  const hasCritical = alerts.some((a) => a.severity === "critical");
  const lines = alerts.map(
    (a) =>
      `${SEVERITY_EMOJI[a.severity] || "⚠️"} **${a.room}** — ${a.message} _(${relOfficeTime(a.timestamp, clock)})_`
  );

  const embed = new EmbedBuilder()
    .setColor(hasCritical ? COLOR.crit : COLOR.warn)
    .setTitle(`🚨 ${alerts.length} active alert${alerts.length > 1 ? "s" : ""}`)
    .setDescription(lines.join("\n"))
    .setFooter(footer(clock));

  return { embeds: [embed], components: [navRow("v:alerts")] };
}

function buildHelpView() {
  const embed = new EmbedBuilder()
    .setColor(COLOR.brand)
    .setTitle("👋 WattsUp bot — office lights & fans, live")
    .setDescription(
      [
        "I read the **same backend as the web dashboard**, so we always agree.",
        "",
        "`!status` — all rooms at a glance (+ buttons)",
        "`!room <name>` — one room in detail · `drawing`, `work1`, `work room 2`…",
        "`!usage` — total W, estimated kWh today, per-room breakdown",
        "`!alerts` — active after-hours / long-running alerts",
        "`!help` — this list",
        "",
        "**Control (writes to the backend):**",
        "`!simulation` / `!simulation on|off` — view or switch the simulated device layer",
        "`!turnoff all` — everything off (pinned to manual)",
        "`!turnoff room <name>` — one room off",
        "",
        "🚨 New alerts are also posted to the alert channel automatically.",
      ].join("\n")
    );
  return { embeds: [embed], components: [] };
}

async function buildSimulationView(justSet) {
  const [sim, clock] = await Promise.all([getSimulation(), getClockSafe()]);
  const embed = new EmbedBuilder()
    .setColor(sim.enabled ? COLOR.ok : COLOR.idle)
    .setTitle(sim.enabled ? "🔁 Simulation is ON" : "⏸️ Simulation is OFF")
    .setDescription(
      [
        justSet ? `Done — simulation switched **${sim.enabled ? "on" : "off"}**.` : "",
        sim.enabled
          ? `The simulated device layer nudges one of ${sim.autoDevices} auto device${sim.autoDevices === 1 ? "" : "s"} every ${Math.round((sim.intervalMs || 5000) / 1000)} s toward each room's expected occupancy.`
          : "Devices only change through manual control (dashboard or `!turnoff …`).",
        `${sim.manualDevices} device${sim.manualDevices === 1 ? "" : "s"} pinned to manual.`,
      ]
        .filter(Boolean)
        .join("\n")
    )
    .setFooter(footer(clock));

  const row = new ActionRowBuilder().addComponents(
    btn(sim.enabled ? "a:simoff" : "a:simon", sim.enabled ? "⏸ Pause simulation" : "▶ Resume simulation", sim.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
    btn("v:status", "← Office")
  );
  return { embeds: [embed], components: [row] };
}

/* ===================== command / button routing ===================== */

async function respondForError(err, send) {
  if (err.response?.status === 404 && err.response.data?.validRooms) {
    const rooms = err.response.data.validRooms.join("**, **");
    return send(
      `🙈 I don't know that room. We have **${rooms}** — shortcuts like \`drawing\`, \`work1\`, \`work2\` work too.`
    );
  }
  if (isBackendDown(err)) return send(backendDownText());
  console.error("[bot] request failed:", err.message);
  return send("😬 Something went wrong fetching that — try again in a moment.");
}

async function handleCommand(message, cmd, args) {
  const send = (payload) =>
    message.reply(typeof payload === "string" ? { content: payload } : payload);

  try {
    switch (cmd) {
      case "status":
        return await send(await buildStatusView());
      case "room": {
        if (args.length === 0) {
          return send("🤔 Which room? Usage: `!room work1` (or `drawing`, `work room 2`…)");
        }
        return await send(await buildRoomView(args.join(" ")));
      }
      case "usage":
        return await send(await buildUsageView());
      case "alerts":
        return await send(await buildAlertsView());
      case "help":
        return await send(buildHelpView());
      case "simulation": {
        const arg = (args[0] || "").toLowerCase();
        if (arg === "on" || arg === "off") {
          await patchSimulation(arg === "on");
          return await send(await buildSimulationView(true));
        }
        if (arg !== "") {
          return send("Usage: `!simulation`, `!simulation on` or `!simulation off`.");
        }
        return await send(await buildSimulationView(false));
      }
      case "turnoff": {
        const target = (args[0] || "").toLowerCase();
        if (target === "all") {
          await patchAllOff();
          return await send(
            "⏻ Done — **all 15 devices are off** and pinned to manual so the simulator won't relight them. " +
              '("Reset all to Auto" on the dashboard hands them back.)'
          );
        }
        if (target === "room" && args.length > 1) {
          const roomQuery = args.slice(1).join(" ");
          const result = await patchRoomOff(roomQuery);
          return await send(
            `⏻ Done — **${result.room}** is now all off (${result.count} devices, pinned to manual).`
          );
        }
        return send("Usage: `!turnoff all` or `!turnoff room <name>` (e.g. `!turnoff room work1`).");
      }
      default:
        return; // unknown !prefix → stay quiet, it may belong to another bot
    }
  } catch (err) {
    await respondForError(err, send).catch(() => {});
  }
}

async function handleButton(interaction) {
  const id = interaction.customId;
  try {
    await interaction.deferUpdate();

    if (id.startsWith("a:roomoff:")) {
      const room = id.slice("a:roomoff:".length);
      await patchRoomOff(room);
      await interaction.editReply(await buildRoomView(room));
      await interaction
        .followUp({ content: `⏻ ${room} switched off (pinned to manual).`, ephemeral: true })
        .catch(() => {});
      return;
    }
    if (id === "a:simon" || id === "a:simoff") {
      await patchSimulation(id === "a:simon");
      return await interaction.editReply(await buildSimulationView(true));
    }
    if (id.startsWith("v:room:")) {
      return await interaction.editReply(await buildRoomView(id.slice("v:room:".length)));
    }
    if (id === "v:status") return await interaction.editReply(await buildStatusView());
    if (id === "v:usage") return await interaction.editReply(await buildUsageView());
    if (id === "v:alerts") return await interaction.editReply(await buildAlertsView());
  } catch (err) {
    console.error(`[bot] button "${id}" failed:`, err.message);
    const text = isBackendDown(err) ? backendDownText() : "😬 That didn't work — try again in a moment.";
    await interaction.followUp({ content: text, ephemeral: true }).catch(() => {});
  }
}

/* ============ proactive alerts: post only NEW alert IDs ============ */

const postedAlertIds = new Set();

function buildAlertPost(freshAlerts, clock) {
  const hasCritical = freshAlerts.some((a) => a.severity === "critical");
  const lines = freshAlerts.map(
    (a) => `${SEVERITY_EMOJI[a.severity] || "⚠️"} **${a.room}** — ${a.message}`
  );
  const embed = new EmbedBuilder()
    .setColor(hasCritical ? COLOR.crit : COLOR.warn)
    .setTitle(
      freshAlerts.length === 1
        ? "⚠️ Hey! New office alert"
        : `⚠️ Hey! ${freshAlerts.length} new office alerts`
    )
    .setDescription([...lines, "", "_Did someone forget to leave?_ 👀"].join("\n"))
    .setFooter(footer(clock));
  return { embeds: [embed] };
}

function startAlertPoller(client) {
  let channelWarningShown = false;
  let pollErrorShown = false;

  async function pollAlerts() {
    try {
      const [alerts, clock] = await Promise.all([getAlerts(), getClockSafe()]);
      pollErrorShown = false;

      const fresh = alerts.filter((a) => !postedAlertIds.has(a.id));
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

      // One combined embed even when many alerts fire at once (e.g. the office
      // clock jumps to 6 PM) — informative, never a message storm.
      await channel.send(buildAlertPost(fresh, clock));
      fresh.forEach((a) => postedAlertIds.add(a.id));
      console.log(`[alerts] posted ${fresh.length} new alert${fresh.length > 1 ? "s" : ""}`);

      if (postedAlertIds.size > 500) {
        const activeIds = new Set(alerts.map((a) => a.id));
        for (const id of postedAlertIds) if (!activeIds.has(id)) postedAlertIds.delete(id);
      }
    } catch (err) {
      if (!pollErrorShown) {
        console.warn(`[alerts] cannot poll backend (${err.message}) — retrying quietly.`);
        pollErrorShown = true;
      }
    }
  }

  setInterval(pollAlerts, ALERT_POLL_MS);
  pollAlerts(); // immediate first check so demos don't wait 30 s
}

/* ============================ startup ============================== */

function main() {
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

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;
    const [rawCmd, ...args] = message.content.slice(PREFIX.length).trim().split(/\s+/);
    await handleCommand(message, (rawCmd || "").toLowerCase(), args);
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton()) await handleButton(interaction);
  });

  client.once(Events.ClientReady, async (c) => {
    console.log("──────────────────────────────────────────────");
    console.log(`🤖 WattsUp bot logged in as ${c.user.tag}`);
    console.log(`   Backend → ${BACKEND_URL}`);
    c.user.setActivity("the office meters · !help", { type: ActivityType.Watching });

    try {
      await api.get("/health");
      console.log("   Backend reachable ✔");
    } catch {
      console.warn("   ⚠ Backend not reachable yet — commands will say so until it's up.");
    }

    if (ALERT_CHANNEL_ID && ALERT_CHANNEL_ID !== "your_discord_channel_id_here") {
      console.log(`   Proactive alerts → channel ${ALERT_CHANNEL_ID} (every ${ALERT_POLL_MS / 1000}s)`);
      startAlertPoller(client);
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
}

if (require.main === module) main();

// Exported for headless smoke tests (no Discord connection needed).
module.exports = {
  buildStatusView,
  buildRoomView,
  buildUsageView,
  buildAlertsView,
  buildHelpView,
  buildSimulationView,
  relOfficeTime,
  roomPhrase,
  statusInsight,
};
