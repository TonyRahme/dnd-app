
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

export interface ExitDTO {
    exitType: ExitType;
    exitId: string;
    isSecret: boolean;
    position: Vector2;
    direction: CardinalDirectionName;
    isTrap: boolean;
    isLocked: boolean;
    toId?: string;
}

export interface Door extends ExitEntity {
    doorType: DoorType;
    isLocked: boolean;
    isSecret: boolean;
    isTrap: boolean;
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

export interface Transform {
    length: number;
    width: number;
    height: number;
    center: Vector2;
    position: Vector3;
    direction: CardinalDirectionName;
}

export const enum CardinalDirectionName {
    East='East',
    North='North',
    West='West',
    South='South',
}

export const CardinalDirectionVector2 = {
    [CardinalDirectionName.East]: {x: 1, y:0} as Vector2,
    [CardinalDirectionName.North]: {x: 0, y:1} as Vector2,
    [CardinalDirectionName.West]: {x: -1, y:0} as Vector2,
    [CardinalDirectionName.South]: {x: 0, y:-1} as Vector2,
}



export class Vector2 {
    public x: number;
    public y: number;
    constructor(newX=0, newY=0){
        this.x=newX;
        this.y=newY;
    }
}

export class Vector3 extends Vector2 {
    public z: number;
    constructor(newX=0, newY=0, newZ=0){
        super(newX, newY);
        this.z=newZ;
    }
}

export interface RoomEntity extends DungeonEntity {
    exitsIds: string[];
}

export interface ExitEntity extends DungeonEntity {
    exitType: ExitType;
    roomIds: string[];
}

export interface DungeonEntity {
    id: string;
    description?: string;
    transform: Transform;
}