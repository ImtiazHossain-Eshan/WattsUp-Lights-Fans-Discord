/**
 * Room configuration system — the one place that makes the three rooms
 * DIFFERENT while the device structure stays identical (2 fans + 3 lights).
 *
 * Every room-specific thing lives here: purpose, labels, accent, expected
 * usage, which furnished room of the low-poly GLB backs it, extra procedural
 * furniture, and where its five devices hang. OfficeLayout/Room3D/RoomCard
 * are fully generic — they just render whatever this config says.
 *
 * The GLB (public/models/low_poly_isometric_rooms.glb) contains 7 furnished
 * rooms as named groups (Room1..Room7). We borrow three purpose-matched ones:
 *   Room3 → sofa + coffee table + TV + plant  → Drawing Room (lounge)
 *   Room1 → PC setup + desk + shelves         → Work Room 1  (workspace)
 *   Room2 → desks + bookshelf + boards        → Work Room 2  (workspace, alt)
 * `hiddenNodes` prunes pieces that don't fit an office (Room1's bed).
 */

export const MODEL_URL = "/models/low_poly_isometric_rooms.glb";

export const ROOM_ORDER = ["Drawing Room", "Work Room 1", "Work Room 2"];

export const ROOM_FOOTPRINT = 3.4; // every extracted room is scaled to this width/depth
export const FAN_NAMES = ["Fan 1", "Fan 2"];
export const LIGHT_NAMES = ["Light 1", "Light 2", "Light 3"];

// Cluster arrangement (matches the marked reference structure): one room at the
// back-center, two rooms side by side in front — not three in a row.
const BACK_CENTER = [0, 0, -2.45];
const FRONT_LEFT = [-1.92, 0, 1.45];
const FRONT_RIGHT = [1.92, 0, 1.45];

export const roomConfigs = {
  "Drawing Room": {
    type: "waiting_area",
    label: "Drawing Room",
    subtitle: "Waiting / lounge area",
    furniture: ["sofa", "center table", "TV dresser", "plant", "wall frames", "rug"],
    layoutStyle: "lounge",
    expectedUsage: "low",
    accentColor: "#9ccf9a", // green/slate
    description: "Used occasionally by visitors or employees waiting.",
    scene: {
      modelNode: "Room3",
      hiddenNodes: [],
      rotationY: Math.PI / 2,
      position: BACK_CENTER,
      labelHeight: 3.0,
      // Ceiling devices arranged around the lounge seating area.
      deviceLayout: {
        "Fan 1": [-0.95, 2.45, -0.3],
        "Fan 2": [0.95, 2.45, 0.45],
        "Light 1": [-0.55, 1.85, -1.0],
        "Light 2": [0.1, 2.0, 0.1],
        "Light 3": [1.15, 1.85, -0.85],
      },
    },
  },

  "Work Room 1": {
    type: "workspace",
    label: "Work Room 1",
    subtitle: "Employee work area",
    furniture: ["desk", "chair", "PC setup", "wall shelves", "books", "whiteboard"],
    layoutStyle: "office-workspace",
    expectedUsage: "high",
    accentColor: "#8fb8ff", // blue/slate
    description: "Primary work area for employees.",
    scene: {
      modelNode: "Room1",
      hiddenNodes: ["Bed"], // it's an office, not a bedroom
      rotationY: Math.PI / 2,
      position: FRONT_LEFT,
      labelHeight: 3.0,
      // Lights over the desk wall, fans spread across the room.
      deviceLayout: {
        "Fan 1": [-0.5, 2.45, -0.5],
        "Fan 2": [0.8, 2.45, 0.6],
        "Light 1": [-1.0, 1.85, -0.6],
        "Light 2": [-1.0, 1.85, 0.55],
        "Light 3": [0.8, 1.9, -0.6],
      },
    },
  },

  "Work Room 2": {
    type: "workspace",
    label: "Work Room 2",
    subtitle: "Employee work area",
    furniture: ["desks", "chairs", "monitor", "bookshelf", "notice boards", "filing cabinet"],
    layoutStyle: "office-workspace-alt",
    expectedUsage: "high",
    accentColor: "#6fd6c3", // teal/slate
    description: "Second employee work area.",
    scene: {
      modelNode: "Room2",
      hiddenNodes: [],
      rotationY: Math.PI / 2,
      position: FRONT_RIGHT,
      labelHeight: 3.0,
      // Different ceiling arrangement from Work Room 1: a lighting row.
      deviceLayout: {
        "Fan 1": [-0.9, 2.45, 0.75],
        "Fan 2": [0.9, 2.45, -0.75],
        "Light 1": [-0.95, 1.85, -0.35],
        "Light 2": [0.0, 2.0, 0.05],
        "Light 3": [0.95, 1.85, 0.45],
      },
    },
  },
};
