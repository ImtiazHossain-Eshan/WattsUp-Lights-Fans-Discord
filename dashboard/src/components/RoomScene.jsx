import FanDevice from "./FanDevice.jsx";
import LightDevice from "./LightDevice.jsx";

/**
 * One 240x240 room slice: floor tint, cutaway walls, furniture and the room's
 * five live devices. Everything is data-driven — status comes straight from
 * the backend device objects, never from local state.
 */

// Reusable 3-face box drawn with CSS 3D (top + two visible sides).
function Cuboid({ x, y, w, d, h, tone = "wood", className = "" }) {
  return (
    <div
      className={`cuboid tone-${tone} ${className}`}
      style={{
        "--x": `${x}px`,
        "--y": `${y}px`,
        "--w": `${w}px`,
        "--d": `${d}px`,
        "--h": `${h}px`,
      }}
      aria-hidden="true"
    >
      <div className="face face-top" />
      <div className="face face-front" />
      <div className="face face-side" />
    </div>
  );
}

// Billboard sprite (counter-rotated to face the camera) anchored to the floor.
function Sprite({ x, y, lift = 0, className = "", children }) {
  return (
    <div className="anchor" style={{ left: `${x}px`, top: `${y}px` }}>
      <div className={`sprite ${className}`} style={{ "--lift": `${lift}px` }}>
        {children}
      </div>
    </div>
  );
}

function Plant({ x, y }) {
  return (
    <>
      <Cuboid x={x} y={y} w={16} d={16} h={13} tone="pot" />
      <Sprite x={x + 8} y={y + 8} lift={13} className="plant-sprite">
        <div className="plant-blob" />
      </Sprite>
    </>
  );
}

function DrawingFurniture() {
  return (
    <>
      <div className="rug" aria-hidden="true" />
      {/* sofa against the west wall: base + backrest + armrests */}
      <Cuboid x={16} y={64} w={32} d={104} h={20} tone="sofa" />
      <Cuboid x={8} y={64} w={10} d={104} h={38} tone="sofa-dark" />
      <Cuboid x={16} y={52} w={32} d={14} h={30} tone="sofa-dark" />
      <Cuboid x={16} y={166} w={32} d={14} h={30} tone="sofa-dark" />
      {/* coffee table */}
      <Cuboid x={92} y={98} w={52} d={34} h={16} tone="walnut" />
      <Plant x={204} y={18} />
      <Plant x={18} y={206} />
    </>
  );
}

function WorkFurniture() {
  return (
    <>
      {/* two desks along the north wall, each with a glowing laptop */}
      <Cuboid x={34} y={26} w={84} d={32} h={26} tone="walnut" />
      <Cuboid x={136} y={26} w={84} d={32} h={26} tone="walnut" />
      <Sprite x={76} y={42} lift={26} className="laptop-sprite">
        <div className="laptop" />
      </Sprite>
      <Sprite x={178} y={42} lift={26} className="laptop-sprite">
        <div className="laptop" />
      </Sprite>
      {/* chairs facing the desks */}
      <Cuboid x={66} y={74} w={20} d={20} h={13} tone="chair" />
      <Cuboid x={66} y={92} w={20} d={6} h={26} tone="chair-dark" />
      <Cuboid x={168} y={74} w={20} d={20} h={13} tone="chair" />
      <Cuboid x={168} y={92} w={20} d={6} h={26} tone="chair-dark" />
      {/* low cabinet + greenery */}
      <Cuboid x={10} y={150} w={24} d={58} h={28} tone="cabinet" />
      <Plant x={208} y={18} />
    </>
  );
}

// Where each named device sits inside its room (room-local coordinates).
const DEVICE_SPOTS = {
  drawing: {
    "Fan 1": { x: 200, y: 84 },
    "Fan 2": { x: 200, y: 178 },
    "Light 1": { x: 84, y: 62 },
    "Light 2": { x: 148, y: 118 },
    "Light 3": { x: 84, y: 178 },
  },
  work: {
    "Fan 1": { x: 206, y: 148 },
    "Fan 2": { x: 40, y: 200 },
    "Light 1": { x: 72, y: 64 },
    "Light 2": { x: 174, y: 64 },
    "Light 3": { x: 126, y: 158 },
  },
};

export default function RoomScene({ name, index, devices, onDeviceHover }) {
  const isDrawing = name === "Drawing Room";
  const spots = DEVICE_SPOTS[isDrawing ? "drawing" : "work"];
  const byName = Object.fromEntries(devices.map((d) => [d.name, d]));
  const roomPower = devices.reduce((sum, d) => sum + d.currentPower, 0);
  const roomClass = ["room--drawing", "room--work1", "room--work2"][index];

  return (
    <div className={`room ${roomClass}`} style={{ "--rx": `${index * 240}px` }}>
      <div className="room-floor" aria-hidden="true" />

      {/* cutaway walls: north wall always, west wall on the first room,
          frosted partition (with doorway gap) between rooms */}
      <div className="wall wall-north" aria-hidden="true">
        <div className="window" />
        {isDrawing && <div className="window window--second" />}
      </div>
      {index === 0 ? (
        <div className="wall wall-west" aria-hidden="true" />
      ) : (
        <>
          <div className="wall divider divider-a" aria-hidden="true" />
          <div className="wall divider divider-b" aria-hidden="true" />
        </>
      )}

      {isDrawing ? <DrawingFurniture /> : <WorkFurniture />}

      {["Fan 1", "Fan 2"].map((fanName) => (
        <FanDevice
          key={fanName}
          device={byName[fanName]}
          pos={spots[fanName]}
          onDeviceHover={onDeviceHover}
        />
      ))}
      {["Light 1", "Light 2", "Light 3"].map((lightName) => (
        <LightDevice
          key={lightName}
          device={byName[lightName]}
          pos={spots[lightName]}
          onDeviceHover={onDeviceHover}
        />
      ))}

      {/* floating room label, billboard-style */}
      <div className="anchor" style={{ left: "120px", top: "120px" }}>
        <div className="sprite room-label" style={{ "--lift": "126px" }}>
          <span className="room-label-name">{name}</span>
          <span className="room-label-power">{roomPower} W</span>
        </div>
      </div>
    </div>
  );
}
