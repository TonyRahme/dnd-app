import { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Circle, Line, Group } from 'react-konva';
import Konva from 'konva';
import { ExitEntity, RoomEntity, Door, Chamber } from './shared/model/dungeon-entity.model';
import { ExitType, RoomShapeType } from './shared/model/dungeon-type.model';
import {
  DUNGEON_CHANNEL,
  DungeonMessage,
  DungeonSnapshot,
  PLAYER_HEARTBEAT_INTERVAL_MS,
} from './shared/dungeon.broadcast';

const SCALE = 2;

const isCircleRoom = (room: RoomEntity): boolean =>
  (room as Chamber).shape === RoomShapeType.Circle;

const isSecretExit = (exit: ExitEntity): boolean =>
  exit.exitType === ExitType.Door && (exit as Door).isSecret === true;

const PlayerView = (): ReactElement => {
  const [snapshot, setSnapshot] = useState<DungeonSnapshot | null>(null);
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });
  const stageRef = useRef<Konva.Stage | null>(null);

  // Connect to the broadcast channel, request initial state, and announce presence
  // via a heartbeat so the DM can detect when no player tab is viewing anymore.
  useEffect(() => {
    if (!('BroadcastChannel' in window)) return undefined;
    const channel = new BroadcastChannel(DUNGEON_CHANNEL);
    const onMessage = (e: MessageEvent<DungeonMessage>) => {
      if (e.data.type === 'state') setSnapshot(e.data.payload);
    };
    channel.addEventListener('message', onMessage);
    channel.postMessage({ type: 'request-state' } satisfies DungeonMessage);
    const beat = () => channel.postMessage({ type: 'player-heartbeat' } satisfies DungeonMessage);
    beat();
    const heartbeatId = window.setInterval(beat, PLAYER_HEARTBEAT_INTERVAL_MS);
    return () => {
      window.clearInterval(heartbeatId);
      channel.removeEventListener('message', onMessage);
      channel.close();
    };
  }, []);

  useEffect(() => {
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Pinch-or-wheel zoom around the cursor.
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const scaleBy = 1.05;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const mousePoint = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clamped = Math.max(0.2, Math.min(5, newScale));
    stage.scale({ x: clamped, y: clamped });
    stage.position({
      x: pointer.x - mousePoint.x * clamped,
      y: pointer.y - mousePoint.y * clamped,
    });
  }, []);

  const dungeonMap = useMemo(
    () => (snapshot ? new Map(snapshot.rooms) : new Map<string, RoomEntity>()),
    [snapshot],
  );
  const exitMap = useMemo(
    () => (snapshot ? new Map(snapshot.exits) : new Map<string, ExitEntity>()),
    [snapshot],
  );
  const dragOffsets = useMemo(
    () => (snapshot ? new Map(snapshot.dragOffsets) : new Map<string, { x: number; y: number }>()),
    [snapshot],
  );
  const revealedRoomIds = useMemo(
    () => (snapshot ? new Set(snapshot.revealedRoomIds) : new Set<string>()),
    [snapshot],
  );
  const startRoom = useMemo(
    () => (snapshot?.startRoomId ? dungeonMap.get(snapshot.startRoomId) ?? null : null),
    [snapshot, dungeonMap],
  );

  const visibleRooms = useMemo(
    () => Array.from(dungeonMap.values()).filter((room) => revealedRoomIds.has(room.id)),
    [dungeonMap, revealedRoomIds],
  );

  // A secret exit is only visible once BOTH connected rooms are revealed
  // (i.e. the DM revealed the room behind the secret door).
  const isExitVisibleToPlayer = useCallback(
    (exit: ExitEntity): boolean => {
      if (!isSecretExit(exit)) return true;
      const [a, b] = exit.roomIds;
      return revealedRoomIds.has(a) && revealedRoomIds.has(b);
    },
    [revealedRoomIds],
  );

  if (!snapshot || !snapshot.crawlMode) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <h2>Player Screen</h2>
        <p>
          {snapshot
            ? 'The Dungeon Master is not in Dungeon Crawl mode.'
            : 'Waiting for the Dungeon Master…'}
        </p>
      </div>
    );
  }

  const stageOffsetX = startRoom ? -size.width / 2 - startRoom.transform.center.x : 0;
  const stageOffsetY = startRoom ? -size.height / 2 - startRoom.transform.center.y : 0;

  return (
    <div style={{ background: '#111', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        offsetX={stageOffsetX}
        offsetY={stageOffsetY}
        draggable
        onWheel={handleWheel}
      >
        <Layer listening={false}>
          <Line
            points={[0, -size.height / 2, 0, size.height / 2]}
            stroke="#333"
            strokeWidth={3}
            dash={[25, 10]}
          />
          <Line
            points={[-size.width / 2, 0, size.width / 2, 0]}
            stroke="#333"
            strokeWidth={3}
            dash={[25, 10]}
          />
        </Layer>

        <Layer listening={false}>
          {visibleRooms.map((room) => {
            const colorIdx = Array.from(dungeonMap.keys()).indexOf(room.id);
            const color = snapshot.colors[colorIdx] ?? '#888';
            const offset = dragOffsets.get(room.id) ?? { x: 0, y: 0 };
            return (
              <Group key={room.id} x={offset.x} y={offset.y}>
                {isCircleRoom(room) ? (
                  <Circle
                    x={room.transform.center.x * SCALE}
                    y={room.transform.center.y * SCALE}
                    radius={(room.transform.dimension.x / 2) * SCALE}
                    fill={color}
                    stroke="#fff"
                    strokeWidth={1}
                  />
                ) : (
                  <Rect
                    x={room.transform.position.x * SCALE}
                    y={room.transform.position.y * SCALE}
                    width={room.transform.dimension.x * SCALE}
                    height={room.transform.dimension.y * SCALE}
                    fill={color}
                    stroke="#fff"
                    strokeWidth={1}
                  />
                )}
                {room.exitsIds.map((exitId) => {
                  const exit = exitMap.get(exitId);
                  if (!exit) return null;
                  if (!isExitVisibleToPlayer(exit)) return null;
                  return (
                    <Circle
                      key={exitId}
                      x={exit.transform.center.x * SCALE}
                      y={exit.transform.center.y * SCALE}
                      radius={2.5 * SCALE}
                      fill="green"
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  );
                })}
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default PlayerView;
