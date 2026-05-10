import { useCallback, useEffect, useRef, useState } from 'react';
import { DungeonGeneratorService } from '../shared/services/dungeon-generator.service';
import { ExitEntity, RoomEntity } from '../shared/model/dungeon-entity.model';
import { randomStartingAreaOptions, weightedRandom } from '../shared/dungeon.config';
import {
  DUNGEON_CHANNEL,
  DungeonMessage,
  DungeonSnapshot,
  PLAYER_HEARTBEAT_TIMEOUT_MS,
} from '../shared/dungeon.broadcast';
import { deserializeDungeon, DungeonSaveFile } from '../shared/dungeon.io';

const randomColor = (): string =>
  '#' + (0x1000000 + Math.random() * 0xffffff).toString(16).substring(1, 7);

const buildColors = (size: number): string[] => {
  const colors: string[] = [];
  for (let i = 0; i < size; i++) colors.push(randomColor());
  return colors;
};

export interface DragOffset {
  x: number;
  y: number;
}

export interface DungeonState {
  startRoom: RoomEntity | null;
  dungeonMap: Map<string, RoomEntity>;
  exitMap: Map<string, ExitEntity>;
  colors: string[];
  dragOffsets: Map<string, DragOffset>;
  revealedRoomIds: Set<string>;
  crawlMode: boolean;
}

export interface UseDungeonGenerator extends DungeonState {
  generate: () => void;
  reset: () => void;
  setDragOffset: (roomId: string, offset: DragOffset) => void;
  toggleRoomReveal: (roomId: string) => void;
  setCrawlMode: (on: boolean) => void;
  loadDungeon: (file: DungeonSaveFile) => void;
}

const buildSnapshot = (state: DungeonState): DungeonSnapshot => ({
  startRoomId: state.startRoom?.id ?? null,
  rooms: Array.from(state.dungeonMap.entries()),
  exits: Array.from(state.exitMap.entries()),
  colors: state.colors,
  dragOffsets: Array.from(state.dragOffsets.entries()),
  revealedRoomIds: Array.from(state.revealedRoomIds),
  crawlMode: state.crawlMode,
});

export const useDungeonGenerator = (): UseDungeonGenerator => {
  const generatorRef = useRef<DungeonGeneratorService | null>(null);
  if (!generatorRef.current) {
    generatorRef.current = new DungeonGeneratorService();
  }

  const [state, setState] = useState<DungeonState>({
    startRoom: null,
    dungeonMap: new Map(),
    exitMap: new Map(),
    colors: [],
    dragOffsets: new Map(),
    revealedRoomIds: new Set(),
    crawlMode: false,
  });

  const channelRef = useRef<BroadcastChannel | null>(null);
  if (!channelRef.current && typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    channelRef.current = new BroadcastChannel(DUNGEON_CHANNEL);
  }
  const lastHeartbeatAtRef = useRef<number>(0);

  const generate = useCallback(() => {
    const gen = generatorRef.current!;
    const code = weightedRandom(randomStartingAreaOptions);
    const startRoom = gen.dungeonGenerateGraph(code);
    const dungeonMap = gen.getDungeonMap();
    const exitMap = gen.getExitMap();
    setState((prev) => ({
      startRoom,
      dungeonMap,
      exitMap,
      colors: buildColors(dungeonMap.size),
      dragOffsets: new Map(),
      revealedRoomIds: prev.crawlMode && startRoom ? new Set([startRoom.id]) : new Set(),
      crawlMode: prev.crawlMode,
    }));
  }, []);

  const reset = useCallback(() => {
    setState((prev) => ({ ...prev, dragOffsets: new Map() }));
  }, []);

  const setDragOffset = useCallback((roomId: string, offset: DragOffset) => {
    setState((prev) => {
      const next = new Map(prev.dragOffsets);
      next.set(roomId, offset);
      return { ...prev, dragOffsets: next };
    });
  }, []);

  const toggleRoomReveal = useCallback((roomId: string) => {
    setState((prev) => {
      const next = new Set(prev.revealedRoomIds);
      if (next.has(roomId)) next.delete(roomId);
      else next.add(roomId);
      return { ...prev, revealedRoomIds: next };
    });
  }, []);

  const setCrawlMode = useCallback((on: boolean) => {
    setState((prev) => ({
      ...prev,
      crawlMode: on,
      revealedRoomIds: on && prev.startRoom ? new Set([prev.startRoom.id]) : new Set(),
    }));
  }, []);

  const loadDungeon = useCallback((file: DungeonSaveFile) => {
    const loaded = deserializeDungeon(file);
    setState({
      startRoom: loaded.startRoom,
      dungeonMap: loaded.dungeonMap,
      exitMap: loaded.exitMap,
      colors: loaded.colors,
      dragOffsets: loaded.dragOffsets,
      revealedRoomIds: new Set(),
      crawlMode: false,
    });
  }, []);

  useEffect(() => {
    generate();
  }, [generate]);

  // Broadcast state to the player window whenever it changes (DM is the source of truth).
  useEffect(() => {
    const channel = channelRef.current;
    if (!channel) return;
    const message: DungeonMessage = { type: 'state', payload: buildSnapshot(state) };
    channel.postMessage(message);
  }, [state]);

  // Respond to player-window messages: serve initial state on request, track heartbeats.
  useEffect(() => {
    const channel = channelRef.current;
    if (!channel) return;
    const onMessage = (e: MessageEvent<DungeonMessage>) => {
      if (e.data.type === 'request-state') {
        channel.postMessage({ type: 'state', payload: buildSnapshot(state) } satisfies DungeonMessage);
      } else if (e.data.type === 'player-heartbeat') {
        lastHeartbeatAtRef.current = Date.now();
      }
    };
    channel.addEventListener('message', onMessage);
    return () => channel.removeEventListener('message', onMessage);
  }, [state]);

  // While in crawl mode, auto-exit if no player tab has heartbeat'd within the timeout.
  // (This handles the case where the user moved the player view to a different tab —
  // the original popup closing is irrelevant; presence is what matters.)
  useEffect(() => {
    if (!state.crawlMode) return undefined;
    // Grace period: assume a heartbeat at the moment we entered crawl mode,
    // so the player tab has a window to send its first beat.
    lastHeartbeatAtRef.current = Date.now();
    const interval = window.setInterval(() => {
      if (Date.now() - lastHeartbeatAtRef.current > PLAYER_HEARTBEAT_TIMEOUT_MS) {
        setState((prev) =>
          prev.crawlMode ? { ...prev, crawlMode: false, revealedRoomIds: new Set() } : prev,
        );
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [state.crawlMode]);

  useEffect(
    () => () => {
      channelRef.current?.close();
      channelRef.current = null;
    },
    [],
  );

  return { ...state, generate, reset, setDragOffset, toggleRoomReveal, setCrawlMode, loadDungeon };
};
