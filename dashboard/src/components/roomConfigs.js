/**
 * Room configuration system — the one place that makes the three rooms
 * DIFFERENT while the device structure stays identical (2 fans + 3 lights).
 *
 * The rooms are built procedurally (RoomShell in Room3D + RoomFurniture):
 * colored two-wall shells in the low-poly isometric style, tiled edge-to-edge
 * like a honeycomb — one room back-center straddling the seam of the two rooms
 * in front (the marked reference structure). No GLB dependency: we control the
 * office look, the footprint and the palette entirely from this file.
 *
 * Every room-specific thing lives here: purpose, labels, accent, expected
 * usage, wall/floor palette, furniture layout style, and where its five
 * devices hang. OfficeLayout/Room3D/RoomCard are fully generic — they just
 * render whatever this config says.
 */

export const ROOM_ORDER = ["Drawing Room", "Work Room 1", "Work Room 2"];

export const ROOM_SIZE = 4.6; // floor width/depth of every room (world units)
export const WALL_HEIGHT = 2.2; // low walls so interiors read from the iso camera
export const WALL_THICKNESS = 0.14;

export const FAN_NAMES = ["Fan 1", "Fan 2"];
export const LIGHT_NAMES = ["Light 1", "Light 2", "Light 3"];

// Honeycomb tiling — every room has walls on its -X and -Z edges. The back
// room sits at the grid origin; the two front rooms are its +Z and +X grid
// neighbors, which the iso camera (looking down the +X/+Z diagonal) renders
// as one room top-center with two rooms flanking it below — the marked
// reference structure. The back room is RAISED one wall-height (like the
// reference render): the front rooms' back walls become its pedestal, so its
// interior stays fully visible instead of hiding behind them. Room3D draws a
// matching plinth under any elevated room.
const HALF = ROOM_SIZE / 2;
const BACK_CENTER = [-HALF, WALL_HEIGHT, -HALF]; // raised, screen top-center
const FRONT_LEFT = [-HALF, 0, HALF]; // +Z neighbor → screen down-left
const FRONT_RIGHT = [HALF, 0, -HALF]; // +X neighbor → screen down-right

export const roomConfigs = {
  "Drawing Room": {
    type: "waiting_area",
    label: "Drawing Room",
    subtitle: "Waiting / lounge area",
    furniture: ["sofa", "coffee table", "rug", "plants", "wall frames"],
    layoutStyle: "lounge",
    expectedUsage: "low",
    accentColor: "#f0a24b", // warm amber — cozy lounge identity
    description: "Used occasionally by visitors or employees waiting.",
    scene: {
      position: BACK_CENTER,
      palette: {
        wall: "#c1793f", // warm terracotta — a cozy waiting room
        wallSide: "#a9642f",
        floor: "#9c6c42",
        trim: "#f4ede1",
      },
      window: { wall: "z", offset: 1.35 }, // night window on the outer back wall
      // Ceiling devices spread over the seating area.
      deviceLayout: {
        "Fan 1": [1.05, 1.82, -0.95],
        "Fan 2": [-0.9, 1.82, 1.0],
        "Light 1": [-0.95, 1.62, -0.95],
        "Light 2": [0.15, 1.7, 0.15],
        "Light 3": [1.15, 1.62, 1.15],
      },
    },
  },

  "Work Room 1": {
    type: "workspace",
    label: "Work Room 1",
    subtitle: "Employee work area",
    furniture: ["desks", "chairs", "monitors", "whiteboard", "plant"],
    layoutStyle: "office-workspace",
    expectedUsage: "high",
    accentColor: "#ec6a5e", // warm red — primary workspace identity
    description: "Primary work area for employees.",
    scene: {
      position: FRONT_LEFT,
      palette: {
        wall: "#a2413a", // deep brick red — the busy primary workspace
        wallSide: "#89352f",
        floor: "#93603b",
        trim: "#f4ede1",
      },
      window: { wall: "x", offset: -1.2 }, // night window on the outer side wall
      // Lights over the desk row along the back wall, fans across the room.
      deviceLayout: {
        "Fan 1": [-0.45, 1.82, 0.95],
        "Fan 2": [1.15, 1.82, -0.55],
        "Light 1": [-1.05, 1.62, -1.0],
        "Light 2": [0.35, 1.62, -1.0],
        "Light 3": [0.35, 1.7, 0.95],
      },
    },
  },

  "Work Room 2": {
    type: "workspace",
    label: "Work Room 2",
    subtitle: "Employee work area",
    furniture: ["desks", "chairs", "bookshelf", "notice board", "filing cabinet"],
    layoutStyle: "office-workspace-alt",
    expectedUsage: "high",
    accentColor: "#a78bfa", // violet — second workspace identity
    description: "Second employee work area, different arrangement.",
    scene: {
      position: FRONT_RIGHT,
      palette: {
        wall: "#6b4a86", // muted violet — the alternate workspace
        wallSide: "#593c70",
        floor: "#8c5f3d",
        trim: "#f4ede1",
      },
      // no window — its back wall carries the bookshelf + notice board
      // L-shaped desk arrangement → lights follow the two desk walls.
      deviceLayout: {
        "Fan 1": [1.0, 1.82, 0.95],
        "Fan 2": [-0.85, 1.82, -0.2],
        "Light 1": [-0.2, 1.62, -1.05],
        "Light 2": [-1.05, 1.62, 0.75],
        "Light 3": [1.05, 1.7, -0.1],
      },
    },
  },
};
