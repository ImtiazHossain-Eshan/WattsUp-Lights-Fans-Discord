import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Clone, Html } from "@react-three/drei";
import * as THREE from "three";
import {
  DEVICE_LAYOUT,
  FAN_NAMES,
  LIGHT_NAMES,
  ROOM_FOOTPRINT,
} from "./scene3d.config.js";

/**
 * Pointer handlers that forward to the shared tooltip. The react-three-fiber
 * event object extends the DOM PointerEvent, so it carries clientX/clientY —
 * exactly what DeviceTooltip expects from the old CSS scene.
 */
function hoverHandlers(device, onDeviceHover) {
  return {
    onPointerOver: (e) => {
      e.stopPropagation();
      document.body.style.cursor = "pointer";
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
  };
}

/** Ceiling fan — blades spin while the device is ON, still when OFF. */
function Fan3D({ device, position, onDeviceHover }) {
  const on = device?.status === "on";
  const blades = useRef();

  useFrame((_, dt) => {
    if (on && blades.current) blades.current.rotation.y += dt * 7;
  });

  return (
    <group position={position} {...hoverHandlers(device, onDeviceHover)}>
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
function Light3D({ device, position, onDeviceHover }) {
  const on = device?.status === "on";

  return (
    <group position={position} {...hoverHandlers(device, onDeviceHover)}>
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
 * One room: a normalized GLB environment plus its five live devices and a
 * billboard label. The model is auto-scaled to ROOM_FOOTPRINT and dropped so
 * its floor sits at y=0, which keeps the device layout model-agnostic.
 */
export default function Room3D({
  name,
  modelUrl,
  rotationY = 0,
  position,
  devices,
  onDeviceHover,
}) {
  const { scene } = useGLTF(modelUrl);

  // Fit transform: scale to a common footprint, recenter X/Z, drop floor to y=0.
  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = ROOM_FOOTPRINT / Math.max(size.x, size.z);
    return {
      scale,
      offset: [-center.x * scale, -box.min.y * scale, -center.z * scale],
    };
  }, [scene]);

  const byName = useMemo(
    () => Object.fromEntries((devices || []).map((d) => [d.name, d])),
    [devices]
  );
  const roomPower = (devices || []).reduce((s, d) => s + d.currentPower, 0);

  return (
    <group position={position}>
      <group rotation={[0, rotationY, 0]}>
        <group position={fit.offset} scale={fit.scale}>
          <Clone object={scene} />
        </group>
      </group>

      {FAN_NAMES.map((n) => (
        <Fan3D
          key={n}
          device={byName[n]}
          position={DEVICE_LAYOUT[n]}
          onDeviceHover={onDeviceHover}
        />
      ))}
      {LIGHT_NAMES.map((n) => (
        <Light3D
          key={n}
          device={byName[n]}
          position={DEVICE_LAYOUT[n]}
          onDeviceHover={onDeviceHover}
        />
      ))}

      <Html position={[0, 3.05, 0]} center zIndexRange={[20, 0]}>
        <div className="room3d-label">
          <span className="room3d-label-name">{name}</span>
          <span className="room3d-label-power">{roomPower} W</span>
        </div>
      </Html>
    </group>
  );
}
