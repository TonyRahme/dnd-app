import { ExitEntity, RoomEntity } from "../random-dungeon-gen/random-dungeon-gen.model"


export type DungeonRenderUI = {
    startRoom: RoomEntity,
    dungeonMap: Map<string, RoomEntity>;
    exitMap: Map<string, ExitEntity>;
}