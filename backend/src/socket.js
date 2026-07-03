/**
 * Socket.IO setup + the single place that serializes live state to clients.
 *
 * emitState(target) works with either the whole `io` server (broadcast after a
 * simulator tick or a manual control change) or a single `socket` (initial
 * snapshot on connection), so the dashboard always sees identical payloads.
 *
 * broadcastState() is the convenience the simulator and the write-routes call:
 * it pushes the full state to every connected client using the `io` captured at
 * init time (a no-op before init / with no clients).
 */

const { Server } = require("socket.io");
const { devices } = require("./data/devices");
const { getRoomSummaries } = require("./services/roomService");
const { getUsageSummary } = require("./services/usageService");
const { generateAlerts } = require("./services/alertService");
const { getSimulationState } = require("./services/simulationState");

let ioRef = null;

function emitState(target) {
  target.emit("devices:update", devices);
  target.emit("rooms:update", getRoomSummaries(devices));
  target.emit("usage:update", getUsageSummary(devices));
  target.emit("alerts:update", generateAlerts(devices));
  target.emit("simulation:update", getSimulationState());
}

function initSocket(httpServer, corsOrigin) {
  const io = new Server(httpServer, {
    cors: { origin: corsOrigin, methods: ["GET", "POST"] },
  });
  ioRef = io;

  io.on("connection", (socket) => {
    console.log(`[socket] client connected (${socket.id})`);
    emitState(socket); // full snapshot so a fresh dashboard renders instantly

    socket.on("disconnect", (reason) => {
      console.log(`[socket] client disconnected (${socket.id}) — ${reason}`);
    });
  });

  return io;
}

/** Broadcast the full live state to all clients (used after any state change). */
function broadcastState() {
  if (ioRef) emitState(ioRef);
}

module.exports = { initSocket, emitState, broadcastState };
