const router = require("express").Router();
const { getClockState, configureClock } = require("../services/clockService");
const { broadcastState } = require("../socket");

// GET /api/clock — the office clock every timestamp/alert is derived from
router.get("/", (req, res) => {
  res.json(getClockState());
});

// PATCH /api/clock — { time?: "HH:mm" | date string, speed?: number, reset?: true }
router.patch("/", (req, res) => {
  const body = req.body || {};
  if (body.time === undefined && body.speed === undefined && !body.reset) {
    return res.status(400).json({
      error: "bad-request",
      message: 'Provide at least one of {"time":"18:30"}, {"speed":60} or {"reset":true}.',
    });
  }

  const { state, error } = configureClock(body);
  if (error) {
    return res.status(400).json({ error: "bad-request", message: error });
  }

  // Time changes can flip after-hours/long-running conditions — repush everything.
  broadcastState();
  res.json(state);
});

module.exports = router;
