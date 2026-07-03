const router = require("express").Router();
const { devices } = require("../data/devices");
const { getRoomSummaries, getRoomDetails } = require("../services/roomService");
const { resolveRoomName, VALID_ROOM_NAMES } = require("../utils/roomAliases");

// GET /api/rooms — summaries for all three rooms
router.get("/", (req, res) => {
  const rooms = getRoomSummaries(devices);
  res.json({ count: rooms.length, rooms });
});

// GET /api/rooms/:roomName — accepts aliases like "drawing", "work-room-1", "work 2"
router.get("/:roomName", (req, res) => {
  const canonical = resolveRoomName(req.params.roomName);
  if (!canonical) {
    return res.status(404).json({
      error: "unknown-room",
      message: `No room matches "${req.params.roomName}".`,
      validRooms: VALID_ROOM_NAMES,
      hint: 'Try "drawing", "work1" or "work2".',
    });
  }
  res.json(getRoomDetails(devices, canonical));
});

module.exports = router;
