import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import RoomFurniture from "./RoomFurniture.jsx";
import {
  ROOM_SIZE,
  WALL_HEIGHT,
  WALL_THICKNESS,
  FAN_NAMES,
  LIGHT_NAMES,
} from "./roomConfigs.js";

// Shared across all devices: remembers where a press started so we can tell a
// click (toggle the device) from a drag (orbit the camera). Module-level is fine
// — only one pointer interaction happens at a time.
const pressStart = { x: 0, y: 0, id: null };
const CLICK_SLOP = 6; // px of movement still counted as a click

/**
 * Pointer handlers that forward hover to the shared tooltip AND turn a genuine
 * click (not an orbit drag) into a manual device toggle. The react-three-fiber
 * event object extends the DOM PointerEvent, so it carries clientX/clientY —
 * exactly what DeviceTooltip expects.
 */
function deviceHandlers(device, { onDeviceHover, onDeviceToggle, busy }) {
  return {
    onPointerOver: (e) => {
      e.stopPropagation();
      document.body.style.cursor = busy ? "wait" : "pointer";
      onDeviceHover(device, e);
    },
    onPointerMove: (e) => {
      e.stopPropagation();
      onDeviceHover(device, e);
    },
    onPointerOut: (e) => {
      e.stopPropagation();
      document.body.style.cursor = "";
      onDeviceHover(null, null);
    },
    onPointerDown: (e) => {
      pressStart.x = e.clientX;
      pressStart.y = e.clientY;
      pressStart.id = device?.id ?? null;
    },
    onPointerUp: (e) => {
      const moved = Math.hypot(e.clientX - pressStart.x, e.clientY - pressStart.y);
      const isClick = pressStart.id === device?.id && moved < CLICK_SLOP;
      pressStart.id = null;
      if (!isClick || busy || !device || !onDeviceToggle) return;
      e.stopPropagation();
      onDeviceToggle(device.id);
    },
  };
}

// Devices are drawn slightly larger than life so they read clearly.
const DEVICE_SCALE = 1.15;

/** Ceiling fan — blades spin while the device is ON, still when OFF. */
function Fan3D({ device, position, handlers }) {
  const on = device?.status === "on";
  const blades = useRef();

  useFrame((_, dt) => {
    if (on && blades.current) blades.current.rotation.y += dt * 7;
  });

  return (
    <group position={position} scale={DEVICE_SCALE} {...handlers(device)}>
      {/* down-rod */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.36, 8]} />
        <meshStandardMaterial color="#3b3f4a" />
      </mesh>
      {/* motor housing */}
      <mesh>
        <cylinderGeometry args={[0.11, 0.09, 0.1, 20]} />
        <meshStandardMaterial
          color={on ? "#7fd6d0" : "#59606e"}
          emissive={on ? "#1f8f88" : "#000000"}
          emissiveIntensity={on ? 0.4 : 0}
          metalness={0.3}
          roughness={0.5}
        />
      </mesh>
      {/* blades */}
      <group ref={blades} position={[0, -0.02, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <group key={i} rotation={[0, (i * Math.PI) / 2, 0]}>
            <mesh position={[0.32, 0, 0]}>
              <boxGeometry args={[0.6, 0.02, 0.15]} />
              <meshStandardMaterial color={on ? "#e9f6f4" : "#8a90a0"} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/** Pendant lamp — warm emissive glow + a real point light while ON. */
function Light3D({ device, position, handlers }) {
  const on = device?.status === "on";

  return (
    <group position={position} scale={DEVICE_SCALE} {...handlers(device)}>
      {/* cord */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.4, 6]} />
        <meshStandardMaterial color="#2b2e36" />
      </mesh>
      {/* shade */}
      <mesh position={[0, 0, 0]}>
        <coneGeometry args={[0.17, 0.18, 22, 1, true]} />
        <meshStandardMaterial
          color={on ? "#f6d99f" : "#666c7a"}
          emissive={on ? "#ffcf7a" : "#000000"}
          emissiveIntensity={on ? 0.55 : 0}
          side={THREE.DoubleSide}
          roughness={0.6}
        />
      </mesh>
      {/* bulb */}
      <mesh position={[0, -0.06, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial
          color={on ? "#fff2cf" : "#3a3f4a"}
          emissive={on ? "#ffd591" : "#000000"}
          emissiveIntensity={on ? 2.2 : 0}
        />
      </mesh>
      {on && (
        <pointLight
          position={[0, -0.12, 0]}
          color="#ffcf85"
          intensity={2.4}
          distance={2.8}
          decay={2}
        />
      )}
    </group>
  );
}

const HALF = ROOM_SIZE / 2;
const T = WALL_THICKNESS;

/**
 * Procedural room shell in the low-poly isometric style: floor slab + two
 * walls on the -X/-Z edges (so the camera looks into the open corner), white
 * trim caps, a door on the -X wall and an optional night window. Two wall
 * tones per room (like the reference render) come from the config palette.
 */
function RoomShell({ palette, window: win, elevation = 0 }) {
  return (
    <group>
      {/* floor slab (top at y=0) */}
      <mesh position={[0, -0.08, 0]} receiveShadow>
        <boxGeometry args={[ROOM_SIZE, 0.16, ROOM_SIZE]} />
        <meshStandardMaterial color={palette.floor} roughness={0.85} />
      </mesh>

      {/* solid plinth down to the ground for raised rooms — reads as the
          building's facade continuing below the floor while orbiting */}
      {elevation > 0.2 && (
        <mesh position={[0, -(elevation + 0.16) / 2, 0]}>
          <boxGeometry args={[ROOM_SIZE, elevation - 0.16, ROOM_SIZE]} />
          <meshStandardMaterial color={palette.wallSide} roughness={0.9} />
        </mesh>
      )}

      {/* back wall (-Z) + trim cap */}
      <mesh position={[0, WALL_HEIGHT / 2, -HALF + T / 2]} receiveShadow>
        <boxGeometry args={[ROOM_SIZE, WALL_HEIGHT, T]} />
        <meshStandardMaterial color={palette.wall} roughness={0.9} />
      </mesh>
      <mesh position={[0, WALL_HEIGHT + 0.035, -HALF + T / 2]}>
        <boxGeometry args={[ROOM_SIZE + 0.04, 0.07, T + 0.06]} />
        <meshStandardMaterial color={palette.trim} roughness={0.6} />
      </mesh>

      {/* side wall (-X) + trim cap */}
      <mesh position={[-HALF + T / 2, WALL_HEIGHT / 2, 0]} receiveShadow>
        <boxGeometry args={[T, WALL_HEIGHT, ROOM_SIZE]} />
        <meshStandardMaterial color={palette.wallSide} roughness={0.9} />
      </mesh>
      <mesh position={[-HALF + T / 2, WALL_HEIGHT + 0.035, 0]}>
        <boxGeometry args={[T + 0.06, 0.07, ROOM_SIZE + 0.04]} />
        <meshStandardMaterial color={palette.trim} roughness={0.6} />
      </mesh>

      {/* door on the -X wall (offices have doors) */}
      <group position={[-HALF + T + 0.015, 0, 1.7]}>
        <mesh position={[0, 0.85, 0]}>
          <boxGeometry args={[0.03, 1.7, 0.92]} />
          <meshStandardMaterial color={palette.trim} roughness={0.6} />
        </mesh>
        <mesh position={[0.012, 0.82, 0]}>
          <boxGeometry args={[0.03, 1.56, 0.78]} />
          <meshStandardMaterial color="#8a5a3e" roughness={0.7} />
        </mesh>
        <mesh position={[0.035, 0.85, 0.28]}>
          <sphereGeometry args={[0.035, 10, 8]} />
          <meshStandardMaterial color="#e0c088" metalness={0.5} roughness={0.4} />
        </mesh>
      </group>

      {/* optional night window (config-placed on either wall) */}
      {win && (
        <group
          position={
            win.wall === "x"
              ? [-HALF + T + 0.015, 1.45, win.offset]
              : [win.offset, 1.45, -HALF + T + 0.015]
          }
          rotation={[0, win.wall === "x" ? Math.PI / 2 : 0, 0]}
        >
          <mesh>
            <boxGeometry args={[1.25, 0.9, 0.05]} />
            <meshStandardMaterial color={palette.trim} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0, 0.01]}>
            <boxGeometry args={[1.11, 0.76, 0.05]} />
            <meshStandardMaterial
              color="#2b3a5e"
              emissive="#3a5a8e"
              emissiveIntensity={0.25}
              roughness={0.3}
            />
          </mesh>
          {/* cross mullions */}
          <mesh position={[0, 0, 0.032]}>
            <boxGeometry args={[0.05, 0.76, 0.01]} />
            <meshStandardMaterial color={palette.trim} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0, 0.032]}>
            <boxGeometry args={[1.11, 0.05, 0.01]} />
            <meshStandardMaterial color={palette.trim} roughness={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
}

/**
 * One room, fully driven by its roomConfig:
 *  - a procedural office shell (walls/floor in the room's palette)
 *  - the config's furniture set (RoomFurniture, by layoutStyle)
 *  - the five live devices at the config's ceiling layout
 *  - a compact wall-corner sign with name + live wattage
 */
export default function Room3D({
  name,
  config,
  devices,
  busy,
  onDeviceHover,
  onDeviceToggle,
}) {
  const sceneCfg = config.scene;

  // One factory shared by every device in this room; `handlers(device)` binds it.
  const handlers = (device) =>
    deviceHandlers(device, { onDeviceHover, onDeviceToggle, busy });

  const byName = useMemo(
    () => Object.fromEntries((devices || []).map((d) => [d.name, d])),
    [devices]
  );
  const roomPower = (devices || []).reduce((s, d) => s + d.currentPower, 0);
  const layout = sceneCfg.deviceLayout;

  return (
    <group position={sceneCfg.position}>
      <RoomShell
        palette={sceneCfg.palette}
        window={sceneCfg.window}
        elevation={sceneCfg.position[1]}
      />
      <RoomFurniture layoutStyle={config.layoutStyle} />

      {FAN_NAMES.map((n) => (
        <Fan3D key={n} device={byName[n]} position={layout[n]} handlers={handlers} />
      ))}
      {LIGHT_NAMES.map((n) => (
        <Light3D key={n} device={byName[n]} position={layout[n]} handlers={handlers} />
      ))}

      {/* compact sign perched on the back wall — name + live wattage */}
      <Html position={[0, WALL_HEIGHT + 0.42, -HALF + 0.2]} center zIndexRange={[20, 0]}>
        <div
          className={`room3d-sign ${roomPower > 0 ? "is-live" : ""}`}
          style={{ "--accent": config.accentColor }}
        >
          <span className="room3d-sign-dot" aria-hidden="true" />
          <strong className="room3d-sign-name">{name}</strong>
          <span className="room3d-sign-power">{roomPower} W</span>
        </div>
      </Html>
    </group>
  );
}
