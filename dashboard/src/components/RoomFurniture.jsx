/**
 * Procedural office furniture, chosen by roomConfig.layoutStyle.
 *
 * The rooms are procedural shells (Room3D), so ALL furniture comes from here —
 * a few clear, low-poly pieces per room, enough to sell each room's purpose
 * without clutter:
 *   lounge                → sofa + coffee table + rug + plants + wall frames
 *   office-workspace      → two desks with glowing monitors + chairs + whiteboard
 *   office-workspace-alt  → L-shaped desks + bookshelf + notice board + cabinet
 *
 * Positions are in room-local space (the same frame as deviceLayout): the room
 * spans ±ROOM_SIZE/2 on X/Z with walls on the -X and -Z edges (inner faces at
 * about ±2.16 for ROOM_SIZE 4.6). The floor top sits at y=0.
 */

function Workstation({ position = [0, 0, 0], rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* desk top + side panels */}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[1.15, 0.06, 0.6]} />
        <meshStandardMaterial color="#8a5a3e" roughness={0.7} />
      </mesh>
      {[-0.52, 0.52].map((x) => (
        <mesh key={x} position={[x, 0.36, 0]}>
          <boxGeometry args={[0.06, 0.72, 0.55]} />
          <meshStandardMaterial color="#7a4e36" roughness={0.7} />
        </mesh>
      ))}
      {/* monitor: foot, stand, panel, glowing screen (faces +Z, into the room) */}
      <group position={[0, 0.75, -0.12]}>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 0.03, 16]} />
          <meshStandardMaterial color="#3a3f4a" />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[0.05, 0.18, 0.04]} />
          <meshStandardMaterial color="#3a3f4a" />
        </mesh>
        <mesh position={[0, 0.33, 0]}>
          <boxGeometry args={[0.56, 0.34, 0.035]} />
          <meshStandardMaterial color="#2b2f38" />
        </mesh>
        <mesh position={[0, 0.33, 0.021]}>
          <boxGeometry args={[0.5, 0.28, 0.005]} />
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

/** Swivel office chair: disc base, column, seat, backrest (back at local -Z). */
function OfficeChair({ position = [0, 0, 0], rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.24, 0.26, 0.05, 14]} />
        <meshStandardMaterial color="#3a3f4a" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.38, 10]} />
        <meshStandardMaterial color="#59606e" metalness={0.35} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.46, 0]}>
        <boxGeometry args={[0.44, 0.08, 0.44]} />
        <meshStandardMaterial color="#4a5262" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.74, -0.19]}>
        <boxGeometry args={[0.42, 0.5, 0.07]} />
        <meshStandardMaterial color="#4a5262" roughness={0.75} />
      </mesh>
    </group>
  );
}

/** Two-seat sofa: base, backrest, arms, cushions (faces local +Z). */
function Sofa({ position = [0, 0, 0], rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.24, 0.06]}>
        <boxGeometry args={[1.9, 0.34, 0.8]} />
        <meshStandardMaterial color="#a8443c" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.55, -0.32]}>
        <boxGeometry args={[1.9, 0.55, 0.18]} />
        <meshStandardMaterial color="#953a33" roughness={0.85} />
      </mesh>
      {[-0.88, 0.88].map((x) => (
        <mesh key={x} position={[x, 0.5, 0.05]}>
          <boxGeometry args={[0.16, 0.44, 0.78]} />
          <meshStandardMaterial color="#953a33" roughness={0.85} />
        </mesh>
      ))}
      {[-0.42, 0.42].map((x) => (
        <mesh key={x} position={[x, 0.45, 0.1]}>
          <boxGeometry args={[0.76, 0.12, 0.62]} />
          <meshStandardMaterial color="#c05a4e" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function CoffeeTable({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.34, 0]}>
        <boxGeometry args={[0.95, 0.06, 0.55]} />
        <meshStandardMaterial color="#8a5a3e" roughness={0.65} />
      </mesh>
      {[[-0.4, -0.2], [0.4, -0.2], [-0.4, 0.2], [0.4, 0.2]].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.16, z]}>
          <boxGeometry args={[0.06, 0.32, 0.06]} />
          <meshStandardMaterial color="#7a4e36" roughness={0.65} />
        </mesh>
      ))}
    </group>
  );
}

function Rug({ position = [0, 0, 0], size = [2.2, 2.6] }) {
  return (
    <mesh position={[position[0], 0.015, position[2]]}>
      <boxGeometry args={[size[0], 0.03, size[1]]} />
      <meshStandardMaterial color="#9c5f74" roughness={0.95} />
    </mesh>
  );
}

function Plant({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.14, 0.17, 0.28, 12]} />
        <meshStandardMaterial color="#b06a45" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.44, 0]}>
        <sphereGeometry args={[0.24, 12, 10]} />
        <meshStandardMaterial color="#5d9a5f" roughness={0.9} />
      </mesh>
      <mesh position={[0.1, 0.62, 0.05]}>
        <sphereGeometry args={[0.15, 10, 8]} />
        <meshStandardMaterial color="#6fae6e" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** Wall-mounted whiteboard with a tray and a few marker strokes. */
function Whiteboard({ position = [0, 1.35, 0], rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh>
        <boxGeometry args={[1.5, 0.85, 0.05]} />
        <meshStandardMaterial color="#c8cdd6" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.028]}>
        <boxGeometry args={[1.38, 0.73, 0.01]} />
        <meshStandardMaterial color="#f4f6f8" roughness={0.35} />
      </mesh>
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
      <mesh position={[0, -0.47, 0.05]}>
        <boxGeometry args={[0.7, 0.04, 0.09]} />
        <meshStandardMaterial color="#9aa1ad" />
      </mesh>
    </group>
  );
}

/** Open bookshelf with a few colored book blocks (back at local -Z). */
function Bookshelf({ position = [0, 0, 0], rotationY = 0 }) {
  const books = [
    [-0.32, 0.62, "#c96f6f", 0.2],
    [-0.08, 0.62, "#5b8fd6", 0.14],
    [0.18, 0.62, "#e0b355", 0.24],
    [-0.25, 1.06, "#67a985", 0.18],
    [0.05, 1.06, "#9a6fc9", 0.2],
    [0.32, 1.06, "#c96f9d", 0.12],
  ];
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* frame: sides + top + bottom + back panel */}
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 0.75, 0]}>
          <boxGeometry args={[0.06, 1.5, 0.34]} />
          <meshStandardMaterial color="#7a4e36" roughness={0.7} />
        </mesh>
      ))}
      {[0.04, 0.52, 0.96, 1.46].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[1.16, 0.06, 0.34]} />
          <meshStandardMaterial color="#8a5a3e" roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 0.75, -0.15]}>
        <boxGeometry args={[1.16, 1.5, 0.03]} />
        <meshStandardMaterial color="#6e4530" roughness={0.75} />
      </mesh>
      {books.map(([x, y, color, w], i) => (
        <mesh key={i} position={[x, y + 0.17, 0]}>
          <boxGeometry args={[w, 0.34, 0.24]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

/** Cork notice board with pinned paper notes (faces local +Z). */
function NoticeBoard({ position = [0, 1.45, 0], rotationY = 0 }) {
  const notes = [
    [-0.25, 0.12, -0.06],
    [0.1, 0.16, 0.1],
    [0.26, -0.12, 0.04],
    [-0.12, -0.15, 0.12],
  ];
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh>
        <boxGeometry args={[1.0, 0.68, 0.04]} />
        <meshStandardMaterial color="#8a5a3e" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.015]}>
        <boxGeometry args={[0.9, 0.58, 0.02]} />
        <meshStandardMaterial color="#c9a06a" roughness={0.9} />
      </mesh>
      {notes.map(([x, y, tilt], i) => (
        <mesh key={i} position={[x, y, 0.03]} rotation={[0, 0, tilt]}>
          <boxGeometry args={[0.16, 0.2, 0.005]} />
          <meshStandardMaterial color="#f4f6f8" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/** Three-drawer filing cabinet (drawers face local +Z). */
function FilingCabinet({ position = [0, 0, 0], rotationY = 0 }) {
  const drawers = [0.2, 0.55, 0.9];
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
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

/** A few colored picture frames for the lounge's back wall (face +Z). */
function WallFrames({ position = [0, 1.5, 0] }) {
  const frames = [
    [-0.55, 0.05, 0.34, 0.44, "#67a985"],
    [0.0, -0.02, 0.4, 0.3, "#5b8fd6"],
    [0.52, 0.08, 0.3, 0.38, "#c96f6f"],
  ];
  return (
    <group position={position}>
      {frames.map(([x, y, w, h, color], i) => (
        <group key={i} position={[x, y, 0]}>
          <mesh>
            <boxGeometry args={[w, h, 0.04]} />
            <meshStandardMaterial color="#f5eee2" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0, 0.015]}>
            <boxGeometry args={[w - 0.08, h - 0.08, 0.02]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Furniture set per layout style. Walls sit on the -X and -Z edges, so desks
 * and shelves back onto those; seating faces into the open (+X/+Z) corner the
 * camera looks through.
 */
export default function RoomFurniture({ layoutStyle }) {
  switch (layoutStyle) {
    case "lounge":
      return (
        <group>
          {/* the room is raised above the front walls, so the whole floor is
              visible — seating can sit naturally in the middle */}
          <Rug position={[-0.35, 0, 0]} size={[2.4, 2.7]} />
          <Sofa position={[-1.55, 0, 0]} rotationY={Math.PI / 2} />
          <CoffeeTable position={[-0.25, 0, 0]} />
          <Plant position={[-1.85, 0, -1.8]} />
          <Plant position={[1.55, 0, 1.55]} />
          <WallFrames position={[-0.1, 1.5, -2.14]} />
        </group>
      );

    case "office-workspace":
      return (
        <group>
          {/* two desks in a row against the -Z wall, monitors facing the room */}
          <Workstation position={[-0.95, 0, -1.78]} />
          <Workstation position={[0.45, 0, -1.78]} />
          <OfficeChair position={[-0.95, 0, -1.02]} rotationY={Math.PI} />
          <OfficeChair position={[0.45, 0, -1.02]} rotationY={Math.PI} />
          {/* whiteboard on the -X wall */}
          <Whiteboard position={[-2.14, 1.35, 0.3]} rotationY={Math.PI / 2} />
          <Plant position={[1.35, 0, 0.9]} />
        </group>
      );

    case "office-workspace-alt":
      return (
        <group>
          {/* L-shaped arrangement: one desk on the -Z wall, one on the -X wall */}
          <Workstation position={[-0.5, 0, -1.78]} />
          <OfficeChair position={[-0.5, 0, -1.02]} rotationY={Math.PI} />
          <Workstation position={[-1.78, 0, 0.9]} rotationY={Math.PI / 2} />
          <OfficeChair position={[-1.02, 0, 0.9]} rotationY={-Math.PI / 2} />
          <Bookshelf position={[1.55, 0, -1.95]} />
          <NoticeBoard position={[-0.5, 1.5, -2.14]} />
          {/* backs onto the rear wall, drawers opening into the room */}
          <FilingCabinet position={[0.5, 0, -1.87]} />
        </group>
      );

    default:
      return null;
  }
}
