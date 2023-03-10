import { RegexDungeonRules } from "../dungeon-graph.config";
import { Chamber, Transform, CardinalDirectionVector2, Door, DoorType, ExitDTO, ExitType, Passage, PassageWay, RoomEntityModelRequest, RoomShapeType, Vector2, CardinalDirectionName, Vector3 } from "../random-dungeon-gen.model";

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
    
    
    public static genTransform(dimension2D: Vector2, position3D: Vector3, dir?: CardinalDirectionName): Transform;
    public static genTransform(length?:number, width?:number, x?:number, y?:number, z?:number, dir?: CardinalDirectionName):Transform;
    public static genTransform(lengthOrTransform?:any, widthOrPosition?:any, xOrDir?:any, y=0,z=0, dir = CardinalDirectionName.East): Transform {
        //x is length and y is width
        let dimension: Vector2 =  typeof lengthOrTransform == 'number' || lengthOrTransform === undefined ?
        {
            x: lengthOrTransform ? lengthOrTransform:0,
            y: widthOrPosition ? widthOrPosition:0,
        }
        :lengthOrTransform; 
        
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
            position: position,
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

    static entityRotate = (transform: Transform, clockwise=true): Transform => {
        let newDirection:CardinalDirectionName  = this.cardinalRotate(transform.direction, clockwise);
        let newDirectionTransform = this.checkRotationTransforms(newDirection, transform);
        let newX = transform.center.x - newDirectionTransform.x/2;
        let newY = transform.center.y - newDirectionTransform.y/2;
        return this.genTransform(transform.length, transform.width, newX, newY, transform.position.z, newDirection);
    }

    static checkRotationTransforms = (direction: CardinalDirectionName, transform: Transform): Vector2 => {
        let isHorizontal = CardinalDirectionVector2[direction].x !== 0;
        return {
            x: isHorizontal? transform.length : transform.width,
            y: isHorizontal? transform.width : transform.length,
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

    static genExitPointsByRoomId = (roomTransform: Transform, exitCount: number): Vector2[] => {
        
        let directionVector = CardinalDirectionVector2[roomTransform.direction];
        
        let radianDelta = 2*Math.PI / exitCount;
        let startRadian = Math.acos(-directionVector.x) + Math.asin(-directionVector.y);
        let deltaRadian = startRadian;

        let absTransform = EntityGenerator.checkRotationTransforms(roomTransform.direction, roomTransform);
        let exitPositions: Vector2[] = [];
        
        for(let i = 0;i<exitCount;i++){
            deltaRadian += radianDelta;
            exitPositions.push({
                x: roomTransform.position.x + absTransform.x*Math.cos(deltaRadian)/2 + roomTransform.center.x,
                y: roomTransform.position.y + absTransform.y*Math.sin(deltaRadian)/2 + roomTransform.center.y,
            });
        }
        return exitPositions;
    }

    static getRelativeDirection = (doorPosition: Vector2, roomTransform: Transform): CardinalDirectionName => {
        const roomStartPosition = new Vector2(roomTransform.position.x, roomTransform.position.y);
        const roomEndPosition = new Vector2(roomStartPosition.x + roomTransform.length, roomStartPosition.y + roomTransform.width);
    
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
            transform: this.genTransform(0,5, position.x, position.y),
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
            transform: this.genTransform(0,5, exit.position.x, exit.position.y),
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


    static genChamber = (newId: string, newTransform: Transform, newShape: RoomShapeType, isLarge: boolean ,newExitsIds: string[] = []): Chamber => {
        let newChamber: Chamber = {
            id: newId,
            transform: newTransform,
            shape: newShape,
            isLarge: isLarge,
            exitsIds: newExitsIds,
            description: `Chamber, shape:${RoomShapeType[newShape]},`+ 
            `size: ${isLarge ? RegexDungeonRules.l_LargeChamber : RegexDungeonRules.n_NormalChamber},` + 
            `dimension: ${newTransform.length}Lx${newTransform.width}W, exits: ${newExitsIds.length}`
        }

        return newChamber;
    }

    static genPassage = (newId: string, newTransform: Transform, newExitsIds: string[] = []): Passage => {
        let newPassage: Passage = {
            id: newId,
            transform: newTransform,
            exitsIds: newExitsIds,
            description: `Passage, width: ${newTransform.width}, exits: ${newExitsIds}`,
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