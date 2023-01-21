import { RandomBeyondDoor, RandomBeyondDoorOptions, randomChamberOptions, RandomDoorType, randomDoorTypeOptions, randomExitTypeOptions, randomLargeExitOptions, randomNormalExitOptions, randomPassageOptions, RegexDungeonRules, startingAreaRegex, weightedRandom } from "./dungeon-graph.config";
import { Chamber, RoomShapeType, Dimension, Passage, RoomEntityModelRequest, Exit, RoomEntity, ExitEntity, ExitType, Door, DoorType, PassageWay } from "./random-dungeon-gen.model";

const dungeonMap: Map<string, RoomEntity> = new Map();
let exitCount: number = 0;
const exitMap: Map<string, ExitEntity> = new Map();
const exitsRegex = /(s?[A-Z])|((\d{1,}w?)|[a-z][A-Z])/g
const chamberRegex = /C[corst]?[nl]?\d{2}(x\d{2})*/g;
const EntitySplitRegex = /[CDPS][corst]?[ln]?|\d{2}w?(x\d{2})*/g

export const dungeonGenerateGraph = (startingAreaCode: string) => {

    const startingArea: RoomEntity = generateStartingArea(startingAreaCode);
    // addExitsToDungeonArea(startingExits, startingArea.id);
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
        const newExits = generateExits(newRoom.id, entityModel.exits);
        addExitsToDungeonArea(newExits, newRoom.id);
        start = dungeonMap.get(newRoom.id) as RoomEntity;
    }

    return start as RoomEntity;
    
}

const generateExits = (dungeonId: string, startingExits: string[]): Exit[] => {
    let exits: Exit[] = [];
    startingExits.forEach(startExit => {
        exits.push(... genStartExits(dungeonId, startExit));
    });
    return exits;
}

const buildStartingExitEntities = (roomId: string, exits: Exit[]) => {
    exits.forEach(exit => {
        switch(exit.exitType) {
            case ExitType.Passage:
                buildPassageWay(roomId, exit);
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

const buildStartChamber = (entityModel: RoomEntityModelRequest): Chamber => {
    let [_, shape, size] = entityModel.entityDesc;
    let [length, width] = entityModel.dimension.split('x');

    console.log(`entityCode: ${_}, shape:${shape}, size: ${size}, length:${length}, width: ${width}, exits: ${entityModel.exits}`);
    const startingAreaChamber: Chamber = {
        id: generateDungeonId(entityModel.entityCode),
        shape: genShape(shape),
        isLarge: size === RegexDungeonRules.l_LargeChamber,
        dimension: genDimension(Number(length), Number(width)),
        exits: [],
        description: "",
    }

    return startingAreaChamber;
    
}

const buildRandomChamber = (): Chamber => {
    const randomChamber = weightedRandom(randomChamberOptions);

    let entity: string[] = extractArrayFromRegexMatch(randomChamber, EntitySplitRegex);
    const entityModel = buildEntityModelReq(entity);
    let [_, shape, size] = entityModel.entityDesc;
    let [length, width] = entityModel.dimension.split('x');
    const isLarge: boolean = size === RegexDungeonRules.l_LargeChamber;
    const exitCount: number = isLarge ? 
        Number(weightedRandom(randomLargeExitOptions)) :
        Number(weightedRandom(randomNormalExitOptions));

    const chamber: Chamber = {
        id: generateDungeonId(entityModel.entityCode),
        shape: genShape(shape),
        isLarge: isLarge,
        dimension: genDimension(Number(length), Number(width)),
        exits: buildRandomExits(exitCount),
        description: "",
    }

    return chamber;
}

const buildStartPassage = (entityModel: RoomEntityModelRequest): Passage => {
    let [width] = entityModel.dimension.split('w');

    console.log(`width: ${width}, exits: ${entityModel.exits}`);

    const startingAreaPassage: Passage = {
        id: generateDungeonId(entityModel.entityCode),
        dimension: genDimension(10, Number(width)),
        exits: [],
        description: "",
    } as RoomEntity;
    return startingAreaPassage;
}

const buildRandomPassage = (roomId: string) => {
    const passageRegex = /([CFS](\d*)%?)|([PsD]*[LR]*)/g
    const randomPassage = weightedRandom(randomPassageOptions);
    const passageData = extractArrayFromRegexMatch(randomPassage, passageRegex);
    const length = passageData.shift();
    const exits = passageData;
    console.log(passageData);
    

    let newPassage: Passage = {
        id: generateExitId(RegexDungeonRules.P_Passage),
        exits: [],
        dimension: genDimension(Number(length ? length : 10), 10)
    };

}

const buildPassageWay = (roomId: string, exit?: Exit) => {
    let newPassage: PassageWay = {
        id: exit?.exitId !== undefined ? exit.exitId : generateExitId(RegexDungeonRules.P_Passage),
        roomIds: [roomId]
    };
    addExitPoint(newPassage);
    
}

const buildRandomStairs = (roomId: string) => {

}

const buildStartingStairs = (roomId: string, exit: Exit) => {

}

const buildRandomDoor = (roomId: string) => {
    const randomDoorType:string = weightedRandom(randomDoorTypeOptions);
    const randomBeyondDoor: string = weightedRandom(RandomBeyondDoorOptions);
    let doorType: DoorType = DoorType.Other;
    let isLocked: boolean = false;
    let isTrap: boolean = randomBeyondDoor === RandomBeyondDoor.Trap;
    [doorType, isLocked] = extractDoorPropFromCode(randomDoorType); 
    let newDoor: Door = {
        id: generateExitId(RegexDungeonRules.D_Door),
        doorType: doorType,
        isLocked: isLocked,
        isFalse: isTrap,
        isSecret: doorType === DoorType.Secret,
        roomIds: [roomId],
    }

    addExitPoint(newDoor);
    
    if(!isTrap) {
        buildBeyondDoor(newDoor, randomBeyondDoor);
    }
}

const buildStartingDoor = (roomId: string, exit?: Exit) => {

    const randomDoorType:string = weightedRandom(randomDoorTypeOptions);
    // const randomBeyondDoor: string = weightedRandom(RandomBeyondDoorOptions);
    const randomBeyondDoor: string = RandomBeyondDoor.Chamber;

    let doorType: DoorType = DoorType.Other;
    let isLocked: boolean = false;
    [doorType, isLocked] = extractDoorPropFromCode(randomDoorType); 
    let newDoor: Door = {
        id: exit?.exitId !== undefined ? exit.exitId : generateExitId(RegexDungeonRules.D_Door),
        doorType: doorType,
        isLocked: isLocked,
        isFalse: false,
        isSecret: exit?.isSecret !== undefined ? exit.isSecret : false,
        roomIds: [roomId],
    }
    addExitPoint(newDoor);
    buildBeyondDoor(newDoor, randomBeyondDoor);
}

const buildRandomExits = (exitCount: number): Exit[] => {
    let exits: Exit[] = [];

    for(let i = 0; i < exitCount; i++) {
        let exitCode = weightedRandom(randomExitTypeOptions);
        exits.push(genExit(exitCode));
    }

    return exits;
}

const buildBeyondDoor = (door: Door, randomBeyondDoor: string) => {
    let room = dungeonMap.get(door.roomIds?.length ? door.roomIds[1] : '');
    let beyondDoor: Partial<RoomEntity>;
    switch(randomBeyondDoor) {
        case RandomBeyondDoor.Chamber:
            beyondDoor = buildRandomChamber();
            addDungeonArea(beyondDoor as Chamber);
            //TODO figure out adding roomId to Exit and ExitEntity
            console.log("newly random chamber", beyondDoor);
    
            break;
        case RandomBeyondDoor.Passage:
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

const addNewExitsInRoom = (roomId: string, exitCode: string, amount: number, isSecret = false): Exit[] => {
    
    let newExits: Exit[] = [];
    for(let i = 0; i < amount; i++) {
        newExits.push(genExit(exitCode, isSecret))
    }

    buildStartingExitEntities(roomId, newExits);

    return newExits;
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

const genStartExits = (roomId: string, exitCode: string): Exit[] => {
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
    return addNewExitsInRoom(roomId, code, newAmount, isSecret);

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

const genExit = (exitCode: string, isSecret: boolean = false): Exit => {
    return {
        exitType: getExitTypeByCode(exitCode),
        exitId: generateExitId(exitCode),
        isSecret: isSecret,
    }
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

const addExitsToDungeonArea = (exits: Exit[], id: string) => {
    let room: RoomEntity | undefined = dungeonMap.get(id);
    if (room === undefined) {
        return;
    }
    room.exits = exits;
    dungeonMap.set(id, room);
}

const addRoomsToExit = (roomIds: string[], id: string) => {
    let exit: ExitEntity | undefined = exitMap.get(id);
    if(exit === undefined) {
        return;
    }
    exit.roomIds = roomIds;
    exitMap.set(id, exit);
}

const extractArrayFromRegexMatch = (entityType: string, regex: RegExp): string[] => {
    let match = entityType.match(regex);
    return match !== null ? Array.from<string>(match) : [];
}