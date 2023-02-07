import { RandomBeyondDoor, RandomBeyondDoorOptions, randomChamberOptions, RandomDoorType, randomDoorTypeOptions, randomExitTypeOptions, randomLargeExitOptions, randomNormalExitOptions, randomPassageOptions, RandomStartingArea, RegexDungeonRules, startingAreaRegex, weightedRandom } from "./dungeon-graph.config";
import { Chamber, RoomShapeType, Dimension, Passage, RoomEntityModelRequest, ExitDTO, RoomEntity, ExitEntity, ExitType, Door, DoorType, PassageWay } from "./random-dungeon-gen.model";

const dungeonMap: Map<string, RoomEntity> = new Map();
let exitCount: number = 0;
const exitMap: Map<string, ExitEntity> = new Map();
const exitsRegex = /(s?[A-Z])|((\d{1,}w?)|[a-z][A-Z])/g
const chamberRegex = /C[corst]?[nl]?\d{2}(x\d{2})*/g;
const EntitySplitRegex = /[CDPS][corst]?[ln]?|\d{2}w?(x\d{2})*/g

export const dungeonGenerateGraph = (startingAreaCode: string) => {
    startingAreaCode = RandomStartingArea.Passage10Wide4Intersection;
    const startingArea: RoomEntity = generateStartingArea(startingAreaCode);
    startingArea.exitsIds.forEach(exitId => {
        buildBeyondExit(exitId);
    });

    console.log(startingArea);
    console.log("dungeonMap", dungeonMap);
    console.log("exitMap", exitMap);
    
}

const getStartingAreaReq = (areaCode: string): RoomEntityModelRequest => {
    const data = extractArrayFromRegexMatch(areaCode, startingAreaRegex)
    let entityType: string = "";
    let exits: string[] = [];
    
    [entityType, exits] = shiftAndExtractEntityExitsArray(data);

    let entity: string[] = extractArrayFromRegexMatch(entityType, EntitySplitRegex)
    return buildEntityModelReq(entity, exits);
};

const shiftAndExtractEntityExitsArray = (data: string[]): any[] => {
    let entityTypeDataShift = data.shift();
    let exits = data ? data : [];
    const entityType = entityTypeDataShift ? entityTypeDataShift : "";
    return [entityType, exits];
}

const buildEntityModelReq = (entity: string[], exits: string[] = []): RoomEntityModelRequest => {
    let [entityDesc, dimension] = entity;
    let [entityCode] = entityDesc;

    return {
        entityCode: entityCode,
        entityDesc: entityDesc,
        dimension: dimension,
        exits: exits,
    }
}

const generateStartingArea = (startingAreaCode: string):RoomEntity => {

    const entityModel = getStartingAreaReq(startingAreaCode);
    console.log(entityModel);
    
    
    let start: Partial<RoomEntity>;

    switch(entityModel.entityCode) {
        case RegexDungeonRules.C_Chamber:
            start = buildStartChamber(entityModel);
            break;
        case RegexDungeonRules.P_Passage:
            start = buildStartPassage(entityModel);
            break;
        default:
            start = {description: "error"};
        
    }
    
    if(start.description !== "error") {
        const newRoom: RoomEntity = start as RoomEntity;
        addDungeonArea(newRoom);
        const newExits = generateStartingExits(newRoom.id, entityModel.exits);
        addExitsToDungeonArea(newExits, newRoom.id);
        start = dungeonMap.get(newRoom.id) as RoomEntity;
    }

    return start as RoomEntity;
    
}

const generateStartingExits = (dungeonId: string, startingExits: string[]): string[] => {
    let exits: string[] = [];
    startingExits.forEach(startExit => {
        exits.push(... genStartExits(dungeonId, startExit));
    });
    return exits;
}

const buildStartingExitEntities = (roomId: string, exits: ExitDTO[]) => {
    exits.forEach(exit => {
        switch(exit.exitType) {
            case ExitType.Passage:
                buildStartingPassageWay(roomId, exit);
                break;
            case ExitType.Stair:
                buildStartingStairs(roomId, exit);
                break;
            default:
                buildStartingDoor(roomId, exit);
                break;
        }
    })
}

const buildRandomExitEntities = (roomId: string, exits: ExitDTO[]) => {
    exits.forEach(exit => {
        switch(exit.exitType) {
            case ExitType.Passage:
                buildStartingPassageWay(roomId, exit);
                break;
            case ExitType.Stair:
                buildStartingStairs(roomId, exit);
                break;
            default:
                buildRandomDoor(roomId, exit);
                break;
                }
    })
}

const buildStartChamber = (entityModel: RoomEntityModelRequest): Chamber => {
    let [_, shape, size] = entityModel.entityDesc;
    let [length, width] = entityModel.dimension.split('x');
    const newId = generateDungeonId(entityModel.entityCode);
    const shapeValue = genShape(shape);
    const newDim = genDimension(Number(length), Number(width));
    const isLargeSize = size === RegexDungeonRules.l_LargeChamber;
    
    return genChamber(newId, newDim, shapeValue, isLargeSize);
}

const buildRandomChamber = (roomId: string): Chamber => {
    const randomChamber = weightedRandom(randomChamberOptions);
    const roomExitIds:string[] = dungeonMap.get(roomId)?.exitsIds || [];
    
    let entity: string[] = extractArrayFromRegexMatch(randomChamber, EntitySplitRegex);
    const entityModel = buildEntityModelReq(entity);
    let [_, shape, size] = entityModel.entityDesc;
    let [length, width] = entityModel.dimension.split('x');
    
    const shapeValue = genShape(shape);
    const isLargeSize: boolean = size === RegexDungeonRules.l_LargeChamber;
    const exitCount: number = isLargeSize ? 
        Number(weightedRandom(randomLargeExitOptions)) :
        Number(weightedRandom(randomNormalExitOptions));
    
    let newId = generateDungeonId(entityModel.entityCode);
    let newDim = genDimension(Number(length), Number(width));
    const newExitIds =  [roomExitIds.at(0) || "" , ...buildRandomExits(newId, exitCount)];
    
    return genChamber(newId, newDim, shapeValue, isLargeSize, newExitIds);
}

const buildStartPassage = (entityModel: RoomEntityModelRequest): Passage => {
    let [width] = entityModel.dimension.split('w');
    const newDim: Dimension = genDimension(10, Number(width));
    const newId: string = generateDungeonId(entityModel.entityCode);

    return genPassage(newId, newDim);
}

const buildRandomPassage = (roomId: string) => {
    const passageRegex = /([CFS](\d*)%?)|([PsD]*[LR]*)/g
    const randomPassage = weightedRandom(randomPassageOptions);
    const passageData = extractArrayFromRegexMatch(randomPassage, passageRegex);
    const length = passageData.shift();
    const exits: string[] = [dungeonMap.get(roomId)?.exitsIds.at(0) || ""];
    
    console.log(passageData);
    //TODO figure out passageData to be added to exitsIds
    const newId = generateDungeonId(RegexDungeonRules.P_Passage);
    const newDim = genDimension(Number(length), 10);
    return genPassage(newId, newDim, exits);
}

const buildStartingPassageWay = (roomId: string, exit?: ExitDTO) => {
    let id = exit?.exitId as string;
    let newPassage: PassageWay = genPassageWay(id, [roomId]);
    addExitPoint(newPassage);
    
}

const buildRandomStairs = (roomId: string) => {

}

const buildStartingStairs = (roomId: string, exit: ExitDTO) => {

}

const buildRandomDoor = (roomId: string, exit: ExitDTO) => {
    const randomDoorType:string = weightedRandom(randomDoorTypeOptions);
    const randomBeyondDoor: string = weightedRandom(RandomBeyondDoorOptions);
    let doorType: DoorType = DoorType.Other;
    let isLocked: boolean = false;
    let isTrap: boolean = randomBeyondDoor === RandomBeyondDoor.Trap;
    [doorType, isLocked] = extractDoorPropFromCode(randomDoorType);
    exit.isSecret = doorType === DoorType.Secret;

    let newDoor: Door = genDoor(exit.exitId as string, doorType, [roomId], isLocked, isTrap, exit.isSecret);

    addExitPoint(newDoor);
}

const buildStartingDoor = (roomId: string, exit?: ExitDTO) => {

    const randomDoorType:string = weightedRandom(randomDoorTypeOptions);
    const isSecret = exit?.isSecret !== undefined ? exit.isSecret : false;
    let doorType: DoorType = DoorType.Other;
    let isLocked: boolean = false;
    [doorType, isLocked] = extractDoorPropFromCode(randomDoorType);
    let newDoor: Door = genDoor(exit?.exitId as string, doorType, [roomId], isLocked, false, isSecret);
    addExitPoint(newDoor);
}

const buildRandomExits = (roomId: string,exitCount: number): string[] => {
    let exits: ExitDTO[] = [];

    for(let i = 0; i < exitCount; i++) {
        let exitCode = weightedRandom(randomExitTypeOptions);
        exits.push(genExit(roomId, exitCode));
    }
    //TODO - Implement function equivalent to buildStartingExitEntities
    buildRandomExitEntities(roomId, exits);
    return exits.map(exit => exit.exitId || "");
}

const buildBeyondExit = (exitId: string) => {
    // const randomBeyondDoorRoomType: string = weightedRandom(RandomBeyondDoorOptions);
    const randomBeyondDoorRoomType: string = RandomBeyondDoor.Chamber;

    const exit = exitMap.get(exitId);
    if(exit === undefined) {
        return;
    }
    switch(exit.exitType) {
        case ExitType.Door:
            buildBeyondDoor(exit as Door, randomBeyondDoorRoomType);
            break;
        
        case ExitType.Passage:
            break;
        
        default:
    }
}

const buildBeyondDoor = (door: Door, randomBeyondDoor: string) => {
    let room = dungeonMap.get(door.roomIds?.length ? door.roomIds[0] : '');
    let roomId = room !== undefined ? room.id : "";
    let beyondDoor: Partial<RoomEntity>;
    switch(randomBeyondDoor) {
        case RandomBeyondDoor.Chamber:
            let newRandomChamber = buildRandomChamber(roomId);
            addDungeonArea(newRandomChamber);
            addRoomsToExit(newRandomChamber.id, door.id);
            
            beyondDoor = newRandomChamber as Chamber;
            console.log("newly random chamber", beyondDoor);
    
            break;
        case RandomBeyondDoor.Passage:
            let newRandomPassage = buildRandomPassage(roomId);
            addDungeonArea(newRandomPassage);
            beyondDoor = newRandomPassage as Passage;
            console.log("newly random Passage", beyondDoor);
            break;
        case RandomBeyondDoor.Stairs:
            break;
        default:
    }
    
    
}

const extractDoorPropFromCode = (code: string): any[] => {
    switch(code) {
        case RandomDoorType.Wooden:
            return [DoorType.Wooden, false];
        case RandomDoorType.WoodenLocked:
            return [DoorType.Wooden, true];
        case RandomDoorType.Stone:
            return [DoorType.Stone, false];
        case RandomDoorType.StoneLocked:
            return [DoorType.Stone, true];
        case RandomDoorType.Iron:
            return [DoorType.Iron, false];
        case RandomDoorType.IronLocked:
            return [DoorType.Iron, true];
        case RandomDoorType.Portcullis:
            return [DoorType.Portcullis, false];
        case RandomDoorType.PortcullisLocked:
            return [DoorType.Portcullis, true];
        case RandomDoorType.Secret:
            return [DoorType.Secret, false];
        case RandomDoorType.SecretLocked:
            return [DoorType.Secret, true];
        default:
            return [DoorType.Other, false];
    }
}

const addNewExitsInStartingRoom = (roomId: string, exitCode: string, amount: number, isSecret = false): string[] => {
    
    let newStartingExits: ExitDTO[] = [];
    for(let i = 0; i < amount; i++) {
        newStartingExits.push(genExit(roomId, exitCode, isSecret))
    }
    buildStartingExitEntities(roomId, newStartingExits);
    
    return newStartingExits.map(exit => exit.exitId || "");
}

const genShape = (shape: string): RoomShapeType => {
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

const genStartExits = (roomId: string, exitCode: string): string[] => {
    let exits = extractArrayFromRegexMatch(exitCode, exitsRegex);
    console.log("exitMatches", exits);
    
    const [code, amount] = exits;
    let newAmount: number = 0;

    switch(amount) {
        case 'lW':
        case 'sW':
            newAmount = 2;
            break;
        case 'mW':
            newAmount = 1;
            break;
        default:
            newAmount = Number(amount);
    }

    const isSecret: boolean = code === RegexDungeonRules.sD_SecretDoor;
    return addNewExitsInStartingRoom(roomId, code, newAmount, isSecret);

}

const genDimension = (length: number, width: number): Dimension => {
    return {
        length: length,
        width: !width ? length : width,
        height: 10,
        x: 0,
        y: 0,
        z: 0,
    }
}

const genExit = (roomId:string, exitCode: string, isSecret: boolean = false): ExitDTO => {
    
    const exit: ExitDTO = {
        exitType: getExitTypeByCode(exitCode),
        exitId: generateExitId(exitCode),
        isSecret: isSecret,
    }
    return exit;
}

const genPassageWay = (newId: string, newRoomIds: string[]): PassageWay => {
    let newPassageWay: PassageWay = {
        exitType: ExitType.Passage,
        id: newId,
        roomIds: newRoomIds,
        description: `PassageWay between ${newRoomIds}`,
    };
    return newPassageWay;
}

const genDoor = (newId: string, newDoorType: DoorType, newRoomIds: string[], isLocked = false, isTrap = false, isSecret = false): Door => {
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


const genChamber = (newId: string, newDimension: Dimension, newShape: RoomShapeType, isLarge: boolean ,newExitsIds: string[] = []): Chamber => {
    let newChamber: Chamber = {
        id: newId,
        dimension: newDimension,
        shape: newShape,
        isLarge: isLarge,
        exitsIds: newExitsIds,
        description: `Chamber, shape:${RoomShapeType[newShape]},`+ 
        `size: ${isLarge ? RegexDungeonRules.l_LargeChamber : RegexDungeonRules.n_NormalChamber},` + 
        `dimension: ${newDimension}, exits: ${newExitsIds.length}`
    }

    return newChamber;
}

const genPassage = (newId: string, newDimension: Dimension, newExitsIds: string[] = []): Passage => {
    let newPassage: Passage = {
        id: newId,
        dimension: newDimension,
        exitsIds: newExitsIds,
        description: `Passage, width: ${newDimension.width}, exits: ${newExitsIds}`,
    } 

    return newPassage;
}

const generateDungeonId = (entityCode: string): string => {
    return `${entityCode}${dungeonMap.size}`
}

const addDungeonArea = (room: RoomEntity) => {
    dungeonMap.set(room.id, room);
}

const generateExitId = (entityCode: string): string => {
    return `${entityCode}${exitCount++}`
}

const addExitPoint = (exit: ExitEntity) => {
    exitMap.set(exit.id, exit);
}

const getExitTypeByCode = (exitCode: string): ExitType => {
    switch(exitCode) {
        case RegexDungeonRules.D_Door:
            return ExitType.Door;
        case RegexDungeonRules.S_Stairs:
            return ExitType.Stair;
        default:
            return ExitType.Passage;
    }
}

const addExitsToDungeonArea = (exits: string[], id: string) => {
    let room: RoomEntity | undefined = dungeonMap.get(id);
    if (room === undefined) {
        return;
    }
    room.exitsIds = exits;
    dungeonMap.set(id, room);
}

const addRoomsToExit = (roomId: string, exitId: string) => {
    let exit: ExitEntity | undefined = exitMap.get(exitId);
    if(exit === undefined) {
        return;
    }
    let newRoomIds: string[] = exit.roomIds;
    newRoomIds.push(roomId)
    exit.roomIds = newRoomIds;
    exitMap.set(exitId, exit);
}

const extractArrayFromRegexMatch = (entityType: string, regex: RegExp): string[] => {
    let match = entityType.match(regex);
    return match !== null ? Array.from<string>(match) : [];
}