/**
 * Configuration for the Three.js office scene.
 *
 * The GLB room models are decorative environments; the live devices (fans +
 * lights) are drawn procedurally on top at fixed local positions so their
 * glow/spin stays 100% driven by the backend device objects — exactly like the
 * old CSS scene, just rendered with real 3D geometry.
 */

export const ROOM_ORDER = ["Drawing Room", "Work Room 1", "Work Room 2"];

// Which GLB backs each room + how to orient it. Every model is normalized to a
// common footprint at load time, so any room-ish model drops in here; rotationY
// (radians) turns its open/cutaway side toward the camera.
// room-iso (Jason's Isometric Room) is a compact, well-modelled room that
// normalizes cleanly. The living-room/game-room .blend exports each bake in a
// huge ground plane, so scaling them to this footprint shrinks their furniture
// to specks — trim that floor plane in Blender before dropping one in here.
export const ROOMS = {
  "Drawing Room": { url: "/models/room-iso.glb", rotationY: 0 },
  "Work Room 1": { url: "/models/room-iso.glb", rotationY: 0 },
  "Work Room 2": { url: "/models/room-iso.glb", rotationY: 0 },
};

export const ROOM_SPACING = 4.4; // distance between room centers along X
export const ROOM_FOOTPRINT = 3.4; // every model is scaled to this width/depth

// Device positions inside a normalized room: centered on X/Z, floor at y=0,
// ceiling near y≈2.5. Fans hang high; lights are pendant lamps near the ceiling.
export const DEVICE_LAYOUT = {
  "Fan 1": [-0.95, 2.35, -0.35],
  "Fan 2": [0.95, 2.35, -0.35],
  "Light 1": [-1.05, 2.05, 0.85],
  "Light 2": [0.0, 2.25, 0.05],
  "Light 3": [1.05, 2.05, 0.85],
};

export const FAN_NAMES = ["Fan 1", "Fan 2"];
export const LIGHT_NAMES = ["Light 1", "Light 2", "Light 3"];
