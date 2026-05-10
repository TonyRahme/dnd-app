import { ReactElement } from 'react';
import { Layer, Arrow } from 'react-konva';
import { ExitEntity, RoomEntity } from '../shared/model/dungeon-entity.model';
import { SCALE } from './constants';

interface DragOffset {
  x: number;
  y: number;
}

interface ConnectorsLayerProps {
  exits: ExitEntity[];
  dungeonMap: Map<string, RoomEntity>;
  dragOffsets: Map<string, DragOffset>;
}

const offsetFor = (id: string, offsets: Map<string, DragOffset>): DragOffset =>
  offsets.get(id) ?? { x: 0, y: 0 };

/** Connector endpoints derive from each room's center plus its drag offset. */
const computePoints = (
  fromRoom: RoomEntity,
  toRoom: RoomEntity,
  fromOffset: DragOffset,
  toOffset: DragOffset,
): number[] => {
  const fromCx = fromRoom.transform.center.x * SCALE + fromOffset.x;
  const fromCy = fromRoom.transform.center.y * SCALE + fromOffset.y;
  const toCx = toRoom.transform.center.x * SCALE + toOffset.x;
  const toCy = toRoom.transform.center.y * SCALE + toOffset.y;
  const dx = toCx - fromCx;
  const dy = toCy - fromCy;
  const angle = Math.atan2(-dy, dx);
  const radius = 5 * SCALE;
  return [
    fromCx + -radius * Math.cos(angle + Math.PI),
    fromCy + radius * Math.sin(angle + Math.PI),
    toCx + -radius * Math.cos(angle),
    toCy + radius * Math.sin(angle),
  ];
};

const ConnectorsLayer = ({
  exits,
  dungeonMap,
  dragOffsets,
}: ConnectorsLayerProps): ReactElement => (
  <Layer listening={false}>
    {exits.map((exit) => {
      const [fromId, toId] = exit.roomIds;
      if (!fromId || !toId) return null;
      const fromRoom = dungeonMap.get(fromId);
      const toRoom = dungeonMap.get(toId);
      if (!fromRoom || !toRoom) return null;
      const points = computePoints(
        fromRoom,
        toRoom,
        offsetFor(fromId, dragOffsets),
        offsetFor(toId, dragOffsets),
      );
      return (
        <Arrow
          key={`connector-${exit.id}`}
          points={points}
          fill="black"
          stroke="black"
          strokeWidth={1}
        />
      );
    })}
  </Layer>
);

export default ConnectorsLayer;
