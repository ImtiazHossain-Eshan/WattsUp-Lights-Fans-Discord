/**
 * Resolves user-friendly room aliases to canonical room names.
 * Accepts e.g. "drawing", "drawing-room", "Drawing Room", "work1",
 * "work-room-2", "WORK ROOM 1"... Returns null when nothing matches.
 */

const ROOM_ALIASES = {
  "Drawing Room": ["drawing", "drawing room", "drawing-room"],
  "Work Room 1": ["work1", "work 1", "work-room-1", "work room 1", "workroom 1"],
  "Work Room 2": ["work2", "work 2", "work-room-2", "work room 2", "workroom 2"],
};

const VALID_ROOM_NAMES = Object.keys(ROOM_ALIASES);

// Normalize: lowercase, treat "-", "_" and any whitespace run as a single space.
function normalize(value) {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, " ");
}

// Lookup table holds both spaced ("work room 1") and compact ("workroom1") forms,
// plus the canonical names themselves.
const LOOKUP = {};
for (const [canonical, aliases] of Object.entries(ROOM_ALIASES)) {
  for (const alias of [canonical, ...aliases]) {
    const spaced = normalize(alias);
    LOOKUP[spaced] = canonical;
    LOOKUP[spaced.replace(/ /g, "")] = canonical;
  }
}

function resolveRoomName(input) {
  if (typeof input !== "string" || input.trim() === "") return null;
  const spaced = normalize(input);
  return LOOKUP[spaced] || LOOKUP[spaced.replace(/ /g, "")] || null;
}

module.exports = { resolveRoomName, VALID_ROOM_NAMES, ROOM_ALIASES };
