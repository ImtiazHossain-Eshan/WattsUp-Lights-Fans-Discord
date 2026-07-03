import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  OrthographicCamera,
  ContactShadows,
  Center,
} from "@react-three/drei";
import Room3D from "./Room3D.jsx";
import { ROOM_ORDER, roomConfigs } from "./roomConfigs.js";

/**
 * The live 3D office. Groups the backend devices by room, looks up each room's
 * config, and renders one generic <Room3D> per room — no hardcoded per-room
 * components. The rooms are procedural shells tiled edge-to-edge in a
 * honeycomb (one back-center, two in front — the marked reference structure);
 * the arrangement lives in roomConfigs.js. Every visual state still comes
 * straight from backend `devices`.
 */
export default function OfficeLayout({ devices, busy, onDeviceHover, onDeviceToggle }) {
  const clearTooltip = () => onDeviceHover(null, null);

  return (
    <div className="scene-wrap">
      <div className="scene-backdrop" aria-hidden="true" />

      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        style={{ position: "absolute", inset: 0 }}
        onPointerMissed={clearTooltip}
      >
        {/* steep-ish iso view so interiors stay visible over the front walls */}
        <OrthographicCamera
          makeDefault
          position={[8, 14, 8]}
          zoom={64}
          near={0.1}
          far={100}
        />

        <ambientLight intensity={0.65} />
        <hemisphereLight args={["#e4e9f0", "#2a2f38", 0.55]} />
        <directionalLight
          position={[6, 12, 5]}
          intensity={1.0}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />

        {/* Center X/Z so the honeycomb always sits dead-center regardless of
            viewport width (keeps Y — the raised back room stays elevated). */}
        <Center disableY>
          {ROOM_ORDER.map((name) => (
            <Room3D
              key={name}
              name={name}
              config={roomConfigs[name]}
              devices={devices.filter((d) => d.room === name)}
              busy={busy}
              onDeviceHover={onDeviceHover}
              onDeviceToggle={onDeviceToggle}
            />
          ))}
        </Center>

        <ContactShadows
          position={[0, -0.17, 0]}
          scale={30}
          blur={2.5}
          opacity={0.45}
          far={6}
        />

        <OrbitControls
          makeDefault
          target={[0, 2.7, 0]}
          enablePan={false}
          minPolarAngle={0.15}
          maxPolarAngle={Math.PI / 2.4}
          minZoom={28}
          maxZoom={110}
        />
      </Canvas>

      <p className="scene-caption">
        Live 3D office — each room styled for its purpose · drag to orbit · click a
        fan or light to toggle it (manual) · hover for details
      </p>
    </div>
  );
}
