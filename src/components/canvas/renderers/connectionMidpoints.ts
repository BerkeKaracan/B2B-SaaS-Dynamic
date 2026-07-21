/**
 * Shared registry for user-dragged connection midpoints (world coords).
 *
 * The visible connection curves are painted by the passive canvas layer
 * (CanvasPassiveLayers) while the drag handle lives in the interaction SVG
 * (ConnectionLayer). This registry keeps both in sync without routing
 * per-pointermove updates through React state.
 */
export type WorldPoint = { x: number; y: number };

const midpoints = new Map<string, WorldPoint>();
const listeners = new Set<() => void>();

export function setConnectionMidpoint(
  connectionId: string,
  point: WorldPoint | null
) {
  if (point) {
    midpoints.set(connectionId, point);
  } else {
    midpoints.delete(connectionId);
  }
  listeners.forEach((listener) => listener());
}

export function getConnectionMidpoint(
  connectionId: string
): WorldPoint | undefined {
  return midpoints.get(connectionId);
}

export function subscribeConnectionMidpoints(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
