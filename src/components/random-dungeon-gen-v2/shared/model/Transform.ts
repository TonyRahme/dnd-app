
export interface Transform {
    center: Vector2;
    dimension: Vector3;
    position: Vector3;
    direction: CardinalDirectionName;
}

export enum RotateDirection {
    Left,
    Right,
    Flip
}

export const enum CardinalDirectionName {
    East = 'East',
    North = 'North',
    West = 'West',
    South = 'South'
}

export const CardinalDirectionVector2 = {
    [CardinalDirectionName.East]: { x: 1, y: 0 } as Vector2,
    [CardinalDirectionName.North]: { x: 0, y: -1 } as Vector2,
    [CardinalDirectionName.West]: { x: -1, y: 0 } as Vector2,
    [CardinalDirectionName.South]: { x: 0, y: 1 } as Vector2,
};

export class Vector2 {
    public x: number;
    public y: number;
    constructor(newX = 0, newY = 0) {
        this.x = newX;
        this.y = newY;
    }
}

export class Vector3 extends Vector2 {
    public z: number;
    constructor(newX = 0, newY = 0, newZ = 0) {
        super(newX, newY);
        this.z = newZ;
    }
}
