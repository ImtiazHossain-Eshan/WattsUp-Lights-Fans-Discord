import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import RoomFurniture from "./RoomFurniture.jsx";
import { MODEL_URL, ROOM_FOOTPRINT, FAN_NAMES, LIGHT_NAMES } from "./roomConfigs.js";

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

// Devices are drawn slightly larger than life so they read clearly on top of
// the busy low-poly rooms.
const DEVICE_SCALE = 1.3;

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

/**
 * One room, fully driven by its roomConfig:
 *  - extracts the config's named room group from the shared low-poly GLB
 *    (pruning `hiddenNodes`), normalized to ROOM_FOOTPRINT with floor at y=0
 *  - adds the config's procedural furniture extras (RoomFurniture)
 *  - draws the five live devices at the config's ceiling layout
 *  - billboard label with name, purpose subtitle and live wattage
 */
export default function Room3D({
  name,
  config,
  devices,
  busy,
  onDeviceHover,
  onDeviceToggle,
}) {
  const { scene } = useGLTF(MODEL_URL);
  const sceneCfg = config.scene;

  // Extract + prep this room's sub-scene once. We bake the source node's world
  // matrix into the clone so it keeps the exact orientation it has inside the
  // GLB (Sketchfab wraps models in rotated/scaled ancestor nodes).
  const roomObject = useMemo(() => {
    scene.updateMatrixWorld(true);
    const src = scene.getObjectByName(sceneCfg.modelNode);
    if (!src) return null;

    const cloned = src.clone(true);
    cloned.matrix.copy(src.matrixWorld);
    cloned.matrix.decompose(cloned.position, cloned.quaternion, cloned.scale);

    for (const nodeName of sceneCfg.hiddenNodes || []) {
      const n = cloned.getObjectByName(nodeName);
      if (n) n.removeFromParent(); // removed (not just hidden) so it can't skew the fit box
    }
    return cloned;
  }, [scene, sceneCfg]);

  // Fit transform: scale to the common footprint, recenter X/Z, floor at y=0.
  const fit = useMemo(() => {
    if (!roomObject) return { scale: 1, offset: [0, 0, 0] };
    const box = new THREE.Box3().setFromObject(roomObject);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = ROOM_FOOTPRINT / Math.max(size.x, size.z);
    return {
      scale,
      offset: [-center.x * scale, -box.min.y * scale, -center.z * scale],
    };
  }, [roomObject]);

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
      <group rotation={[0, sceneCfg.rotationY || 0, 0]}>
        {roomObject && (
          <group position={fit.offset} scale={fit.scale}>
            <primitive object={roomObject} />
          </group>
        )}

        <RoomFurniture layoutStyle={config.layoutStyle} />

        {FAN_NAMES.map((n) => (
          <Fan3D key={n} device={byName[n]} position={layout[n]} handlers={handlers} />
        ))}
        {LIGHT_NAMES.map((n) => (
          <Light3D key={n} device={byName[n]} position={layout[n]} handlers={handlers} />
        ))}
      </group>

      <Html position={[0, sceneCfg.labelHeight, 0]} center zIndexRange={[20, 0]}>
        <div className="room3d-label" style={{ borderColor: `${config.accentColor}55` }}>
          <span className="room3d-label-name">{name}</span>
          <span className="room3d-label-sub">{config.subtitle}</span>
          <span className="room3d-label-power">{roomPower} W</span>
        </div>
      </Html>
    </group>
  );
}
