/**
 * WattsUp backend — the single source of truth.
 *
 * Simulated Device Layer ──► this server ──► REST + Socket.IO ──► dashboard & Discord bot
 */

require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");

const { initSocket } = require("./socket");
const { startSimulator } = require("./services/simulator");

const healthRoutes = require("./routes/health.routes");
const devicesRoutes = require("./routes/devices.routes");
const roomsRoutes = require("./routes/rooms.routes");
const usageRoutes = require("./routes/usage.routes");
const alertsRoutes = require("./routes/alerts.routes");
const simulationRoutes = require("./routes/simulation.routes");
const clockRoutes = require("./routes/clock.routes");

const PORT = Number.parseInt(process.env.PORT, 10) || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "*"; // "*" keeps local demos friction-free

const app = express();
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Friendly landing route for anyone opening the backend in a browser.
app.get("/", (req, res) => {
  res.json({
    service: "office-power-backend",
    message: "WattsUp — office lights & fans monitor backend",
    endpoints: [
      "GET /api/health",
      "GET /api/devices",
      "PATCH /api/devices/:id/toggle",
      "PATCH /api/devices/:id/state",
      "PATCH /api/devices/:id/mode",
      "PATCH /api/devices/reset-auto",
      "PATCH /api/devices/all-off",
      "GET /api/rooms",
      "GET /api/rooms/:roomName",
      "PATCH /api/rooms/:roomName/all-off",
      "GET /api/usage",
      "GET /api/alerts",
      "GET /api/simulation",
      "PATCH /api/simulation",
      "GET /api/clock",
      "PATCH /api/clock",
    ],
    socketEvents: [
      "devices:update",
      "rooms:update",
      "usage:update",
      "alerts:update",
      "simulation:update",
      "clock:update",
    ],
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/devices", devicesRoutes);
app.use("/api/rooms", roomsRoutes);
app.use("/api/usage", usageRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/simulation", simulationRoutes);
app.use("/api/clock", clockRoutes);

// Unknown routes get a JSON 404 instead of an HTML error page.
app.use((req, res) => {
  res.status(404).json({ error: "not-found", message: `No route for ${req.method} ${req.path}` });
});

const server = http.createServer(app);
initSocket(server, CLIENT_URL); // captures `io` for broadcastState()
startSimulator();

server.listen(PORT, () => {
  console.log("──────────────────────────────────────────────");
  console.log("⚡ WattsUp backend (source of truth) is up");
  console.log(`   REST API   → http://localhost:${PORT}/api`);
  console.log(`   Socket.IO  → ws://localhost:${PORT}`);
  console.log(`   CORS       → ${CLIENT_URL}`);
  console.log("──────────────────────────────────────────────");
});
