import {
  Chamber,
  Passage,
  Door,
  PassageWay,
  RoomEntity,
  ExitEntity,
} from './model/dungeon-entity.model';
import { ExitType, DoorType } from './model/dungeon-type.model';

export const SAVE_FORMAT_VERSION = 1;

export interface DungeonSaveFile {
  version: number;
  savedAt: string;
  startRoomId: string | null;
  colors: string[];
  /** Per-room drag offsets, serialized as [id, {x, y}] tuples. */
  dragOffsets: Array<[string, { x: number; y: number }]>;
  /** Room instances; Chambers carry `shape` + `isLarge`, Passages do not. */
  rooms: unknown[];
  /** Exit instances; Doors carry door props, others rely on `exitType` only. */
  exits: unknown[];
}

interface DeserializedDungeon {
  startRoom: RoomEntity | null;
  dungeonMap: Map<string, RoomEntity>;
  exitMap: Map<string, ExitEntity>;
  colors: string[];
  dragOffsets: Map<string, { x: number; y: number }>;
}

interface SerializableState {
  startRoom: RoomEntity | null;
  dungeonMap: Map<string, RoomEntity>;
  exitMap: Map<string, ExitEntity>;
  colors: string[];
  dragOffsets: Map<string, { x: number; y: number }>;
}

/**
 * Build a save-file object. JSON.stringify serializes class instances via
 * their enumerable own properties — that's enough on the wire because
 * `deserializeDungeon` reconstructs the right subclass on load.
 */
export const serializeDungeon = (state: SerializableState): DungeonSaveFile => ({
  version: SAVE_FORMAT_VERSION,
  savedAt: new Date().toISOString(),
  startRoomId: state.startRoom?.id ?? null,
  colors: state.colors,
  dragOffsets: Array.from(state.dragOffsets.entries()),
  rooms: Array.from(state.dungeonMap.values()),
  exits: Array.from(state.exitMap.values()),
});

const isObject = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object';

const reconstructRoom = (raw: unknown): RoomEntity => {
  if (!isObject(raw)) throw new Error('Invalid room entry');
  const id = String(raw.id);
  const transform = raw.transform as RoomEntity['transform'];
  const exitsIds = Array.isArray(raw.exitsIds) ? (raw.exitsIds as string[]) : [];
  // Chambers persist `shape` + `isLarge`. Passages don't.
  if ('shape' in raw && raw.shape !== undefined) {
    return new Chamber(id, transform, raw.shape as number, Boolean(raw.isLarge), exitsIds);
  }
  return new Passage(id, transform, exitsIds);
};

const reconstructExit = (raw: unknown): ExitEntity => {
  if (!isObject(raw)) throw new Error('Invalid exit entry');
  const id = String(raw.id);
  const transform = raw.transform as ExitEntity['transform'];
  const exitType = raw.exitType as ExitType;
  const roomIds = Array.isArray(raw.roomIds) ? (raw.roomIds as string[]) : [];
  if (exitType === ExitType.Door) {
    return new Door(id, transform, exitType, roomIds, {
      doorType: (raw.doorType as DoorType) ?? DoorType.Wooden,
      isLocked: Boolean(raw.isLocked),
      isSecret: Boolean(raw.isSecret),
      isTrap: Boolean(raw.isTrap),
    });
  }
  return new PassageWay(id, transform, exitType, roomIds);
};

export const deserializeDungeon = (file: unknown): DeserializedDungeon => {
  if (!isObject(file)) throw new Error('Save file is not an object');
  if (!Array.isArray(file.rooms) || !Array.isArray(file.exits)) {
    throw new Error('Save file is missing rooms/exits arrays');
  }
  const dungeonMap = new Map<string, RoomEntity>();
  for (const raw of file.rooms) {
    const room = reconstructRoom(raw);
    dungeonMap.set(room.id, room);
  }
  const exitMap = new Map<string, ExitEntity>();
  for (const raw of file.exits) {
    const exit = reconstructExit(raw);
    exitMap.set(exit.id, exit);
  }
  const startRoomId = typeof file.startRoomId === 'string' ? file.startRoomId : null;
  const startRoom = startRoomId ? dungeonMap.get(startRoomId) ?? null : null;
  const colors = Array.isArray(file.colors) ? (file.colors as string[]) : [];
  const dragOffsets = new Map<string, { x: number; y: number }>(
    Array.isArray(file.dragOffsets)
      ? (file.dragOffsets as Array<[string, { x: number; y: number }]>)
      : [],
  );
  return { startRoom, dungeonMap, exitMap, colors, dragOffsets };
};

/** Trigger a browser download of the given save file as JSON. */
export const downloadDungeonFile = (file: DungeonSaveFile, filename?: string): void => {
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? `dungeon-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
