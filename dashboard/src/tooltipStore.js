/**
 * Tiny external store for the device hover-tooltip.
 *
 * The 3D scene fires hover events on every pointer move over a device. If that
 * drove React state on the DashboardShell, the ENTIRE dashboard (all room
 * cards, panels, the animated clock) would re-render dozens of times a second —
 * which showed up as text flicker while hovering/clicking devices.
 *
 * Keeping the hover state here, read only by <DeviceTooltip> via
 * useSyncExternalStore, means a hover re-renders just the tooltip. Nothing else
 * on the page reacts to pointer motion.
 */

import { useSyncExternalStore } from "react";

let tooltip = null; // { device, x, y } | null
const listeners = new Set();

/** Update the hovered device (or null to hide). Stable identity — safe as a dep. */
export function setTooltip(next) {
  tooltip = next;
  for (const listener of listeners) listener();
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return tooltip;
}

/** Subscribe a component to tooltip changes (only <DeviceTooltip> should). */
export function useTooltip() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
