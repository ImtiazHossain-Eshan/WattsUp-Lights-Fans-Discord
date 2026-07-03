import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  OrthographicCamera,
  ContactShadows,
  Html,
  useGLTF,
} from "@react-three/drei";
import Room3D from "./Room3D.jsx";
import { MODEL_URL, ROOM_ORDER, roomConfigs } from "./roomConfigs.js";

// Warm-load the shared room model so first render never blocks on a fetch.
useGLTF.preload(MODEL_URL);

/**
 * The live 3D office. Groups the backend devices by room, looks up each room's
 * config, and renders one generic <Room3D> per room — no hardcoded per-room
 * components. The cluster arrangement (one room back-center, two in front)
 * follows the marked reference structure and lives in roomConfigs.js.
 * Every visual state still comes straight from backend `devices`.
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
        <OrthographicCamera
          makeDefault
          position={[8.5, 11, 10]}
          zoom={58}
          near={0.1}
          far={100}
        />

        <ambientLight intensity={0.6} />
        <hemisphereLight args={["#ffd9b0", "#241019", 0.5]} />
        <directionalLight
          position={[6, 12, 5]}
          intensity={1.0}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />

        <Suspense
          fallback={
            <Html center>
              <div className="scene3d-loading">Loading office…</div>
            </Html>
          }
        >
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

          <ContactShadows
            position={[0, 0.01, 0]}
            scale={26}
            blur={2.5}
            opacity={0.5}
            far={6}
          />
        </Suspense>

        <OrbitControls
          makeDefault
          target={[0, 0.9, -0.2]}
          enablePan={false}
          minPolarAngle={0.15}
          maxPolarAngle={Math.PI / 2.15}
          minZoom={30}
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
