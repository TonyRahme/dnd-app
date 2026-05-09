import { ReactElement } from 'react';
import { Group, Circle, Rect } from 'react-konva';
import Konva from 'konva';
import { ExitEntity, RoomEntity, Door, Chamber } from './shared/model/dungeon-entity.model';
import { ExitType, RoomShapeType } from './shared/model/dungeon-type.model';

const SCALE = 2;

const isCircleRoom = (room: RoomEntity): boolean =>
  (room as Chamber).shape === RoomShapeType.Circle;

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
  onDragMove: (roomId: string, e: Konva.KonvaEventObject<DragEvent>) => void;
  onClick: (roomId: string) => void;
  onHoverEnter: (room: RoomEntity, e: Konva.KonvaEventObject<MouseEvent>) => void;
  onHoverLeave: () => void;
  onContextMenu: (roomId: string, e: Konva.KonvaEventObject<PointerEvent>) => void;
}

const RoomNode = ({
  room,
  exitMap,
  color,
  offsetX,
  offsetY,
  isSelected,
  onDragMove,
  onClick,
  onHoverEnter,
  onHoverLeave,
  onContextMenu,
}: RoomNodeProps): ReactElement => {
  const strokeWidth = isSelected ? 5 : 1;
  const dash = isSelected ? [10, 3] : [];

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
      {isCircleRoom(room) ? (
        <Circle
          {...sharedShapeProps}
          x={room.transform.center.x * SCALE}
          y={room.transform.center.y * SCALE}
          radius={(room.transform.dimension.x / 2) * SCALE}
        />
      ) : (
        <Rect
          {...sharedShapeProps}
          x={room.transform.position.x * SCALE}
          y={room.transform.position.y * SCALE}
          width={room.transform.dimension.x * SCALE}
          height={room.transform.dimension.y * SCALE}
        />
      )}
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
          />
        );
      })}
    </Group>
  );
};

export default RoomNode;
