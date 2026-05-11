// Single owner of "what's in the dungeon, geometrically." Combines the
// spatial hash with the SAT test so the generator gets a tiny surface
// area: canPlace / add / remove / clear.

import { intersects } from './sat';
import { CollisionShape } from './shape';
import { SpatialHash } from './spatial-hash';

export class CollisionIndex {
  private shapes = new Map<string, CollisionShape>();
  private hash: SpatialHash;

  constructor(cellSize = 50) {
    this.hash = new SpatialHash(cellSize);
  }

  /** True iff placing this shape would not overlap any existing one. */
  canPlace(shape: CollisionShape): boolean {
    const candidates = this.hash.queryCandidates(shape);
    for (const id of candidates) {
      const other = this.shapes.get(id);
      if (!other) continue;
      if (intersects(shape, other)) return false;
    }
    return true;
  }

  add(id: string, shape: CollisionShape): void {
    if (this.shapes.has(id)) this.remove(id);
    this.shapes.set(id, shape);
    this.hash.insert(id, shape);
  }

  remove(id: string): boolean {
    if (!this.shapes.has(id)) return false;
    this.shapes.delete(id);
    this.hash.remove(id);
    return true;
  }

  clear(): void {
    this.shapes.clear();
    this.hash.clear();
  }

  has(id: string): boolean {
    return this.shapes.has(id);
  }

  size(): number {
    return this.shapes.size;
  }
}
