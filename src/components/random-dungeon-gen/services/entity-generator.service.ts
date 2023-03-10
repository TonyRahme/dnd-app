import { RegexDungeonRules } from "../dungeon-graph.config";
import { Chamber, Dimension, CardinalDirectionVector2, Door, DoorType, ExitDTO, ExitType, Passage, PassageWay, RoomEntityModelRequest, RoomShapeType, Vector2, CardinalDirectionName, Vector3 } from "../random-dungeon-gen.model";

export class EntityGenerator  {

    private constructor() {}
    
    
    static genShape = (shape: string): RoomShapeType => {
        switch(shape) {
            case RegexDungeonRules.s_Square:
                return RoomShapeType.Square;
            case RegexDungeonRules.c_Circle:
                return RoomShapeType.Circle;
            case RegexDungeonRules.r_Rectangle:
                return RoomShapeType.Rectangle;
            case RegexDungeonRules.o_Octagon:
                return RoomShapeType.Octagon;
            case RegexDungeonRules.t_Trapezoid:
                return RoomShapeType.Trapezoid;
            default:
                return RoomShapeType.None;
        }
    }
    
    
    public static genDimension(dimension2D: Vector2, position3D: Vector3, dir?: CardinalDirectionName): Dimension;
    public static genDimension(length?:number, width?:number, x?:number, y?:number, z?:number, dir?: CardinalDirectionName):Dimension;
    public static genDimension(lengthOrDimension?:any, widthOrPosition?:any, xOrDir?:any, y=0,z=0, dir = CardinalDirectionName.East): Dimension {
        //x is length and y is width
        let dimension: Vector2 =  typeof lengthOrDimension == 'number' || lengthOrDimension === undefined ?
        {
            x: lengthOrDimension ? lengthOrDimension:0,
            y: widthOrPosition ? widthOrPosition:0,
        }
        :lengthOrDimension; 
        
        let position: Vector3 = typeof widthOrPosition == 'number' || widthOrPosition === undefined ?
        {
            x:typeof xOrDir == 'number'? xOrDir:0,
            y:y,
            z:z
        }
        : widthOrPosition;

        if(typeof xOrDir == 'string'){
            dir = xOrDir as CardinalDirectionName;
        }
        
        let isHorizontal = CardinalDirectionVector2[dir].x !== 0;
        let centerX = isHorizontal ? position.x + dimension.x/2 : position.x + dimension.y/2;
        let centerY = isHorizontal ? position.y + dimension.y/2 : position.y + dimension.x/2;
        return {
            length: dimension.x,
            width: !dimension.y ? dimension.x : dimension.y,
            height: 10,
            center: {x: centerX, y: centerY},
            x: position.x,
            y: position.y,
            z: position.z,
            direction: dir,
        }
    }

    static cardinalRotate = (cardinalDirection: CardinalDirectionName, clockwise=true): CardinalDirectionName => {
        if(clockwise) {
            switch(cardinalDirection) {
                case CardinalDirectionName.North:
                    return CardinalDirectionName.East;
                case CardinalDirectionName.West:
                    return CardinalDirectionName.North;
                case CardinalDirectionName.South:
                    return CardinalDirectionName.West;
                default:
                    return CardinalDirectionName.South;
            }
        } else {
            switch(cardinalDirection) {
                case CardinalDirectionName.North:
                    return CardinalDirectionName.West;
                case CardinalDirectionName.West:
                    return CardinalDirectionName.South;
                case CardinalDirectionName.South:
                    return CardinalDirectionName.East;
                default:
                    return CardinalDirectionName.North;
                
            }            
        }
    }

    static entityRotate = (dimension: Dimension, clockwise=true): Dimension => {
        let newDirection:CardinalDirectionName  = this.cardinalRotate(dimension.direction, clockwise);
        let newDirectionDim = this.checkRotationDimensions(newDirection, dimension);
        let newX = dimension.center.x - newDirectionDim.x/2;
        let newY = dimension.center.y - newDirectionDim.y/2;
        return this.genDimension(dimension.length, dimension.width, newX, newY, dimension.z, newDirection);
    }

    static checkRotationDimensions = (direction: CardinalDirectionName, dimension: Dimension): Vector2 => {
        let isHorizontal = CardinalDirectionVector2[direction].x !== 0;
        return {
            x: isHorizontal? dimension.length : dimension.width,
            y: isHorizontal? dimension.width : dimension.length,
        }
    } 

    static genExit = (
        exitId: string,
        exitType: ExitType,
        position: Vector2,
        direction = CardinalDirectionName.East,
        isSecret = false,
        isTrap = false,
        isLocked = false
        ): ExitDTO => {
        
        const exit: ExitDTO = {
            exitId: exitId,
            exitType: exitType,
            isSecret: isSecret,
            position: position,
            direction: direction,
            isTrap: isTrap,
            isLocked: isLocked,
        }
        return exit;
    }

    static genExitPointsByRoomId = (roomDimension: Dimension, exitCount: number): Vector2[] => {
        
        let directionVector = CardinalDirectionVector2[roomDimension.direction];
        
        let radianDelta = 2*Math.PI / exitCount;
        let startRadian = Math.acos(-directionVector.x) + Math.asin(-directionVector.y);
        let deltaRadian = startRadian;

        let absDimension = EntityGenerator.checkRotationDimensions(roomDimension.direction, roomDimension);
        let exitPositions: Vector2[] = [];
        
        for(let i = 0;i<exitCount;i++){
            deltaRadian += radianDelta;
            exitPositions.push({
                x: roomDimension.x + absDimension.x*Math.cos(deltaRadian)/2 + roomDimension.center.x,
                y: roomDimension.y + absDimension.y*Math.sin(deltaRadian)/2 + roomDimension.center.y,
            });
        }
        return exitPositions;
    }

    static getRelativeDirection = (doorPosition: Vector2, roomDimension: Dimension): CardinalDirectionName => {
        const roomStartPosition = new Vector2(roomDimension.x, roomDimension.y);
        const roomEndPosition = new Vector2(roomStartPosition.x + roomDimension.length, roomStartPosition.y + roomDimension.width);
    
        const cardinalX = doorPosition.x === roomStartPosition.x ? -1 : doorPosition.x === roomEndPosition.x ? 1 : 0;
        const cardinalY = doorPosition.y === roomStartPosition.y ? 1 : doorPosition.y === roomEndPosition.y ? -1 : 0;
        
        const cardinal2D = new Vector2(cardinalX, cardinalY);
        
        const cardinalName = this.getCardinalDirectionNameByVector(cardinal2D);
        
        return cardinalName;
    }

    static getCardinalDirectionNameByVector = (vector2: Vector2): CardinalDirectionName => {
        Object.entries(CardinalDirectionVector2).forEach(([cardinalName, cardinalVector]) => {
            if(vector2.x === cardinalVector.x && vector2.y === cardinalVector.y){
                return cardinalName;
            }
        });
        //defaults to East;
        return CardinalDirectionName.East;
    }

    static getCardinalDirectionVectorByName = (name: CardinalDirectionName): Vector2  => {
        Object.entries(CardinalDirectionVector2).forEach(([cardinalName, cardinalVector]) => {
            if(name === cardinalName){
                return cardinalVector;
            }
        });
        //defaults to East;
        return CardinalDirectionVector2[CardinalDirectionName.East];        
    }

    static genPassageWay = (newId: string, newRoomIds: string[], position: Vector2): PassageWay => {
        //TODO: worry about direction of the passage way facing
        let newPassageWay: PassageWay = {
            dimension: this.genDimension(0,5, position.x, position.y),
            exitType: ExitType.Passage,
            id: newId,
            roomIds: newRoomIds,
            description: `PassageWay between ${newRoomIds}`,
        };
        return newPassageWay;
    }

    static genDoor = (newId: string, newDoorType: DoorType, newRoomIds: string[], exit: ExitDTO): Door => {
        //TODO: Worry about direction of door facing
        const isLocked = exit.isLocked;
        const isTrap = exit.isTrap;
        const isSecret = exit.isSecret;
        let newDoor: Door = {
            dimension: this.genDimension(0,5, exit.position.x, exit.position.y),
            exitType: ExitType.Door,
            id: newId,
            doorType: newDoorType,
            isLocked: isLocked,
            isTrap: isTrap,
            isSecret: isSecret,
            roomIds: newRoomIds,
            description: `Door Type: ${DoorType[newDoorType]},${isLocked?' locked,':''}${isTrap?' trapped,':''}${isSecret?' Secret':''}`
        }
        return newDoor;
    }


    static genChamber = (newId: string, newDimension: Dimension, newShape: RoomShapeType, isLarge: boolean ,newExitsIds: string[] = []): Chamber => {
        let newChamber: Chamber = {
            id: newId,
            dimension: newDimension,
            shape: newShape,
            isLarge: isLarge,
            exitsIds: newExitsIds,
            description: `Chamber, shape:${RoomShapeType[newShape]},`+ 
            `size: ${isLarge ? RegexDungeonRules.l_LargeChamber : RegexDungeonRules.n_NormalChamber},` + 
            `dimension: ${newDimension.length}Lx${newDimension.width}W, exits: ${newExitsIds.length}`
        }

        return newChamber;
    }

    static genPassage = (newId: string, newDimension: Dimension, newExitsIds: string[] = []): Passage => {
        let newPassage: Passage = {
            id: newId,
            dimension: newDimension,
            exitsIds: newExitsIds,
            description: `Passage, width: ${newDimension.width}, exits: ${newExitsIds}`,
        } 
        
        return newPassage;
    }

    static buildEntityModelReq = (entity: string[], exits: string[] = []): RoomEntityModelRequest => {
        let [entityDesc, dimension] = entity;
        let [entityCode] = entityDesc;
    
        return {
            entityCode: entityCode,
            entityDesc: entityDesc,
            dimension: dimension,
            exits: exits,
        }
    }
    
    static extractArrayFromRegexMatch = (entityType: string, regex: RegExp): string[] => {
        let match = entityType.match(regex);
        return match !== null ? Array.from<string>(match) : [];
    }

    static shiftAndExtractEntityExitsArray = (data: string[]): any[] => {
        let entityTypeDataShift = data.shift();
        let exits = data ? data : [];
        const entityType = entityTypeDataShift ? entityTypeDataShift : "";
        return [entityType, exits];
    }
    
}

export default EntityGenerator;