/**
 * Procedural furniture extras, chosen by roomConfig.layoutStyle.
 *
 * The GLB provides each room's furnished base (sofa/desks/shelves…); this
 * component adds the few required pieces the source rooms lack, so every room
 * hits its brief:
 *   lounge                → rug under the seating area
 *   office-workspace      → wall-mounted whiteboard (with marker strokes)
 *   office-workspace-alt  → extra workstation (desk + monitor) + filing cabinet
 *
 * Positions are in room-local space (the same frame as deviceLayout): the room
 * spans roughly ±1.7 on X/Z; after the room's rotation the local -Z and +X
 * sides carry the walls. FLOOR_TOP lifts pieces onto the GLB floor slab
 * (the fit puts the slab's *bottom* at y=0).
 */

const FLOOR_TOP = 0.3;

function Rug({ position = [0.1, 0, 0.35], radius = 0.95 }) {
  return (
    <mesh
      position={[position[0], 0.62, position[2]]} /* Room3 has a thick floor slab */
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <circleGeometry args={[radius, 28]} />
      <meshStandardMaterial color="#b0708c" roughness={0.95} />
    </mesh>
  );
}

/** Wall-mounted whiteboard with a tray and a few marker strokes. */
function Whiteboard({ position = [0, 1.5, -1.55], rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* frame + board */}
      <mesh>
        <boxGeometry args={[1.5, 0.85, 0.05]} />
        <meshStandardMaterial color="#c8cdd6" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.028]}>
        <boxGeometry args={[1.38, 0.73, 0.01]} />
        <meshStandardMaterial color="#f4f6f8" roughness={0.35} />
      </mesh>
      {/* marker strokes */}
      <mesh position={[-0.35, 0.18, 0.036]}>
        <boxGeometry args={[0.5, 0.035, 0.004]} />
        <meshStandardMaterial color="#5b8fd6" />
      </mesh>
      <mesh position={[-0.25, 0.04, 0.036]}>
        <boxGeometry args={[0.7, 0.035, 0.004]} />
        <meshStandardMaterial color="#c96f6f" />
      </mesh>
      <mesh position={[0.3, -0.18, 0.036]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[0.35, 0.035, 0.004]} />
        <meshStandardMaterial color="#67a985" />
      </mesh>
      {/* marker tray */}
      <mesh position={[0, -0.47, 0.05]}>
        <boxGeometry args={[0.7, 0.04, 0.09]} />
        <meshStandardMaterial color="#9aa1ad" />
      </mesh>
    </group>
  );
}

/** Compact workstation: simple desk with a glowing monitor on top. */
function Workstation({ position = [0, 0, 0], rotationY = 0 }) {
  return (
    <group position={[position[0], FLOOR_TOP, position[2]]} rotation={[0, rotationY, 0]}>
      {/* desk top + side panels */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[1.0, 0.06, 0.55]} />
        <meshStandardMaterial color="#8a5a3e" roughness={0.7} />
      </mesh>
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} position={[x, 0.35, 0]}>
          <boxGeometry args={[0.06, 0.7, 0.5]} />
          <meshStandardMaterial color="#7a4e36" roughness={0.7} />
        </mesh>
      ))}
      {/* monitor: foot, stand, panel, glowing screen */}
      <group position={[0, 0.73, -0.08]}>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 0.03, 16]} />
          <meshStandardMaterial color="#3a3f4a" />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[0.05, 0.18, 0.04]} />
          <meshStandardMaterial color="#3a3f4a" />
        </mesh>
        <mesh position={[0, 0.32, 0]}>
          <boxGeometry args={[0.52, 0.32, 0.035]} />
          <meshStandardMaterial color="#2b2f38" />
        </mesh>
        <mesh position={[0, 0.32, 0.02]}>
          <boxGeometry args={[0.47, 0.27, 0.005]} />
          <meshStandardMaterial
            color="#bfe0ff"
            emissive="#7fb4e8"
            emissiveIntensity={0.55}
            roughness={0.3}
          />
        </mesh>
      </group>
    </group>
  );
}

/** Three-drawer filing cabinet. */
function FilingCabinet({ position = [0, 0, 0], rotationY = 0 }) {
  const drawers = [0.2, 0.55, 0.9];
  return (
    <group position={[position[0], FLOOR_TOP, position[2]]} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.52, 1.1, 0.56]} />
        <meshStandardMaterial color="#5f6b80" roughness={0.55} metalness={0.25} />
      </mesh>
      {drawers.map((y) => (
        <group key={y}>
          <mesh position={[0, y, 0.285]}>
            <boxGeometry args={[0.46, 0.28, 0.02]} />
            <meshStandardMaterial color="#6e7a90" roughness={0.5} metalness={0.25} />
          </mesh>
          <mesh position={[0, y + 0.08, 0.3]}>
            <boxGeometry args={[0.18, 0.03, 0.02]} />
            <meshStandardMaterial color="#c8cdd6" metalness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Extra furniture per layout style; positions tuned per source room. */
export default function RoomFurniture({ layoutStyle }) {
  switch (layoutStyle) {
    case "lounge":
      return <Rug position={[0.45, 0, 0.85]} radius={0.7} />;
    case "office-workspace":
      return <Whiteboard position={[0.55, 1.5, -1.5]} />;
    case "office-workspace-alt":
      return (
        <group>
          {/* extra workstation on the open side, facing into the room */}
          <Workstation position={[-0.75, 0, 0.85]} rotationY={Math.PI * 0.9} />
          <FilingCabinet position={[0.45, 0, -1.3]} rotationY={0} />
        </group>
      );
    default:
      return null;
  }
}
