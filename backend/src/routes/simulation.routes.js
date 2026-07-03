const router = require("express").Router();
const { getSimulationState, setSimulationEnabled } = require("../services/simulationState");
const { broadcastState } = require("../socket");

// GET /api/simulation — is the simulator running, and how many auto/manual devices
router.get("/", (req, res) => {
  res.json(getSimulationState());
});

// PATCH /api/simulation — enable/disable the simulated device layer
router.patch("/", (req, res) => {
  const { enabled } = req.body || {};
  if (typeof enabled !== "boolean") {
    return res.status(400).json({
      error: "bad-request",
      message: 'Provide {"enabled":true|false}.',
    });
  }

  const state = setSimulationEnabled(enabled);
  broadcastState(); // let every client reflect the new toggle immediately
  res.json(state);
});

module.exports = router;
