import ToggleSwitch from "./ToggleSwitch.jsx";
import { ActivityIcon } from "./Icons.jsx";

/**
 * Simulation controls: enable/disable the simulated device layer, hand every
 * device back to the simulator (Reset all to Auto), or turn everything off.
 *
 * Every action calls the backend first (via the handlers in App.jsx); this
 * component holds no device state of its own — it renders the simulation
 * snapshot the backend pushes over Socket.IO.
 */
export default function ControlBar({ simulation, busy, onToggleSim, onResetAuto, onAllOff }) {
  const enabled = Boolean(simulation?.enabled);
  const intervalSec = simulation ? Math.round((simulation.intervalMs || 5000) / 1000) : 5;
  const autoCount = simulation?.autoDevices ?? 0;
  const manualCount = simulation?.manualDevices ?? 0;

  return (
    <div className="panel control-bar">
      <h2>
        <ActivityIcon size={15} /> Simulation controls
        {manualCount > 0 && <small>{manualCount} manual</small>}
      </h2>

      <div className="control-sim">
        <div className="control-sim-toggle">
          <span className="control-label">Simulated device layer</span>
          <ToggleSwitch
            checked={enabled}
            busy={busy}
            size="lg"
            label={enabled ? "On" : "Off"}
            onChange={onToggleSim}
          />
        </div>
        <p className="control-sim-note">
          {enabled
            ? `Running — auto-toggling one of ${autoCount} auto device${
                autoCount === 1 ? "" : "s"
              } every ${intervalSec}s.`
            : "Paused — devices only change through manual control."}
          {manualCount > 0 && (
            <span className="control-sim-manual">
              {" "}
              {manualCount} device{manualCount === 1 ? "" : "s"} pinned to manual.
            </span>
          )}
        </p>
      </div>

      <div className="control-actions">
        <button type="button" className="btn" disabled={busy} onClick={onResetAuto}>
          Reset all to Auto
        </button>
        <button
          type="button"
          className="btn btn--danger"
          disabled={busy}
          onClick={onAllOff}
        >
          Turn all off
        </button>
      </div>
    </div>
  );
}
