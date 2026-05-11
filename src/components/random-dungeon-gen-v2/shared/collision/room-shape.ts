// Translate a RoomEntity into the CollisionShape used by the index.
//
// Chamber.shape selects the geometry; non-Chamber rooms (Passage) fall
// through as axis-aligned rects.

import { RoomEntity, Chamber } from '../model/dungeon-entity.model';
import { RoomShapeType } from '../model/dungeon-type.model';
import { Transform } from '../model/Transform';
import { CollisionShape, Vec2, makeCircle, makePolygon, makeRect } from './shape';

const rectFromTransform = (t: Transform, rotation = 0): CollisionShape => {
  const hx = t.dimension.x / 2;
  const hy = t.dimension.y / 2;
  return makeRect(t.center.x, t.center.y, hx, hy, rotation);
};

const circleFromTransform = (t: Transform): CollisionShape => {
  // Circle chambers use dimension.x as the diameter (renderer uses dim.x/2 as radius).
  return makeCircle(t.center.x, t.center.y, t.dimension.x / 2);
};

/**
 * Regular octagon (all 8 sides equal), inscribed in the room's shorter
 * half-dimension so flat sides are horizontal/vertical (stop-sign
 * orientation). For non-square rooms the longer axis is not filled —
 * the trade for keeping every side equal length.
 *
 * Geometry: with apothem = min(hx, hy), circumradius R = apothem /
 * cos(π/8). Vertices at π/8 + k·π/4 (k = 0..7) place the flat sides
 * along the cardinal axes.
 */
const octagonVertices = (cx: number, cy: number, hx: number, hy: number): Vec2[] => {
  const apothem = Math.min(hx, hy);
  const R = apothem / Math.cos(Math.PI / 8);
  const verts: Vec2[] = [];
  for (let k = 0; k < 8; k++) {
    const angle = Math.PI / 8 + k * (Math.PI / 4);
    verts.push({ x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) });
  }
  return verts;
};

/**
 * Isoceles trapezoid with the narrow side perpendicular to `narrowDir`.
 * The "narrow" side has half the width of the wide side, giving a clear
 * taper at any size.
 */
const trapezoidVertices = (
  cx: number,
  cy: number,
  hx: number,
  hy: number,
  narrowDir: 'N' | 'E' | 'S' | 'W',
): Vec2[] => {
  // Vertices in local frame (cx, cy = origin), CCW (visually clockwise in y-down).
  // Default orientation: narrow side on top (north). Half the width.
  const widePx = hx;
  const narrowPx = hx / 2;
  let local: Vec2[] = [
    { x: -narrowPx, y: -hy },
    { x: narrowPx, y: -hy },
    { x: widePx, y: hy },
    { x: -widePx, y: hy },
  ];
  // Rotate to put the narrow side in the requested direction.
  const rotateLocal = (pts: Vec2[], cos: number, sin: number): Vec2[] =>
    pts.map((p) => ({ x: p.x * cos - p.y * sin, y: p.x * sin + p.y * cos }));
  switch (narrowDir) {
    case 'N':
      break; // default
    case 'E':
      local = rotateLocal(local, Math.cos(Math.PI / 2), Math.sin(Math.PI / 2));
      break;
    case 'S':
      local = rotateLocal(local, Math.cos(Math.PI), Math.sin(Math.PI));
      break;
    case 'W':
      local = rotateLocal(local, Math.cos(-Math.PI / 2), Math.sin(-Math.PI / 2));
      break;
  }
  return local.map((p) => ({ x: cx + p.x, y: cy + p.y }));
};

const directionToNarrow = (dir: string): 'N' | 'E' | 'S' | 'W' => {
  switch (dir) {
    case 'North':
      return 'N';
    case 'East':
      return 'E';
    case 'South':
      return 'S';
    case 'West':
      return 'W';
    default:
      return 'N';
  }
};

/** Compute the collision shape for a room from its model state. */
export const buildShapeForRoom = (room: RoomEntity): CollisionShape => {
  const t = room.transform;
  const chamber = room as Chamber;
  const shape = chamber.shape;
  const rotation = t.rotation ?? 0;
  const hx = t.dimension.x / 2;
  const hy = t.dimension.y / 2;
  switch (shape) {
    case RoomShapeType.Circle:
      return circleFromTransform(t);
    case RoomShapeType.Octagon:
      return makePolygon(t.center.x, t.center.y, octagonVertices(t.center.x, t.center.y, hx, hy));
    case RoomShapeType.Trapezoid:
      return makePolygon(
        t.center.x,
        t.center.y,
        trapezoidVertices(t.center.x, t.center.y, hx, hy, directionToNarrow(t.direction)),
      );
    case RoomShapeType.Square:
    case RoomShapeType.Rectangle:
    case RoomShapeType.None:
    default:
      return rectFromTransform(t, rotation);
  }
};

// Also export the polygon-vertex helpers — used by the renderer so the
// drawn shape matches the collision shape exactly.
export { octagonVertices, trapezoidVertices, directionToNarrow };
