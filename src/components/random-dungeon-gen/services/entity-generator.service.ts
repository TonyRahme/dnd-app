import { RegexDungeonRules } from "../dungeon-graph.config";
import { Chamber, Transform, CardinalDirectionVector2, Door, DoorType, ExitDTO, ExitType, Passage, PassageWay, RoomEntityModelRequest, RoomShapeType, Vector2, CardinalDirectionName, Vector3, RoomEntity, ExitEntity, RotateDirection } from "../random-dungeon-gen.model";
import Utilities from "./utilities.service";

class EntityGenerator  {

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
        
        let isHorizontal = Utilities.isHorizontal(dir);
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

    static genTransformRotate = (transform: Transform, rotateDirection: RotateDirection): Transform => {
        let newDirection:CardinalDirectionName  = Utilities.cardinalRotate(transform.direction, rotateDirection);
        let newDirectionTransform = Utilities.getAbsoluteDimensions(newDirection, transform);
        let newX = transform.center.x - newDirectionTransform.x/2;
        let newY = transform.center.y - newDirectionTransform.y/2;
        return this.genTransform(transform.length, transform.width, newX, newY, transform.position.z, newDirection);
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

    static genPassageWay = (newId: string, newRoomIds: string[], exit: ExitDTO): PassageWay => {
        //TODO: worry about direction of the passage way facing
        const vector2 = new Vector2(0,5);
        const vector3 = new Vector3(exit.position.x, exit.position.y);
        let newPassageWay: PassageWay = {
            transform: this.genTransform(vector2, vector3, exit.direction),
            exitType: ExitType.Passage,
            id: newId,
            roomIds: newRoomIds,
            description: `PassageWay between ${newRoomIds}`,
        };
        return newPassageWay;
    }

    static genDoor = (newId: string, newDoorType: DoorType, newRoomIds: string[], exit: ExitDTO): Door => {
        const isLocked = exit.isLocked;
        const isTrap = exit.isTrap;
        const isSecret = exit.isSecret;
        const vector2 = new Vector2(0,5);
        const vector3 = new Vector3(exit.position.x, exit.position.y);
        let newDoor: Door = {
            transform: this.genTransform(vector2, vector3, exit.direction),
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

    static genEntityModelReq = (entity: string[], exits: string[] = []): RoomEntityModelRequest => {
        let [entityDesc, dimension] = entity;
        let [entityCode] = entityDesc;
    
        return {
            entityCode: entityCode,
            entityDesc: entityDesc,
            dimension: dimension,
            exits: exits,
        }
    }
    
}

export default EntityGenerator;