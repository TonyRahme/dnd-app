import { RegexDungeonRules } from "../dungeon-graph.config";
import { Chamber, Dimension, CardinalDirectionVector2, Door, DoorType, ExitDTO, ExitType, Passage, PassageWay, RoomEntityModelRequest, RoomShapeType, Vector2, CardinalDirectionName } from "../random-dungeon-gen.model";

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
                        
    static genDimension = (length=0, width=0, x=0, y=0,z=0, dir = CardinalDirectionName.East): Dimension => {
        
        let isHorizontal = CardinalDirectionVector2[dir].x !== 0;
        let centerX = isHorizontal ? x + length/2 : x + width/2;
        let centerY = isHorizontal ? y + width/2 : y + length/2;
        return {
            length: length,
            width: !width ? length : width,
            height: 10,
            center: {x: centerX, y: centerY},
            x: x,
            y: y,
            z: z,
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

    static genExit = (exitId: string, exitType: ExitType, isSecret: boolean = false): ExitDTO => {
        
        const exit: ExitDTO = {
            exitType: exitType,
            exitId: exitId,
            isSecret: isSecret,
        }
        return exit;
    }

    static genPassageWay = (newId: string, newRoomIds: string[]): PassageWay => {
        let newPassageWay: PassageWay = {
            dimension: this.genDimension(0,5),
            exitType: ExitType.Passage,
            id: newId,
            roomIds: newRoomIds,
            description: `PassageWay between ${newRoomIds}`,
        };
        return newPassageWay;
    }

    static genDoor = (newId: string, newDoorType: DoorType, newRoomIds: string[], isLocked = false, isTrap = false, isSecret = false): Door => {
        let newDoor: Door = {
            dimension: this.genDimension(0,5),
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