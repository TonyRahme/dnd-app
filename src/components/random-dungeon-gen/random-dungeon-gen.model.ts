export interface Chamber extends DungeonEntity {
    shape: RoomShape;
    dimension: Dimension;
    exits: Exit[];
    isLarge: boolean;
}

export enum RoomShape {
    None = 0,
    Circle,
    Square,
    Rectangle,
    Octagon,
    Trapezoid,
}

export interface Exit {
    exitType: ExitType;
    exit?: Door | Passage | Stair;
    to: Chamber | Passage;
}

export interface Door extends DungeonEntity {
    doorType: DoorType;
    isLocked: boolean;
    isSecret: boolean;
    isFalse: boolean;
}

export interface Passage extends DungeonEntity {
    dimension: Dimension;
    exits?: (Chamber | Door | Passage | Stair)[]
}

export interface Stair extends DungeonEntity {
    stairType: StairType;
    levels: number;
}

export enum ExitType {
    Door = 1,
    Passage,
    Stair,
}

export enum StairType {
    Steps = 1,
    Shaft, 
    Chimney,
}

export enum DoorType {
    Wooden = 1,
    Iron,
    Portcullis,
    Secret,
    Other,
}

export interface Dimension {
    length: number;
    width: number;
    height: number;
    x: number;
    y: number;
    z: number;
}

export interface DungeonEntity {
    description?: string;
}