import { RegexDungeonRules } from "../dungeon-graph.config";
import { Chamber, Dimension, Door, DoorType, ExitDTO, ExitType, Passage, PassageWay, RoomEntityModelRequest, RoomShapeType } from "../random-dungeon-gen.model";

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
                        
    static genDimension = (length: number, width: number, x=0, y=0,z=0): Dimension => {
        return {
            length: length,
            width: !width ? length : width,
            height: 10,
            x: 0,
            y: 0,
            z: 0,
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
            exitType: ExitType.Passage,
            id: newId,
            roomIds: newRoomIds,
            description: `PassageWay between ${newRoomIds}`,
        };
        return newPassageWay;
    }

    static genDoor = (newId: string, newDoorType: DoorType, newRoomIds: string[], isLocked = false, isTrap = false, isSecret = false): Door => {
        let newDoor: Door = {
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