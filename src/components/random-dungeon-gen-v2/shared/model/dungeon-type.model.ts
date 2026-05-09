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

export enum ErrorType {
    ERROR = "error",
    INVALID_COLLISION = "invalid collision"
}
