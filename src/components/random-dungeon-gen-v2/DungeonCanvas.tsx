import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Line, Arrow } from 'react-konva';
import Konva from 'konva';
import { Menu, Item, useContextMenu, ItemParams } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';
import EntityTooltip from './EntityTooltip';
import RoomNode from './RoomNode';
import { ExitEntity, RoomEntity } from './shared/model/dungeon-entity.model';
import { Vector2 } from './shared/model/Transform';

const SCALE = 2;
const DEFAULT_HEIGHT = 800;
const ROOM_MENU_ID = 'dungeon-room-menu';

interface RoomMenuProps {
  roomId: string;
}

interface DungeonCanvasProps {
  startRoom: RoomEntity | null;
  dungeonMap: Map<string, RoomEntity>;
  exitMap: Map<string, ExitEntity>;
  colors: string[];
  showConnectors: boolean;
  showTooltip: boolean;
}

interface DragOffset {
  x: number;
  y: number;
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
  showConnectors,
  showTooltip,
}: DungeonCanvasProps): ReactElement => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1000);
  const [dragOffsets, setDragOffsets] = useState<Map<string, DragOffset>>(new Map());
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const { show: showRoomMenu } = useContextMenu<RoomMenuProps>({ id: ROOM_MENU_ID });

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Reset per-room drag offsets when a new dungeon arrives
  useEffect(() => {
    setDragOffsets(new Map());
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

  const handleDragMove = useCallback((roomId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    setDragOffsets((prev) => {
      const next = new Map(prev);
      next.set(roomId, { x: node.x(), y: node.y() });
      return next;
    });
  }, []);

  const handleHoverEnter = useCallback(
    (room: RoomEntity, e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      setHover({
        roomId: room.id,
        description: room.getDescription(),
        position: { x: pointer.x, y: pointer.y } as Vector2,
      });
    },
    [],
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

  const handleRevealRoom = useCallback(({ props }: ItemParams<RoomMenuProps>) => {
    if (!props) return;
    // TODO: hook into DM/player visibility state
    console.log('reveal room', props.roomId);
  }, []);

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
                onDragMove={handleDragMove}
                onClick={handleClick}
                onHoverEnter={handleHoverEnter}
                onHoverLeave={handleHoverLeave}
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
        <Item onClick={handleRevealRoom}>Reveal room</Item>
      </Menu>
    </div>
  );
};

export default DungeonCanvas;
