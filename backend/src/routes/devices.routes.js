const router = require("express").Router();
const { devices } = require("../data/devices");
const deviceService = require("../services/deviceService");
const { broadcastState } = require("../socket");

// Parse the desired on/off state from a request body. Accepts either
// { "status": "on" | "off" } or { "on": true | false }. Returns null if neither.
function parseDesiredState(body) {
  if (!body || typeof body !== "object") return null;
  if (typeof body.on === "boolean") return body.on;
  if (body.status === "on") return true;
  if (body.status === "off") return false;
  return null;
}

function notFound(res, id) {
  return res
    .status(404)
    .json({ error: "unknown-device", message: `No device with id "${id}".` });
}

// GET /api/devices — the full 15-device list
router.get("/", (req, res) => {
  res.json({ count: devices.length, devices });
});

// PATCH /api/devices/reset-auto — hand every device back to the simulator (auto)
// NOTE: literal routes are declared before "/:id/..." so they can't be shadowed.
router.patch("/reset-auto", (req, res) => {
  deviceService.resetAllToAuto();
  broadcastState();
  res.json({ ok: true, count: devices.length, devices });
});

// PATCH /api/devices/all-off — turn everything off and pin to manual
router.patch("/all-off", (req, res) => {
  deviceService.turnAllOff();
  broadcastState();
  res.json({ ok: true, count: devices.length, devices });
});

// PATCH /api/devices/:id/toggle — flip on↔off (manual control)
router.patch("/:id/toggle", (req, res) => {
  const device = deviceService.findDevice(req.params.id);
  if (!device) return notFound(res, req.params.id);
  deviceService.manualToggle(device);
  broadcastState();
  res.json({ ok: true, device });
});

// PATCH /api/devices/:id/state — set an explicit on/off state (manual control)
router.patch("/:id/state", (req, res) => {
  const device = deviceService.findDevice(req.params.id);
  if (!device) return notFound(res, req.params.id);

  const desired = parseDesiredState(req.body);
  if (desired === null) {
    return res.status(400).json({
      error: "bad-request",
      message: 'Provide {"status":"on"|"off"} or {"on":true|false}.',
    });
  }

  deviceService.manualSetState(device, desired);
  broadcastState();
  res.json({ ok: true, device });
});

// PATCH /api/devices/:id/mode — switch control mode without changing on/off state
router.patch("/:id/mode", (req, res) => {
  const device = deviceService.findDevice(req.params.id);
  if (!device) return notFound(res, req.params.id);

  const mode = req.body?.mode;
  if (mode !== "auto" && mode !== "manual") {
    return res.status(400).json({
      error: "bad-request",
      message: 'Provide {"mode":"auto"|"manual"}.',
    });
  }

  deviceService.setControlMode(device, mode);
  broadcastState();
  res.json({ ok: true, device });
});

module.exports = router;
