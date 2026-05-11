// Separating Axis Theorem for convex shapes.
//
// Two convex shapes do NOT overlap iff there exists some axis on which
// their projections are disjoint. For polygons (incl. rotated rects),
// the candidate axes are the edge normals. For circle-vs-polygon, add
// the axis from the polygon's closest vertex to the circle center.
//
// Strict interior overlap: touching edges/corners return false. The
// generator wants this so adjacent rooms can share a wall.

import { CollisionShape, Vec2, rectCorners, aabbOverlap, RectShape, CircleShape, PolygonShape } from './shape';

const EPSILON = 1e-9;

const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;
const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
const normalize = (v: Vec2): Vec2 => {
  const len = Math.hypot(v.x, v.y);
  return len < EPSILON ? { x: 0, y: 0 } : { x: v.x / len, y: v.y / len };
};

/** Outward edge normals of a polygon's edges (CCW vertices → normals point outward). */
const polygonNormals = (verts: Vec2[]): Vec2[] => {
  const normals: Vec2[] = [];
  for (let i = 0; i < verts.length; i++) {
    const a = verts[i];
    const b = verts[(i + 1) % verts.length];
    const edge = sub(b, a);
    // 90° CW rotation of edge gives outward normal for CCW winding.
    normals.push(normalize({ x: edge.y, y: -edge.x }));
  }
  return normals;
};

/** [min, max] projection of a polygon's vertices onto an axis. */
const projectPolygon = (verts: Vec2[], axis: Vec2): [number, number] => {
  let min = Infinity;
  let max = -Infinity;
  for (const v of verts) {
    const p = dot(v, axis);
    if (p < min) min = p;
    if (p > max) max = p;
  }
  return [min, max];
};

const projectCircle = (c: CircleShape, axis: Vec2): [number, number] => {
  const center = dot({ x: c.cx, y: c.cy }, axis);
  return [center - c.r, center + c.r];
};

const intervalsOverlapStrict = (a: [number, number], b: [number, number]): boolean =>
  a[0] < b[1] - EPSILON && b[0] < a[1] - EPSILON;

const shapeVertices = (s: CollisionShape): Vec2[] | null => {
  if (s.kind === 'rect') return rectCorners(s as RectShape);
  if (s.kind === 'polygon') return (s as PolygonShape).vertices;
  return null;
};

const polygonVsPolygon = (a: Vec2[], b: Vec2[]): boolean => {
  const axes = [...polygonNormals(a), ...polygonNormals(b)];
  for (const axis of axes) {
    if (axis.x === 0 && axis.y === 0) continue;
    if (!intervalsOverlapStrict(projectPolygon(a, axis), projectPolygon(b, axis))) return false;
  }
  return true;
};

const closestPointOnSegment = (p: Vec2, a: Vec2, b: Vec2): Vec2 => {
  const ab = sub(b, a);
  const t = dot(sub(p, a), ab) / (dot(ab, ab) + EPSILON);
  const tc = Math.max(0, Math.min(1, t));
  return { x: a.x + ab.x * tc, y: a.y + ab.y * tc };
};

const polygonVsCircle = (verts: Vec2[], c: CircleShape): boolean => {
  // SAT axes: polygon's edge normals + axis from circle center to nearest vertex.
  const axes = polygonNormals(verts);
  // Add the closest-vertex axis.
  let closest = verts[0];
  let bestDistSq = Infinity;
  for (const v of verts) {
    const dx = v.x - c.cx;
    const dy = v.y - c.cy;
    const d = dx * dx + dy * dy;
    if (d < bestDistSq) {
      bestDistSq = d;
      closest = v;
    }
  }
  axes.push(normalize({ x: closest.x - c.cx, y: closest.y - c.cy }));
  for (const axis of axes) {
    if (axis.x === 0 && axis.y === 0) continue;
    if (!intervalsOverlapStrict(projectPolygon(verts, axis), projectCircle(c, axis))) return false;
  }
  // Final guard: circle center inside polygon implies overlap even when projections
  // happen to align across all axes (rare with the closest-vertex axis but safe).
  // (Skipped; the SAT axes above are sufficient for convex polygons + the closest-
  // vertex axis. Kept here as a note in case we add concave polygons later.)
  // Also: distance from circle center to closest edge segment.
  for (let i = 0; i < verts.length; i++) {
    const a = verts[i];
    const b = verts[(i + 1) % verts.length];
    const cp = closestPointOnSegment({ x: c.cx, y: c.cy }, a, b);
    const dx = cp.x - c.cx;
    const dy = cp.y - c.cy;
    if (dx * dx + dy * dy < c.r * c.r - EPSILON) return true;
  }
  // SAT already concluded "no separating axis" above; final check is whether
  // the circle is fully inside the polygon (no edge within reach).
  // For convex polygons, that means circle center is on the same side of every edge.
  let inside = true;
  for (let i = 0; i < verts.length; i++) {
    const a = verts[i];
    const b = verts[(i + 1) % verts.length];
    const edge = sub(b, a);
    // Outward normal for CCW.
    const n: Vec2 = { x: edge.y, y: -edge.x };
    if (dot(sub({ x: c.cx, y: c.cy }, a), n) > EPSILON) {
      inside = false;
      break;
    }
  }
  return inside;
};

const circleVsCircle = (a: CircleShape, b: CircleShape): boolean => {
  const dx = a.cx - b.cx;
  const dy = a.cy - b.cy;
  const rsum = a.r + b.r;
  return dx * dx + dy * dy < rsum * rsum - EPSILON;
};

/** Strict-interior overlap. Touching shapes return false. */
export const intersects = (a: CollisionShape, b: CollisionShape): boolean => {
  if (!aabbOverlap(a.aabb, b.aabb)) return false;

  if (a.kind === 'circle' && b.kind === 'circle') {
    return circleVsCircle(a as CircleShape, b as CircleShape);
  }
  if (a.kind === 'circle') {
    const bv = shapeVertices(b)!;
    return polygonVsCircle(bv, a as CircleShape);
  }
  if (b.kind === 'circle') {
    const av = shapeVertices(a)!;
    return polygonVsCircle(av, b as CircleShape);
  }
  return polygonVsPolygon(shapeVertices(a)!, shapeVertices(b)!);
};
