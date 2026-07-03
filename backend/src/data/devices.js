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

const ROOMS = [
  { name: "Drawing Room", slug: "drawing-room", description: "Waiting area" },
  { name: "Work Room 1", slug: "work-room-1", description: "Employee work area" },
  { name: "Work Room 2", slug: "work-room-2", description: "Employee work area" },
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

// The live store. Only the simulator mutates it; everything else reads it.
const devices = createInitialDevices();

module.exports = { devices, createInitialDevices, ROOMS, WATTAGE };
