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
import { ROOM_ORDER, ROOMS, ROOM_SPACING } from "./scene3d.config.js";

// Warm-load every unique room model so switching data never blocks on a fetch.
[...new Set(ROOM_ORDER.map((n) => ROOMS[n].url))].forEach((url) =>
  useGLTF.preload(url)
);

/**
 * Cozy isometric office — real 3D (react-three-fiber + drei) loading GLB room
 * models, with live fans and lights drawn on top. Every visual state still
 * comes straight from the backend `devices`; the scene never invents data.
 */
export default function OfficeScene3D({ devices, onDeviceHover }) {
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
          position={[9, 8, 11]}
          zoom={58}
          near={0.1}
          far={100}
        />

        <ambientLight intensity={0.55} />
        <hemisphereLight args={["#ffd9b0", "#241019", 0.5]} />
        <directionalLight
          position={[6, 11, 4]}
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
          {ROOM_ORDER.map((name, i) => (
            <Room3D
              key={name}
              name={name}
              modelUrl={ROOMS[name].url}
              rotationY={ROOMS[name].rotationY}
              position={[(i - 1) * ROOM_SPACING, 0, 0]}
              devices={devices.filter((d) => d.room === name)}
              onDeviceHover={onDeviceHover}
            />
          ))}

          <ContactShadows
            position={[0, 0.01, 0]}
            scale={22}
            blur={2.6}
            opacity={0.5}
            far={6}
          />
        </Suspense>

        <OrbitControls
          makeDefault
          target={[0, 1.1, 0]}
          enablePan={false}
          minPolarAngle={0.15}
          maxPolarAngle={Math.PI / 2.15}
          minZoom={32}
          maxZoom={120}
        />
      </Canvas>

      <p className="scene-caption">
        Live 3D office — drag to orbit · lights glow &amp; fans spin with the
        simulation · hover a device for details
      </p>
    </div>
  );
}
