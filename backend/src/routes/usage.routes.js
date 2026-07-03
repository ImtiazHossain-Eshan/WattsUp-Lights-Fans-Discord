const router = require("express").Router();
const { devices } = require("../data/devices");
const { getUsageSummary } = require("../services/usageService");

// GET /api/usage — total power, per-room breakdown, estimated kWh today
router.get("/", (req, res) => {
  res.json(getUsageSummary(devices));
});

module.exports = router;
