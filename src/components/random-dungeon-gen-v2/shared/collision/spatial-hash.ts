// Uniform-grid spatial hash. Broad-phase index for the collision tests.
//
// Each shape covers one or more cells based on its AABB. Insert / remove
// touch only those cells; queryCandidates collects ids from cells the
// query AABB overlaps. Cell size of ~10x the dungeon's design grid keeps
// most rooms in 1-4 buckets and most queries returning <10 candidates.

import { CollisionShape } from './shape';

export class SpatialHash {
  private cells = new Map<string, Set<string>>();
  private idCells = new Map<string, string[]>();
  private cellSize: number;

  constructor(cellSize = 50) {
    this.cellSize = cellSize;
  }

  private cellKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  private cellRange(shape: CollisionShape): { x0: number; x1: number; y0: number; y1: number } {
    const cs = this.cellSize;
    return {
      x0: Math.floor(shape.aabb.minX / cs),
      x1: Math.floor(shape.aabb.maxX / cs),
      y0: Math.floor(shape.aabb.minY / cs),
      y1: Math.floor(shape.aabb.maxY / cs),
    };
  }

  insert(id: string, shape: CollisionShape): void {
    const { x0, x1, y0, y1 } = this.cellRange(shape);
    const touched: string[] = [];
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const key = this.cellKey(cx, cy);
        let bucket = this.cells.get(key);
        if (!bucket) {
          bucket = new Set();
          this.cells.set(key, bucket);
        }
        bucket.add(id);
        touched.push(key);
      }
    }
    this.idCells.set(id, touched);
  }

  remove(id: string): boolean {
    const keys = this.idCells.get(id);
    if (!keys) return false;
    for (const key of keys) {
      const bucket = this.cells.get(key);
      if (bucket) {
        bucket.delete(id);
        if (bucket.size === 0) this.cells.delete(key);
      }
    }
    this.idCells.delete(id);
    return true;
  }

  /** Ids of shapes whose buckets the given shape's AABB overlaps. */
  queryCandidates(shape: CollisionShape): Set<string> {
    const out = new Set<string>();
    const { x0, x1, y0, y1 } = this.cellRange(shape);
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const bucket = this.cells.get(this.cellKey(cx, cy));
        if (!bucket) continue;
        for (const id of bucket) out.add(id);
      }
    }
    return out;
  }

  clear(): void {
    this.cells.clear();
    this.idCells.clear();
  }
}
