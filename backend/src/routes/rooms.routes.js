const router = require("express").Router();
const { devices } = require("../data/devices");
const { getRoomSummaries, getRoomDetails } = require("../services/roomService");
const { resolveRoomName, VALID_ROOM_NAMES } = require("../utils/roomAliases");
const deviceService = require("../services/deviceService");
const { broadcastState } = require("../socket");

function unknownRoom(res, name) {
  return res.status(404).json({
    error: "unknown-room",
    message: `No room matches "${name}".`,
    validRooms: VALID_ROOM_NAMES,
    hint: 'Try "drawing", "work1" or "work2".',
  });
}

// GET /api/rooms — summaries for all three rooms
router.get("/", (req, res) => {
  const rooms = getRoomSummaries(devices);
  res.json({ count: rooms.length, rooms });
});

// PATCH /api/rooms/:roomName/all-off — turn a room's devices off (manual)
router.patch("/:roomName/all-off", (req, res) => {
  const canonical = resolveRoomName(req.params.roomName);
  if (!canonical) return unknownRoom(res, req.params.roomName);

  const affected = deviceService.turnRoomOff(canonical);
  broadcastState();
  res.json({ ok: true, room: canonical, count: affected.length, devices: affected });
});

// GET /api/rooms/:roomName — accepts aliases like "drawing", "work-room-1", "work 2"
router.get("/:roomName", (req, res) => {
  const canonical = resolveRoomName(req.params.roomName);
  if (!canonical) return unknownRoom(res, req.params.roomName);
  res.json(getRoomDetails(devices, canonical));
});

module.exports = router;
