import { RoomShapeType, DoorType, StairType, ExitType } from "./dungeon-type.model";
import { Vector2, CardinalDirectionName, Transform } from "./Transform";


export interface DungeonEntity {
    id: string;
    description: string;
    transform: Transform;
    setDescription(): void;
    getDescription(): string;
    getDimensionString(): string;
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

export interface DoorProps {
    doorType: DoorType;
    isLocked: boolean;
    isSecret: boolean;
    isTrap: boolean;
}

abstract class BaseDungeonEntity implements DungeonEntity {
    id: string;
    description: string = '';
    transform: Transform;

    protected constructor(id: string, transform: Transform) {
        this.id = id;
        this.transform = transform;
    }

    abstract setDescription(): void;
    abstract getDimensionString(): string;

    getDescription(): string {
        this.setDescription();
        return this.description;
    }
}

abstract class BaseRoomEntity extends BaseDungeonEntity implements RoomEntity {
    exitsIds: string[];

    protected constructor(id: string, transform: Transform, exitsIds: string[] = []) {
        super(id, transform);
        this.exitsIds = exitsIds;
    }

    setExits(newExitIds: string[]): void {
        this.exitsIds = newExitIds;
        this.setDescription();
    }
}

abstract class BaseExitEntity extends BaseDungeonEntity implements ExitEntity {
    exitType: ExitType;
    roomIds: string[];

    protected constructor(id: string, transform: Transform, exitType: ExitType, roomIds: string[] = []) {
        super(id, transform);
        this.exitType = exitType;
        this.roomIds = roomIds;
    }

    setRooms(newRoomIds: string[]): void {
        this.roomIds = newRoomIds;
        this.setDescription();
    }
}

export class Chamber extends BaseRoomEntity {
    shape: RoomShapeType;
    isLarge: boolean;

    constructor(newId: string, newTransform: Transform, newShape: RoomShapeType, isLarge: boolean, newExitsIds: string[] = []) {
        super(newId, newTransform, newExitsIds);
        this.shape = newShape;
        this.isLarge = isLarge;
        this.setDescription();
    }

    setDescription(): void {
        this.description =
            `Chamber: ${this.id}, shape: ${RoomShapeType[this.shape]},` +
            `${this.getRoomSizeString()},` +
            `${this.getDimensionString()}, exits: ${this.exitsIds.length},` +
            `position: (${this.transform.position.x},${this.transform.position.y}),` +
            `center: (${this.transform.center.x},${this.transform.center.y}),` +
            `grid: (${this.transform.position.x / 5},${this.transform.position.y / 5}),`;
    }

    getDimensionString(): string {
        return this.shape === RoomShapeType.Circle
            ? `radius: ${this.transform.dimension.x / 2}`
            : `dimension: ${this.transform.dimension.x}Lx${this.transform.dimension.y}W`;
    }

    getRoomSizeString(): string {
        return `size: ${this.isLarge ? 'Large' : 'Normal'}`;
    }
}

export class Passage extends BaseRoomEntity {
    constructor(newId: string, newTransform: Transform, newExitIds: string[] = []) {
        super(newId, newTransform, newExitIds);
        this.setDescription();
    }

    setDescription(): void {
        this.description = `PassageWay between ${this.exitsIds.join(', ')}, ${this.getDimensionString()}`;
    }

    getDimensionString(): string {
        return `dimension: ${this.transform.dimension.x}Lx${this.transform.dimension.y}W`;
    }
}

export class Door extends BaseExitEntity {
    doorType: DoorType;
    isLocked: boolean;
    isSecret: boolean;
    isTrap: boolean;

    constructor(newId: string, newTransform: Transform, newExitType: ExitType, newRoomIds: string[], props: DoorProps) {
        super(newId, newTransform, newExitType, newRoomIds);
        this.doorType = props.doorType;
        this.isLocked = props.isLocked;
        this.isSecret = props.isSecret;
        this.isTrap = props.isTrap;
        this.setDescription();
    }

    setDescription(): void {
        this.description =
            `Door Type: ${DoorType[this.doorType]},` +
            `${this.isLocked ? ' Locked,' : ''}${this.isTrap ? ' Trapped,' : ''}` +
            `${this.isSecret ? ' Secret' : ''}`;
    }

    getDimensionString(): string {
        return `dimension: ${this.transform.dimension.y}Wx${this.transform.dimension.z}H`;
    }
}

export class PassageWay extends BaseExitEntity {
    constructor(newId: string, newTransform: Transform, newExitType: ExitType, newRoomIds: string[] = []) {
        super(newId, newTransform, newExitType, newRoomIds);
        this.setDescription();
    }

    setDescription(): void {
        this.description = `Passage between rooms: ${this.roomIds.join(', ')}. ${this.getDimensionString()}`;
    }

    getDimensionString(): string {
        return `${this.transform.dimension.x}Lx${this.transform.dimension.y}W`;
    }
}

export interface Stair extends ExitEntity {
    stairType: StairType;
    levels: number;
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

export interface RoomEntityModelRequest {
    entityCode: string;
    dimension: Vector2;
    size: string;
    shape: string;
    exits: string[];
}
