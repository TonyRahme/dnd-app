// Analytic collision shapes for room placement.
//
// A CollisionShape is whatever geometry actually matters for overlap
// testing — center, extents, rotation/vertices, and a precomputed AABB
// for cheap spatial-hash bucketing.

export interface Vec2 {
  x: number;
  y: number;
}

export interface AABB {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface RectShape {
  kind: 'rect';
  cx: number;
  cy: number;
  /** Half-width along the shape's local +x axis (before rotation). */
  hx: number;
  /** Half-height along the shape's local +y axis (before rotation). */
  hy: number;
  /** Rotation in radians, CCW. 0 = axis-aligned. */
  rotation: number;
  aabb: AABB;
}

export interface CircleShape {
  kind: 'circle';
  cx: number;
  cy: number;
  r: number;
  aabb: AABB;
}

export interface PolygonShape {
  kind: 'polygon';
  cx: number;
  cy: number;
  /** Absolute (world-space) vertices in CCW order. */
  vertices: Vec2[];
  aabb: AABB;
}

export type CollisionShape = RectShape | CircleShape | PolygonShape;

const rotatePoint = (px: number, py: number, cos: number, sin: number): Vec2 => ({
  x: px * cos - py * sin,
  y: px * sin + py * cos,
});

const aabbFromPoints = (pts: Vec2[]): AABB => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
};

/** Compute the four world-space corners of a rect (CCW). */
export const rectCorners = (rect: RectShape): Vec2[] => {
  const cos = Math.cos(rect.rotation);
  const sin = Math.sin(rect.rotation);
  // local corners (CCW starting from top-left in screen coords where +y is down)
  const local: Vec2[] = [
    { x: -rect.hx, y: -rect.hy },
    { x: rect.hx, y: -rect.hy },
    { x: rect.hx, y: rect.hy },
    { x: -rect.hx, y: rect.hy },
  ];
  return local.map((p) => {
    const r = rotatePoint(p.x, p.y, cos, sin);
    return { x: rect.cx + r.x, y: rect.cy + r.y };
  });
};

export const makeRect = (
  cx: number,
  cy: number,
  hx: number,
  hy: number,
  rotation = 0,
): RectShape => {
  const shape: RectShape = {
    kind: 'rect',
    cx,
    cy,
    hx,
    hy,
    rotation,
    aabb: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
  };
  shape.aabb = aabbFromPoints(rectCorners(shape));
  return shape;
};

export const makeCircle = (cx: number, cy: number, r: number): CircleShape => ({
  kind: 'circle',
  cx,
  cy,
  r,
  aabb: { minX: cx - r, minY: cy - r, maxX: cx + r, maxY: cy + r },
});

export const makePolygon = (cx: number, cy: number, vertices: Vec2[]): PolygonShape => ({
  kind: 'polygon',
  cx,
  cy,
  vertices,
  aabb: aabbFromPoints(vertices),
});

/** Cheap AABB overlap test — broad-phase reject before SAT. */
export const aabbOverlap = (a: AABB, b: AABB): boolean =>
  a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY;
