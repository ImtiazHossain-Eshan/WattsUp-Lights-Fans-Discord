import RoomScene from "./RoomScene.jsx";

const ROOM_ORDER = ["Drawing Room", "Work Room 1", "Work Room 2"];

/**
 * Cozy isometric office — pure CSS 3D (no images, no canvas).
 *
 * The 720x240 ground plane is tilted with rotateX/rotateZ; every room draws
 * its floor slice, cutaway walls, furniture cuboids and its live devices.
 */
export default function OfficeScene3D({ devices, onDeviceHover }) {
  return (
    <div className="scene-wrap">
      <div className="scene-backdrop" aria-hidden="true" />

      <div className="scene-scale">
        <div className="office-iso">
          {/* shared ground plane */}
          <div className="office-floor" aria-hidden="true" />

          {/* plinth sides so the diorama looks like a solid slab */}
          <div className="skirt skirt-front" aria-hidden="true" />
          <div className="skirt skirt-east" aria-hidden="true" />

          {ROOM_ORDER.map((roomName, index) => (
            <RoomScene
              key={roomName}
              name={roomName}
              index={index}
              devices={devices.filter((d) => d.room === roomName)}
              onDeviceHover={onDeviceHover}
            />
          ))}
        </div>
      </div>

      <p className="scene-caption">
        Cutaway view · lights glow &amp; fans spin with the live simulation — hover any
        device for details
      </p>
    </div>
  );
}
