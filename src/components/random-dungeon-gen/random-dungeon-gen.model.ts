
export interface RoomEntityModelRequest {
    entityCode: string;
    entityDesc: string;
    dimension: string;
    exits: string[];
}


export interface Chamber extends RoomEntity {
    shape: RoomShapeType;
    isLarge: boolean;
}

export interface Exit {
    exitType: ExitType;
    exitId?: string;
    toId?: string;
    isSecret: boolean;
}

export interface Door extends ExitEntity {
    doorType: DoorType;
    isLocked: boolean;
    isSecret: boolean;
    isFalse: boolean;
}

export interface Stair extends ExitEntity {
    stairType: StairType;
    levels: number;
}

export interface Passage extends RoomEntity {
}

export interface PassageWay extends ExitEntity {
    
}


export enum RoomShapeType {
    None = 0,
    Circle,
    Square,
    Rectangle,
    Octagon,
    Trapezoid,
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
    Stone,
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

export interface RoomEntity extends DungeonEntity {
    exits: Exit[];
    dimension: Dimension;
}

export interface ExitEntity extends DungeonEntity {
    roomIds?: string[];
}

export interface DungeonEntity {
    id: string;
    description?: string;
}