// Shared constants for DungeonCanvas and its layer components.
// SCALE converts model "design units" (5-unit increments) into Konva pixels.
export const SCALE = 2;
export const DEFAULT_HEIGHT = 800;

// Grid: a single 5x5-unit cell is `GRID_CELL` Konva pixels per side.
// Major lines every `GRID_MAJOR_EVERY` cells help orient at coarser scale.
export const GRID_CELL = 5 * SCALE;
export const GRID_MAJOR_EVERY = 5;
export const GRID_MAJOR_CELL = GRID_CELL * GRID_MAJOR_EVERY;
