import { ReactElement } from 'react';
import { Group, Line } from 'react-konva';
import Konva from 'konva';
import { RoomEntity, Chamber } from '../shared/model/dungeon-entity.model';
import { RoomShapeType } from '../shared/model/dungeon-type.model';
import { octagonVertices, trapezoidVertices, directionToNarrow } from '../shared/collision';
import { GRID_CELL, GRID_MAJOR_CELL, SCALE } from './constants';

interface RoomGridProps {
  room: RoomEntity;
}

/**
 * Render a 5x5-unit grid inside a single room, using the same cell size
 * as the global GridLayer. Major lines (every 25 units in world coords)
 * are kept aligned with the global grid by checking world-space position
 * rather than room-local offset.
 *
 * Rect rooms get an axis-aligned rectangular clip; Circle rooms get an
 * arc clipFunc; Octagon/Trapezoid trace their polygon outline.
 */
const RoomGrid = ({ room }: RoomGridProps): ReactElement | null => {
  const shape = (room as Chamber).shape;
  const isCircle = shape === RoomShapeType.Circle;
  const isPolygon = shape === RoomShapeType.Octagon || shape === RoomShapeType.Trapezoid;

  let left: number;
  let top: number;
  let right: number;
  let bottom: number;
  let clipFunc: (ctx: Konva.Context) => void;

  if (isCircle) {
    const cx = room.transform.center.x * SCALE;
    const cy = room.transform.center.y * SCALE;
    const r = (room.transform.dimension.x / 2) * SCALE;
    left = cx - r;
    top = cy - r;
    right = cx + r;
    bottom = cy + r;
    clipFunc = (ctx) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.closePath();
    };
  } else if (isPolygon) {
    const t = room.transform;
    const verts =
      shape === RoomShapeType.Octagon
        ? octagonVertices(t.center.x, t.center.y, t.dimension.x / 2, t.dimension.y / 2)
        : trapezoidVertices(
            t.center.x,
            t.center.y,
            t.dimension.x / 2,
            t.dimension.y / 2,
            directionToNarrow(t.direction),
          );
    const scaled = verts.map((v) => ({ x: v.x * SCALE, y: v.y * SCALE }));
    left = Math.min(...scaled.map((p) => p.x));
    right = Math.max(...scaled.map((p) => p.x));
    top = Math.min(...scaled.map((p) => p.y));
    bottom = Math.max(...scaled.map((p) => p.y));
    clipFunc = (ctx) => {
      ctx.beginPath();
      ctx.moveTo(scaled[0].x, scaled[0].y);
      for (let i = 1; i < scaled.length; i++) ctx.lineTo(scaled[i].x, scaled[i].y);
      ctx.closePath();
    };
  } else {
    // Rect (axis-aligned or rotated): build the four corners around
    // the room's center, then clip to that polygon and emit grid lines
    // in the room's local axes (rotated into world coords).
    const cx = room.transform.center.x * SCALE;
    const cy = room.transform.center.y * SCALE;
    const hxW = (room.transform.dimension.x * SCALE) / 2;
    const hyW = (room.transform.dimension.y * SCALE) / 2;
    const theta = room.transform.rotation ?? 0;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const toWorld = (lx: number, ly: number) => ({
      x: cx + lx * cos - ly * sin,
      y: cy + lx * sin + ly * cos,
    });
    const corners = [
      toWorld(-hxW, -hyW),
      toWorld(hxW, -hyW),
      toWorld(hxW, hyW),
      toWorld(-hxW, hyW),
    ];
    left = Math.min(...corners.map((p) => p.x));
    right = Math.max(...corners.map((p) => p.x));
    top = Math.min(...corners.map((p) => p.y));
    bottom = Math.max(...corners.map((p) => p.y));
    clipFunc = (ctx) => {
      ctx.beginPath();
      ctx.moveTo(corners[0].x, corners[0].y);
      for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i].x, corners[i].y);
      ctx.closePath();
    };

    // Grid in the room's local frame, rotated into world coords. For
    // rotated rooms we lose alignment with the global grid, so "major"
    // is taken every 5 cells from the room's local origin (consistent
    // visually with axis-aligned rooms, which still hit world-aligned
    // majors at rotation === 0).
    const lines: ReactElement[] = [];
    const startLX = Math.ceil((-hxW + GRID_CELL) / GRID_CELL) * GRID_CELL;
    const endLX = Math.floor((hxW - GRID_CELL) / GRID_CELL) * GRID_CELL;
    const startLY = Math.ceil((-hyW + GRID_CELL) / GRID_CELL) * GRID_CELL;
    const endLY = Math.floor((hyW - GRID_CELL) / GRID_CELL) * GRID_CELL;
    const isMajorLocal = (n: number): boolean => Math.abs(n) % GRID_MAJOR_CELL === 0;
    for (let lx = startLX; lx <= endLX; lx += GRID_CELL) {
      const a = toWorld(lx, -hyW);
      const b = toWorld(lx, hyW);
      const major = isMajorLocal(lx);
      lines.push(
        <Line
          key={`v${lx}`}
          points={[a.x, a.y, b.x, b.y]}
          stroke={major ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.15)'}
          strokeWidth={major ? 0.6 : 0.3}
        />,
      );
    }
    for (let ly = startLY; ly <= endLY; ly += GRID_CELL) {
      const a = toWorld(-hxW, ly);
      const b = toWorld(hxW, ly);
      const major = isMajorLocal(ly);
      lines.push(
        <Line
          key={`h${ly}`}
          points={[a.x, a.y, b.x, b.y]}
          stroke={major ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.15)'}
          strokeWidth={major ? 0.6 : 0.3}
        />,
      );
    }
    if (lines.length === 0) return null;
    return (
      <Group listening={false} clipFunc={clipFunc}>
        {lines}
      </Group>
    );
  }

  // Snap to grid; rooms should already be aligned to 5-unit increments,
  // but be defensive in case of arbitrary input. (Circle + polygon paths
  // fall through here.)
  const startX = Math.ceil(left / GRID_CELL) * GRID_CELL;
  const endX = Math.floor(right / GRID_CELL) * GRID_CELL;
  const startY = Math.ceil(top / GRID_CELL) * GRID_CELL;
  const endY = Math.floor(bottom / GRID_CELL) * GRID_CELL;

  const lines: ReactElement[] = [];
  for (let x = startX; x <= endX; x += GRID_CELL) {
    if (x === left || x === right) continue;
    const isMajor = x % GRID_MAJOR_CELL === 0;
    lines.push(
      <Line
        key={`v${x}`}
        points={[x, top, x, bottom]}
        stroke={isMajor ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.15)'}
        strokeWidth={isMajor ? 0.6 : 0.3}
      />,
    );
  }
  for (let y = startY; y <= endY; y += GRID_CELL) {
    if (y === top || y === bottom) continue;
    const isMajor = y % GRID_MAJOR_CELL === 0;
    lines.push(
      <Line
        key={`h${y}`}
        points={[left, y, right, y]}
        stroke={isMajor ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.15)'}
        strokeWidth={isMajor ? 0.6 : 0.3}
      />,
    );
  }

  if (lines.length === 0) return null;
  return (
    <Group listening={false} clipFunc={clipFunc}>
      {lines}
    </Group>
  );
};

export default RoomGrid;
