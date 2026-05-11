import { ReactElement } from 'react';
import { Group, Circle, Rect, Line, Text } from 'react-konva';
import Konva from 'konva';
import { ExitEntity, RoomEntity, Door, Chamber } from '../shared/model/dungeon-entity.model';
import { ExitType, RoomShapeType } from '../shared/model/dungeon-type.model';
import { octagonVertices, trapezoidVertices, directionToNarrow } from '../shared/collision';
import { SCALE } from './constants';
import RoomGrid from './RoomGrid';

const chamberShape = (room: RoomEntity): RoomShapeType | undefined =>
  (room as Chamber).shape;

const isPolygonRoom = (room: RoomEntity): boolean => {
  const s = chamberShape(room);
  return s === RoomShapeType.Octagon || s === RoomShapeType.Trapezoid;
};

const polygonPointsFor = (room: RoomEntity): number[] => {
  const t = room.transform;
  const cx = t.center.x;
  const cy = t.center.y;
  const hx = t.dimension.x / 2;
  const hy = t.dimension.y / 2;
  const verts =
    chamberShape(room) === RoomShapeType.Octagon
      ? octagonVertices(cx, cy, hx, hy)
      : trapezoidVertices(cx, cy, hx, hy, directionToNarrow(t.direction));
  // Flatten into Konva's [x0,y0,x1,y1,...] in pixel coords.
  const flat: number[] = [];
  for (const v of verts) flat.push(v.x * SCALE, v.y * SCALE);
  return flat;
};

const exitFill = (exit: ExitEntity): string => {
  if (exit.exitType !== ExitType.Door) return 'green';
  const door = exit as Door;
  return door.isLocked || door.isSecret || door.isTrap ? 'red' : 'green';
};

interface RoomNodeProps {
  room: RoomEntity;
  exitMap: Map<string, ExitEntity>;
  color: string;
  offsetX: number;
  offsetY: number;
  isSelected: boolean;
  showHiddenIndicator?: boolean;
  onDragMove: (roomId: string, e: Konva.KonvaEventObject<DragEvent>) => void;
  onClick: (roomId: string) => void;
  onHoverEnter: (room: RoomEntity, e: Konva.KonvaEventObject<MouseEvent>) => void;
  onHoverLeave: () => void;
  onExitHoverEnter: (exit: ExitEntity, e: Konva.KonvaEventObject<MouseEvent>) => void;
  onExitHoverLeave: () => void;
  onContextMenu: (roomId: string, e: Konva.KonvaEventObject<PointerEvent>) => void;
}

const RoomNode = ({
  room,
  exitMap,
  color,
  offsetX,
  offsetY,
  isSelected,
  showHiddenIndicator = false,
  onDragMove,
  onClick,
  onHoverEnter,
  onHoverLeave,
  onExitHoverEnter,
  onExitHoverLeave,
  onContextMenu,
}: RoomNodeProps): ReactElement => {
  const strokeWidth = isSelected ? 5 : 1;
  const dash = isSelected ? [10, 3] : [];
  const centerX = room.transform.center.x * SCALE;
  const centerY = room.transform.center.y * SCALE;

  const sharedShapeProps = {
    id: room.id,
    fill: color,
    stroke: '#000',
    strokeWidth,
    dash,
    onMouseEnter: (e: Konva.KonvaEventObject<MouseEvent>) => onHoverEnter(room, e),
    onMouseLeave: onHoverLeave,
    onContextMenu: (e: Konva.KonvaEventObject<PointerEvent>) => onContextMenu(room.id, e),
  };

  return (
    <Group
      id={room.id}
      draggable
      x={offsetX}
      y={offsetY}
      onDragMove={(e) => onDragMove(room.id, e)}
      onClick={() => onClick(room.id)}
      onTap={() => onClick(room.id)}
    >
      {(() => {
        const shape = chamberShape(room);
        if (shape === RoomShapeType.Circle) {
          return (
            <Circle
              {...sharedShapeProps}
              x={room.transform.center.x * SCALE}
              y={room.transform.center.y * SCALE}
              radius={(room.transform.dimension.x / 2) * SCALE}
            />
          );
        }
        if (isPolygonRoom(room)) {
          return (
            <Line
              {...sharedShapeProps}
              points={polygonPointsFor(room)}
              closed
            />
          );
        }
        // Rect rooms: render via center + offset + rotation so the
        // rotation === 0 case is identical to the previous top-left
        // form, and rotated rooms (from circle exits) render correctly
        // around their center.
        const rectW = room.transform.dimension.x * SCALE;
        const rectH = room.transform.dimension.y * SCALE;
        const rotDeg = ((room.transform.rotation ?? 0) * 180) / Math.PI;
        return (
          <Rect
            {...sharedShapeProps}
            x={room.transform.center.x * SCALE}
            y={room.transform.center.y * SCALE}
            offsetX={rectW / 2}
            offsetY={rectH / 2}
            width={rectW}
            height={rectH}
            rotation={rotDeg}
          />
        );
      })()}
      <RoomGrid room={room} />
      {room.exitsIds.map((exitId) => {
        const exit = exitMap.get(exitId);
        if (!exit) return null;
        return (
          <Circle
            key={exitId}
            id={exitId}
            x={exit.transform.center.x * SCALE}
            y={exit.transform.center.y * SCALE}
            radius={2.5 * SCALE}
            fill={exitFill(exit)}
            stroke="#000"
            strokeWidth={1}
            onMouseEnter={(e) => onExitHoverEnter(exit, e)}
            onMouseLeave={onExitHoverLeave}
          />
        );
      })}
      {showHiddenIndicator && (
        <Text
          x={centerX - 10}
          y={centerY - 14}
          text="?"
          fontSize={28}
          fontStyle="bold"
          fill="#fff"
          stroke="#000"
          strokeWidth={1}
          listening={false}
        />
      )}
    </Group>
  );
};

export default RoomNode;
