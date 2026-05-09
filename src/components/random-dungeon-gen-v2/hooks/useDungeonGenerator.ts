import { useCallback, useEffect, useRef, useState } from 'react';
import { DungeonGeneratorService } from '../shared/services/dungeon-generator.service';
import { ExitEntity, RoomEntity } from '../shared/model/dungeon-entity.model';
import { randomStartingAreaOptions, weightedRandom } from '../shared/dungeon.config';

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
}

export interface UseDungeonGenerator extends DungeonState {
  generate: () => void;
  reset: () => void;
  setDragOffset: (roomId: string, offset: DragOffset) => void;
}

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
  });

  const generate = useCallback(() => {
    const gen = generatorRef.current!;
    const code = weightedRandom(randomStartingAreaOptions);
    const startRoom = gen.dungeonGenerateGraph(code);
    const dungeonMap = gen.getDungeonMap();
    const exitMap = gen.getExitMap();
    setState({
      startRoom,
      dungeonMap,
      exitMap,
      colors: buildColors(dungeonMap.size),
      dragOffsets: new Map(),
    });
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

  useEffect(() => {
    generate();
  }, [generate]);

  return { ...state, generate, reset, setDragOffset };
};
