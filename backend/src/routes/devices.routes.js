const router = require("express").Router();
const { devices } = require("../data/devices");

// GET /api/devices — the full 15-device list
router.get("/", (req, res) => {
  res.json({ count: devices.length, devices });
});

module.exports = router;
