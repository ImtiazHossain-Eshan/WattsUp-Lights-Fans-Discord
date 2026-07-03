const router = require("express").Router();

// GET /api/health
router.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "office-power-backend",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  });
});

module.exports = router;
