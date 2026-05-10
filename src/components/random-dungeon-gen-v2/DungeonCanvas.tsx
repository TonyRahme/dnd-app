import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Line, Arrow } from 'react-konva';
import Konva from 'konva';
import { Menu, Item, useContextMenu, ItemParams, BooleanPredicate } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';
import EntityTooltip from './EntityTooltip';
import RoomNode from './RoomNode';
import { ExitEntity, RoomEntity, Door } from './shared/model/dungeon-entity.model';
import { ExitType, DoorType } from './shared/model/dungeon-type.model';
import { Vector2 } from './shared/model/Transform';

const SCALE = 2;
const DEFAULT_HEIGHT = 800;
const ROOM_MENU_ID = 'dungeon-room-menu';

// Format an exit's properties as comma-separated key:value pairs so the
// EntityTooltip's regex parser can render each on its own line.
const formatExitDescription = (exit: ExitEntity): string => {
  const props: string[] = [];
  if (exit.exitType === ExitType.Door) {
    const door = exit as Door;
    props.push(`Type: Door (${DoorType[door.doorType]})`);
    props.push(`Connects: ${exit.roomIds.join(' & ')}`);
    props.push(`Locked: ${door.isLocked ? 'Yes' : 'No'}`);
    props.push(`Secret: ${door.isSecret ? 'Yes' : 'No'}`);
    props.push(`Trapped: ${door.isTrap ? 'Yes' : 'No'}`);
  } else {
    props.push(`Type: ${ExitType[exit.exitType]}`);
    props.push(`Connects: ${exit.roomIds.join(' & ')}`);
  }
  return props.join(', ');
};

interface RoomMenuProps {
  roomId: string;
}

interface DragOffset {
  x: number;
  y: number;
}

interface DungeonCanvasProps {
  startRoom: RoomEntity | null;
  dungeonMap: Map<string, RoomEntity>;
  exitMap: Map<string, ExitEntity>;
  colors: string[];
  dragOffsets: Map<string, DragOffset>;
  onDragOffset: (roomId: string, offset: DragOffset) => void;
  revealedRoomIds: Set<string>;
  crawlMode: boolean;
  onToggleReveal: (roomId: string) => void;
  showConnectors: boolean;
  showTooltip: boolean;
}

interface HoverInfo {
  roomId: string;
  description: string;
  position: Vector2;
}

const DungeonCanvas = ({
  startRoom,
  dungeonMap,
  exitMap,
  colors,
  dragOffsets,
  onDragOffset,
  revealedRoomIds,
  crawlMode,
  onToggleReveal,
  showConnectors,
  showTooltip,
}: DungeonCanvasProps): ReactElement => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1000);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const { show: showRoomMenu } = useContextMenu<RoomMenuProps>({ id: ROOM_MENU_ID });

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    setSelectedRoomId(startRoom?.id ?? null);
    setHover(null);
  }, [startRoom]);

  const rooms = useMemo(() => Array.from(dungeonMap.values()), [dungeonMap]);
  const exits = useMemo(() => Array.from(exitMap.values()), [exitMap]);

  const stageOffsetX = startRoom ? -width / 2 - startRoom.transform.center.x : 0;
  const stageOffsetY = startRoom ? -DEFAULT_HEIGHT / 2 - startRoom.transform.center.y : 0;

  const offsetFor = useCallback(
    (roomId: string): DragOffset => dragOffsets.get(roomId) ?? { x: 0, y: 0 },
    [dragOffsets],
  );

  const handleDragMove = useCallback(
    (roomId: string, e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      onDragOffset(roomId, { x: node.x(), y: node.y() });
    },
    [onDragOffset],
  );

  // Anchor the tooltip to the top-center of the hovered shape, in stage-container
  // pixel coords, so it renders directly above the chamber without covering it.
  // No `relativeTo` here: that returns local stage coords (which include the stage
  // offset/pan and would push the tooltip outside the map).
  const showHoverFor = useCallback(
    (entityId: string, description: string, e: Konva.KonvaEventObject<MouseEvent>) => {
      const rect = e.target.getClientRect();
      setHover({
        roomId: entityId,
        description,
        position: { x: rect.x + rect.width / 2, y: rect.y } as Vector2,
      });
    },
    [],
  );

  const handleHoverEnter = useCallback(
    (room: RoomEntity, e: Konva.KonvaEventObject<MouseEvent>) => {
      showHoverFor(room.id, room.getDescription(), e);
    },
    [showHoverFor],
  );

  const handleExitHoverEnter = useCallback(
    (exit: ExitEntity, e: Konva.KonvaEventObject<MouseEvent>) => {
      showHoverFor(exit.id, formatExitDescription(exit), e);
    },
    [showHoverFor],
  );

  const handleHoverLeave = useCallback(() => {
    setHover(null);
  }, []);

  const handleClick = useCallback((roomId: string) => {
    setSelectedRoomId(roomId);
  }, []);

  const handleRoomContextMenu = useCallback(
    (roomId: string, e: Konva.KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault();
      setHover(null);
      showRoomMenu({ event: e.evt, props: { roomId } });
    },
    [showRoomMenu],
  );

  const handleRevealRoom = useCallback(
    ({ props }: ItemParams<RoomMenuProps>) => {
      if (!props) return;
      onToggleReveal(props.roomId);
    },
    [onToggleReveal],
  );

  // Connector endpoints derive from room.transform.center plus the room's drag offset.
  const connectorPoints = useCallback(
    (fromRoomId: string, toRoomId: string): number[] | null => {
      const fromRoom = dungeonMap.get(fromRoomId);
      const toRoom = dungeonMap.get(toRoomId);
      if (!fromRoom || !toRoom) return null;
      const fromOffset = offsetFor(fromRoomId);
      const toOffset = offsetFor(toRoomId);
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
    },
    [dungeonMap, offsetFor],
  );

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <Stage
        width={width}
        height={DEFAULT_HEIGHT}
        offsetX={stageOffsetX}
        offsetY={stageOffsetY}
        draggable
        className="border border-dark"
      >
        {/* Grid layer */}
        <Layer listening={false}>
          <Line
            points={[0, -DEFAULT_HEIGHT / 2, 0, DEFAULT_HEIGHT / 2]}
            stroke="black"
            strokeWidth={5}
            dash={[25, 10]}
          />
          <Line
            points={[-width / 2, 0, width / 2, 0]}
            stroke="black"
            strokeWidth={5}
            dash={[25, 10]}
          />
        </Layer>

        {/* Dungeon layer (rooms + exits per room, draggable as a group) */}
        <Layer>
          {rooms.map((room, idx) => {
            const offset = offsetFor(room.id);
            return (
              <RoomNode
                key={room.id}
                room={room}
                exitMap={exitMap}
                color={colors[idx]}
                offsetX={offset.x}
                offsetY={offset.y}
                isSelected={selectedRoomId === room.id}
                showHiddenIndicator={crawlMode && !revealedRoomIds.has(room.id)}
                onDragMove={handleDragMove}
                onClick={handleClick}
                onHoverEnter={handleHoverEnter}
                onHoverLeave={handleHoverLeave}
                onExitHoverEnter={handleExitHoverEnter}
                onExitHoverLeave={handleHoverLeave}
                onContextMenu={handleRoomContextMenu}
              />
            );
          })}
        </Layer>

        {/* Connectors layer */}
        {showConnectors && (
          <Layer listening={false}>
            {exits.map((exit) => {
              const [from, to] = exit.roomIds;
              if (!from || !to) return null;
              const points = connectorPoints(from, to);
              if (!points) return null;
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
        )}
      </Stage>

      <EntityTooltip
        position={hover?.position ?? null}
        description={hover?.description ?? ''}
        isHidden={!showTooltip || !hover}
      />

      <Menu id={ROOM_MENU_ID}>
        <Item
          onClick={handleRevealRoom}
          hidden={
            (({ props }) =>
              !crawlMode || !props || revealedRoomIds.has((props as RoomMenuProps).roomId)) as BooleanPredicate
          }
        >
          Reveal room
        </Item>
        <Item
          onClick={handleRevealRoom}
          hidden={
            (({ props }) =>
              !crawlMode || !props || !revealedRoomIds.has((props as RoomMenuProps).roomId)) as BooleanPredicate
          }
        >
          Hide room
        </Item>
      </Menu>
    </div>
  );
};

export default DungeonCanvas;
