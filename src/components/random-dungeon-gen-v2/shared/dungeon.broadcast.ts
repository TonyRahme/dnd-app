import { ExitEntity, RoomEntity } from './model/dungeon-entity.model';
import { DragOffset } from '../hooks/useDungeonGenerator';

export const DUNGEON_CHANNEL = 'dnd-dungeon-crawl';

/**
 * Snapshot of dungeon state shared between DM and Player windows.
 * Sent through BroadcastChannel; structuredClone strips class methods,
 * so the Player view treats rooms/exits as plain data (never calls methods).
 */
export interface DungeonSnapshot {
  startRoomId: string | null;
  rooms: Array<[string, RoomEntity]>;
  exits: Array<[string, ExitEntity]>;
  colors: string[];
  dragOffsets: Array<[string, DragOffset]>;
  revealedRoomIds: string[];
  crawlMode: boolean;
}

export type DungeonMessage =
  | { type: 'state'; payload: DungeonSnapshot }
  | { type: 'request-state' }
  | { type: 'player-heartbeat' };

/** How often the player view announces presence to the DM. */
export const PLAYER_HEARTBEAT_INTERVAL_MS = 1000;
/**
 * If no heartbeat arrives for this long, the DM treats all player tabs
 * as gone and auto-exits crawl mode. Generous to tolerate brief tab
 * backgrounding, where setInterval can be throttled.
 */
export const PLAYER_HEARTBEAT_TIMEOUT_MS = 5000;
