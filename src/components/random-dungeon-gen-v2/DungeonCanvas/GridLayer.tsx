import { ReactElement, useMemo } from 'react';
import { Layer, Line } from 'react-konva';
import { GRID_CELL, GRID_MAJOR_CELL } from './constants';

interface GridLayerProps {
  width: number;
  height: number;
  /** Stage's centering offset (origin shift). */
  stageOffsetX: number;
  stageOffsetY: number;
  /** Stage's current pan position. */
  stageX: number;
  stageY: number;
  /** Stage's current zoom factor (1 = no zoom). */
  stageScale: number;
}

/**
 * Renders an "infinite" grid by computing only the cells visible in the
 * current viewport from the stage's pan, centering offset, and zoom.
 */
const GridLayer = ({
  width,
  height,
  stageOffsetX,
  stageOffsetY,
  stageX,
  stageY,
  stageScale,
}: GridLayerProps): ReactElement => {
  const lines = useMemo(() => {
    // Konva: screen = (child - offset) * scale + position
    // Solving for child: child = (screen - position) / scale + offset
    const left = -stageX / stageScale + stageOffsetX;
    const top = -stageY / stageScale + stageOffsetY;
    const right = left + width / stageScale;
    const bottom = top + height / stageScale;
    const pad = 2 * GRID_CELL;
    const startX = Math.floor((left - pad) / GRID_CELL) * GRID_CELL;
    const endX = Math.ceil((right + pad) / GRID_CELL) * GRID_CELL;
    const startY = Math.floor((top - pad) / GRID_CELL) * GRID_CELL;
    const endY = Math.ceil((bottom + pad) / GRID_CELL) * GRID_CELL;
    const out: ReactElement[] = [];
    for (let x = startX; x <= endX; x += GRID_CELL) {
      const isAxis = x === 0;
      const isMajor = !isAxis && x % GRID_MAJOR_CELL === 0;
      out.push(
        <Line
          key={`v${x}`}
          points={[x, startY, x, endY]}
          stroke={isAxis ? '#000' : isMajor ? '#bbb' : '#eee'}
          strokeWidth={isAxis ? 1 : isMajor ? 0.6 : 0.3}
        />,
      );
    }
    for (let y = startY; y <= endY; y += GRID_CELL) {
      const isAxis = y === 0;
      const isMajor = !isAxis && y % GRID_MAJOR_CELL === 0;
      out.push(
        <Line
          key={`h${y}`}
          points={[startX, y, endX, y]}
          stroke={isAxis ? '#000' : isMajor ? '#bbb' : '#eee'}
          strokeWidth={isAxis ? 1 : isMajor ? 0.6 : 0.3}
        />,
      );
    }
    return out;
  }, [width, height, stageOffsetX, stageOffsetY, stageX, stageY, stageScale]);

  return <Layer listening={false}>{lines}</Layer>;
};

export default GridLayer;
