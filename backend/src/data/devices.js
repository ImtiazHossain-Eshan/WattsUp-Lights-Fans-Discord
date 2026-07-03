/**
 * Fixed office topology — the single in-memory device store (source of truth).
 *
 * 3 rooms x (2 fans + 3 lights) = 15 devices.
 *
 * NOTE ON THE PDF CONTRADICTION: the problem statement lists 2 fans + 3 lights
 * per room (= 15 devices) but elsewhere says "18 devices". Since only 5 devices
 * per room are actually defined, this implementation uses exactly 15 devices.
 */

const WATTAGE = { fan: 60, light: 15 };

/**
 * Room identities. Same device structure everywhere (2 fans + 3 lights), but
 * different purposes — which drives the dashboard visuals AND the simulator:
 *
 * `simulation` is the probability a device in this room *wants* to be ON when
 * the simulator inspects it (per office-hours vs after-hours). Work rooms run
 * hot during the day; the drawing room is only used occasionally by visitors.
 */
const ROOMS = [
  {
    name: "Drawing Room",
    slug: "drawing-room",
    description: "Waiting / lounge area",
    type: "waiting_area",
    expectedUsage: "low",
    simulation: { officeHours: 0.3, afterHours: 0.05 },
  },
  {
    name: "Work Room 1",
    slug: "work-room-1",
    description: "Employee work area",
    type: "workspace",
    expectedUsage: "high",
    simulation: { officeHours: 0.75, afterHours: 0.08 },
  },
  {
    name: "Work Room 2",
    slug: "work-room-2",
    description: "Employee work area",
    type: "workspace",
    expectedUsage: "high",
    simulation: { officeHours: 0.65, afterHours: 0.08 },
  },
];

// Realistic mixed starting pattern (8 of 15 devices ON) — not all ON, not all OFF.
const INITIAL_STATE = {
  "drawing-room": { "fan-1": true, "fan-2": false, "light-1": true, "light-2": true, "light-3": false },
  "work-room-1": { "fan-1": true, "fan-2": true, "light-1": true, "light-2": false, "light-3": true },
  "work-room-2": { "fan-1": false, "fan-2": false, "light-1": true, "light-2": false, "light-3": false },
};

function createInitialDevices() {
  const now = new Date().toISOString();
  const devices = [];

  for (const room of ROOMS) {
    for (const [type, count] of [["fan", 2], ["light", 3]]) {
      for (let i = 1; i <= count; i++) {
        const key = `${type}-${i}`;
        const isOn = Boolean(INITIAL_STATE[room.slug][key]);
        devices.push({
          id: `${room.slug}-${key}`,
          name: `${type === "fan" ? "Fan" : "Light"} ${i}`,
          type,
          room: room.name,
          status: isOn ? "on" : "off",
          // "auto" → the simulator may toggle it; "manual" → only a user can.
          // Everything starts in auto so the simulation animates out of the box.
          controlMode: "auto",
          wattage: WATTAGE[type],
          currentPower: isOn ? WATTAGE[type] : 0,
          lastChanged: now,
          turnedOnAt: isOn ? now : null,
        });
      }
    }
  }

  return devices;
}

// The live store (source of truth). Mutated only by the simulator (auto devices)
// and the manual-control routes via deviceService; everything else reads it.
const devices = createInitialDevices();

module.exports = { devices, createInitialDevices, ROOMS, WATTAGE };
