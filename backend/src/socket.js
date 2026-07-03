/**
 * Socket.IO setup + the single place that serializes live state to clients.
 *
 * emitState(target) works with either the whole `io` server (broadcast after a
 * simulator tick) or a single `socket` (initial snapshot on connection), so the
 * dashboard and the simulator always emit identical payloads.
 */

const { Server } = require("socket.io");
const { devices } = require("./data/devices");
const { getRoomSummaries } = require("./services/roomService");
const { getUsageSummary } = require("./services/usageService");
const { generateAlerts } = require("./services/alertService");

function emitState(target) {
  target.emit("devices:update", devices);
  target.emit("rooms:update", getRoomSummaries(devices));
  target.emit("usage:update", getUsageSummary(devices));
  target.emit("alerts:update", generateAlerts(devices));
}

function initSocket(httpServer, corsOrigin) {
  const io = new Server(httpServer, {
    cors: { origin: corsOrigin, methods: ["GET"] },
  });

  io.on("connection", (socket) => {
    console.log(`[socket] client connected (${socket.id})`);
    emitState(socket); // full snapshot so a fresh dashboard renders instantly

    socket.on("disconnect", (reason) => {
      console.log(`[socket] client disconnected (${socket.id}) — ${reason}`);
    });
  });

  return io;
}

module.exports = { initSocket, emitState };
