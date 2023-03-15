
export interface RoomEntityModelRequest {
    entityCode: string;
    entityDesc: string;
    dimension: string;
    exits: string[];
}


export class Chamber implements RoomEntity {
    shape: RoomShapeType;
    isLarge: boolean;
    exitsIds: string[];
    id: string;
    description: string = '';
    transform: Transform;
    
    public constructor(newId: string, newTransform: Transform, newShape: RoomShapeType, isLarge: boolean, newExitsIds?: string[]) {
        this.id = newId;
        this.transform = newTransform;
        this.shape = newShape;
        this.isLarge = isLarge;
        this.exitsIds = newExitsIds || [];
        this.setDescription();

    }
    setExits(newExitIds: string[]){
        this.exitsIds = newExitIds;
        this.setDescription();
    }
    setDescription(): void {
        this.description = `Chamber, shape:${RoomShapeType[this.shape]},`+ 
        `${this.getRoomSizeString()},` + 
        `${this.getDimensionString()}, exits: ${this.exitsIds.length}`
    }
    getDescription(): string {
        return this.description;
    }
    getDimensionString(): string {
        switch(this.shape){
            case RoomShapeType.Circle:
                return `radius: ${this.transform.length}`;
            default:
                return `dimension: ${this.transform.length}Lx${this.transform.width}W`;
        }
    }
    getRoomSizeString(): string {
        return `size: ${this.isLarge ? 'Large' : 'Normal'}`;
    }
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

export class Door implements ExitEntity {
    id: string;
    transform: Transform;
    exitType: ExitType;
    doorType: DoorType;
    isLocked: boolean;
    isSecret: boolean;
    isTrap: boolean;
    roomIds: string[];
    description: string = '';
    
    constructor(
        newId: string, newTransform: Transform, newRoomIds: string[],
        newExitType: ExitType, newDoorType: DoorType, 
        isLocked: boolean, isSecret: boolean, isTrap: boolean
        ){
        this.id = newId;
        this.transform = newTransform;
        this.roomIds = newRoomIds;
        this.exitType = newExitType;
        this.doorType = newDoorType;
        this.isLocked = isLocked;
        this.isSecret = isSecret;
        this.isTrap = isTrap;
        this.setDescription();
    }
    
    setRooms(roomIds: string[]): void {
        this.roomIds = roomIds;
        this.setDescription();
    }
    setDescription(): void {
        this.description = `Door Type: ${DoorType[this.doorType]},
        ${this.isLocked?' Locked,':''}${this.isTrap?' Trapped,':''}
        ${this.isSecret?' Secret':''}`;
    }
    getDescription(): string {
        return this.description;
    }
    getDimensionString(): string {
        return `demension: ${this.transform.width}Wx${this.transform.height}H`;
    }
}

export interface Stair extends ExitEntity {
    stairType: StairType;
    levels: number;
}

export class Passage implements RoomEntity {
    exitsIds: string[];
    id: string;
    description: string = '';
    transform: Transform;
    
    constructor(newId: string, newTransform: Transform, newExitIds?: string[]) {
        this.id = newId;
        this.exitsIds = newExitIds || [];
        this.transform = newTransform;
        this.setDescription();
        
    }
    setExits(newExitIds: string[]){
        this.exitsIds = newExitIds;
        this.setDescription();
    }
    setDescription(): void {
        this.description = `PassageWay between ${this.exitsIds.join(', ')}, ${this.getDimensionString()}`;
    }
    getDescription(): string {
        return this.description;
    }
    getDimensionString(): string {
        return `dimension: ${this.transform.length}Lx${this.transform.width}W`;
    }
}

export class PassageWay implements ExitEntity {
    exitType: ExitType;
    roomIds: string[];
    id: string;
    description: string = '';
    transform: Transform;
    
    constructor(newId: string, newTransform: Transform, newExitType: ExitType, newRoomIds?: string[]){
        this.id = newId;
        this.transform = newTransform;
        this.exitType = newExitType;
        this.roomIds = newRoomIds || [];
        this.setDescription();
    }

    setRooms(roomIds: string[]): void {
        this.roomIds = roomIds;
        this.setDescription();
    }
    setDescription(): void {
        this.description = `Passage between rooms: ${this.roomIds.join(', ')}. ${this.getDimensionString()}`
    }
    getDescription(): string {
        return this.description;
    }
    getDimensionString(): string {
        return `${this.transform.length}Lx${this.transform.width}W`;
    }
    
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

export enum RotateDirection {
    Left,
    Right,
    Flip,
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
    setExits(exitIds: string[]): void;
}

export interface ExitEntity extends DungeonEntity {
    exitType: ExitType;
    roomIds: string[];
    setRooms(roomIds: string[]): void;
}

export interface DungeonEntity {
    id: string;
    description: string;
    transform: Transform;
    setDescription(): void;
    getDescription(): string;
    getDimensionString(): string;
}