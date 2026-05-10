import { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { useContextMenu } from 'react-contexify';
import EntityTooltip from './EntityTooltip';
import RoomNode from './RoomNode';
import GridLayer from './GridLayer';
import ConnectorsLayer from './ConnectorsLayer';
import RoomMenu, { ROOM_MENU_ID, RoomMenuItemProps } from './RoomMenu';
import { ExitEntity, RoomEntity, Door } from '../shared/model/dungeon-entity.model';
import { ExitType, DoorType } from '../shared/model/dungeon-type.model';
import { Vector2 } from '../shared/model/Transform';
import { DEFAULT_HEIGHT } from './constants';

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
  entityId: string;
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
  const [stagePos, setStagePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState<number>(1);
  const { show: showRoomMenu } = useContextMenu<RoomMenuItemProps>({ id: ROOM_MENU_ID });

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

  const handleStageDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    if (e.target === e.currentTarget) {
      setStagePos({ x: e.target.x(), y: e.target.y() });
    }
  }, []);

  // Wheel-zoom anchored on the cursor (clamped 0.2x – 5x). Driving stage
  // scale + position from React state keeps the grid math in sync.
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = e.target.getStage();
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const scaleBy = 1.05;
      const oldScale = stageScale;
      const point = {
        x: (pointer.x - stagePos.x) / oldScale,
        y: (pointer.y - stagePos.y) / oldScale,
      };
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      const clamped = Math.max(0.2, Math.min(5, newScale));
      setStageScale(clamped);
      setStagePos({
        x: pointer.x - point.x * clamped,
        y: pointer.y - point.y * clamped,
      });
    },
    [stageScale, stagePos],
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
  const showHoverFor = useCallback(
    (entityId: string, description: string, e: Konva.KonvaEventObject<MouseEvent>) => {
      const rect = e.target.getClientRect();
      setHover({
        entityId,
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

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <Stage
        width={width}
        height={DEFAULT_HEIGHT}
        offsetX={stageOffsetX}
        offsetY={stageOffsetY}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        draggable
        onDragMove={handleStageDragMove}
        onWheel={handleWheel}
        className="border border-dark"
      >
        <GridLayer
          width={width}
          height={DEFAULT_HEIGHT}
          stageOffsetX={stageOffsetX}
          stageOffsetY={stageOffsetY}
          stageX={stagePos.x}
          stageY={stagePos.y}
          stageScale={stageScale}
        />

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

        {showConnectors && (
          <ConnectorsLayer exits={exits} dungeonMap={dungeonMap} dragOffsets={dragOffsets} />
        )}
      </Stage>

      <EntityTooltip
        position={hover?.position ?? null}
        description={hover?.description ?? ''}
        isHidden={!showTooltip || !hover}
      />

      <RoomMenu
        crawlMode={crawlMode}
        revealedRoomIds={revealedRoomIds}
        onToggleReveal={onToggleReveal}
      />
    </div>
  );
};

export default DungeonCanvas;
