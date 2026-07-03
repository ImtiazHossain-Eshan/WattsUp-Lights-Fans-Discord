const router = require("express").Router();
const { devices } = require("../data/devices");
const { generateAlerts } = require("../services/alertService");

// GET /api/alerts — currently active alerts (after-hours + long-running rooms)
router.get("/", (req, res) => {
  const alerts = generateAlerts(devices);
  res.json({ count: alerts.length, alerts });
});

module.exports = router;
