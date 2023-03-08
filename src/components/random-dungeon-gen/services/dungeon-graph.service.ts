import { RandomBeyondExit, RandomBeyondDoorOptions, randomChamberOptions, RandomDoorType, randomDoorTypeOptions, randomExitTypeOptions, randomLargeExitOptions, randomNormalExitOptions, randomPassageOptions, RandomStartingArea, RegexDungeonRules, startingAreaRegex, weightedRandom, RandomPassage } from "../dungeon-graph.config";
import { Chamber, RoomShapeType, Dimension, Passage, RoomEntityModelRequest, ExitDTO, RoomEntity, ExitEntity, ExitType, Door, DoorType, PassageWay } from "../random-dungeon-gen.model";
import EntityGenerator from "./entity-generator.service";

export const dungeonMap: Map<string, RoomEntity> = new Map();
export const exitMap: Map<string, ExitEntity> = new Map();


const MAX_DUNGEON_SIZE = 50;
let exitQueue: string[] = [];
let exitCount: number = 0;
const exitsRegex = /(s?[A-Z])|((\d{1,}w?)|[a-z][A-Z])/g
const chamberRegex = /C[corst]?[nl]?\d{2}(x\d{2})*/g;
const EntitySplitRegex = /[CDPS][corst]?[ln]?|\d{2}w?(x\d{2})*/g

export const dungeonGenerateGraph = (startingAreaCode: string): RoomEntity => {
    const startingArea: RoomEntity = generateStartingArea(startingAreaCode);
    exitQueue.push(...startingArea.exitsIds);
    while (exitQueue.length) {
        let newExit = exitQueue.shift();
        if (newExit !== undefined) {
            buildBeyondExit(newExit);
        }
    }

    console.log(startingArea);
    console.log("dungeonMap", dungeonMap);
    console.log("exitMap", exitMap);
    return startingArea;
    
}

const generateStartingArea = (startingAreaCode: string):RoomEntity => {

    const entityModel = getStartingAreaEntityModelReq(startingAreaCode);
    
    
    let start: Partial<RoomEntity>;
    let newId: string = generateDungeonId(entityModel.entityCode);

    switch(entityModel.entityCode) {
        case RegexDungeonRules.C_Chamber:
            start = buildStartChamber(newId, entityModel);
            break;
        case RegexDungeonRules.P_Passage:
            start = buildStartPassage(newId, entityModel);
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

const getStartingAreaEntityModelReq = (areaCode: string): RoomEntityModelRequest => {
    const data = EntityGenerator.extractArrayFromRegexMatch(areaCode, startingAreaRegex)
    let entityType: string = "";
    let exits: string[] = [];
    
    [entityType, exits] = EntityGenerator.shiftAndExtractEntityExitsArray(data);

    let entity: string[] = EntityGenerator.extractArrayFromRegexMatch(entityType, EntitySplitRegex)
    return EntityGenerator.buildEntityModelReq(entity, exits);
};

const generateStartingExits = (dungeonId: string, startingExits: string[]): string[] => {
    let exits: string[] = [];
    startingExits.forEach(startExit => {
        exits.push(... decodeStartingExitRegex(dungeonId, startExit));
    });
    return exits;
}

const buildStartingExitEntities = (roomId: string, exits: ExitDTO[]) => {
    exits.forEach(exit => {
        switch(exit.exitType) {
            case ExitType.Passage:
                buildPassageWay(roomId, exit.exitId);
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
                buildPassageWay(roomId, exit.exitId);
                break;
            case ExitType.Stair:
                buildRandomStairs(roomId, exit);
                break;
            default:
                buildRandomDoor(roomId, exit);
                break;
        }
    });
}

const buildStartChamber = (newId: string ,entityModel: RoomEntityModelRequest): Chamber => {
    return buildChamber(newId, entityModel);
}

const buildRandomChamber = (newId: string, entranceExitId: string): Chamber => {
    const randomChamber = weightedRandom(randomChamberOptions);
    let entity: string[] = EntityGenerator.extractArrayFromRegexMatch(randomChamber, EntitySplitRegex);
    const entityModel = EntityGenerator.buildEntityModelReq(entity);
    
    return buildChamber(newId, entityModel, entranceExitId)
}

const buildChamber = (newId: string ,entityModel: RoomEntityModelRequest, entranceExitId?: string) => {
    let [_, shape, size] = entityModel.entityDesc;
    let [length, width] = entityModel.dimension.split('x');
    const shapeValue = EntityGenerator.genShape(shape);
    const isLargeSize = size === RegexDungeonRules.l_LargeChamber;
    let newExitIds: string[] = [];
    let x = 0;
    let y = 0;
    let z = 0;
    if(entranceExitId){
        let roomId = exitMap.get(entranceExitId)?.roomIds[0] || "";
        let room = dungeonMap.get(roomId);
        if(room){
            x = room.dimension.x + room.dimension.width;
            y = room.dimension.y + room.dimension.length;
            z = room.dimension.z;
        }
        let exitCount: number = isLargeSize ? 
        Number(weightedRandom(randomLargeExitOptions)) :
        Number(weightedRandom(randomNormalExitOptions));
        
        //debug to prevent memory leak
        if(dungeonMap.size > MAX_DUNGEON_SIZE) {
            exitCount = 0;
        }
        
        // let newId = generateDungeonId(entityModel.entityCode);
        newExitIds =  [entranceExitId , ...buildRandomExits(newId, exitCount)];
    }

    const newDim = EntityGenerator.genDimension(Number(length), Number(width), x, y, z);
    return EntityGenerator.genChamber(newId, newDim, shapeValue, isLargeSize, newExitIds);
}

const buildStartPassage = (newId: string,entityModel: RoomEntityModelRequest): Passage => {
    let [width] = entityModel.dimension.split('w');
    const newDim: Dimension = EntityGenerator.genDimension(10, Number(width));
    
    return EntityGenerator.genPassage(newId, newDim);
}

const buildRandomPassage = (roomId: string) => {
    //TODO - complete function implementation
    const passageRegex = /([CFS]|([PsD]*[LRF]))(\d*)%?/g
    const randomPassage = weightedRandom(randomPassageOptions);
    //Debug
    // const randomPassage = RandomPassage.Straight20SecretDoor10percent;
    const passageData = EntityGenerator.extractArrayFromRegexMatch(randomPassage, passageRegex);
    let length = 0;
    let width = 0;
    passageData.forEach(p => {
        //if contains D AND F then door is at end of passage
        if(p.includes('D')) {
            let newExitId = generateExitId(RegexDungeonRules.D_Door);
            let isSecret = p.includes('s');
            buildRandomDoor(roomId, EntityGenerator.genExit(newExitId, ExitType.Door, isSecret));
        }
        //if does not contain D but contains F then passage extends
        else if(p.includes('F')) {
            length += Number(p.substring(1));
        }
        else if(p.includes('P')) {
            let newExitId = generateExitId(RegexDungeonRules.P_Passage);
            buildPassageWay(roomId, newExitId);
        }
    })
    
    const exits: string[] = [dungeonMap.get(roomId)?.exitsIds.at(0) || ""];
    
    console.log("passageData", passageData);
    //TODO figure out passageData to be added to exitsIds
    const newId = generateDungeonId(RegexDungeonRules.P_Passage);
    const newDim = EntityGenerator.genDimension(Number(length), 10);
    return EntityGenerator.genPassage(newId, newDim, exits);
}

const buildPassageWay = (roomId: string, exitId: string) => {
    let newPassage: PassageWay =  EntityGenerator.genPassageWay(exitId, [roomId]);
    addExitPoint(newPassage);
}

const buildRandomStairs = (roomId: string, exit: ExitDTO) => {

}

const buildStartingStairs = (roomId: string, exit: ExitDTO) => {

}

const buildRandomDoor = (roomId: string, exit: ExitDTO) => {
    const randomBeyondDoor: string = weightedRandom(RandomBeyondDoorOptions);
    let isTrap: boolean = randomBeyondDoor === RandomBeyondExit.Trap;
    
    buildDoor(roomId, exit, isTrap);
}

const buildStartingDoor = (roomId: string, exit: ExitDTO) => {
    buildDoor(roomId, exit);
}

const buildDoor = (roomId: string, exit: ExitDTO, isTrap=false) => {
    const randomDoorType:string = weightedRandom(randomDoorTypeOptions);
    let doorType: DoorType = DoorType.Other;
    let isLocked: boolean = false;
    [doorType, isLocked] = extractDoorPropFromCode(randomDoorType);
    let isSecret = doorType === DoorType.Secret;
    
    let newDoor: Door = EntityGenerator.genDoor(exit.exitId as string, doorType, [roomId], isLocked, isTrap, isSecret);
    addExitPoint(newDoor);

}

const buildRandomExits = (roomId: string,exitCount: number): string[] => {
    let exits: ExitDTO[] = [];

    for(let i = 0; i < exitCount; i++) {
        let exitCode = weightedRandom(randomExitTypeOptions);
        let exitId = generateExitId(exitCode);
        let exitType = getExitTypeByCode(exitCode);
        exits.push(EntityGenerator.genExit(exitId, exitType));
    }
    //TODO - Implement function equivalent to buildStartingExitEntities
    buildRandomExitEntities(roomId, exits);
    return exits.map(exit => exit.exitId || "");
}

const buildBeyondExit = (exitId: string) => {
    // const randomBeyondDoorRoomType: string = weightedRandom(RandomBeyondDoorOptions);
    //TODO - refactor switch statement similar to generateStartingArea()
    const randomBeyondExit: string = RandomBeyondExit.Chamber;

    const exit = exitMap.get(exitId);
    if(exit === undefined) {
        return;
    }
    let room = dungeonMap.get(exit.roomIds?.length ? exit.roomIds[0] : '');
    let roomId = room !== undefined ? room.id : "";
    let beyondDoor: Partial<RoomEntity>;
    let newId = "";
    
    switch(randomBeyondExit) {
        case RandomBeyondExit.Chamber:
            newId = generateDungeonId(RegexDungeonRules.C_Chamber)
            beyondDoor = buildRandomChamber(newId, exitId);
            /* addToExitQueue(newRandomChamber.exitsIds);
            addDungeonArea(newRandomChamber);
            addRoomsToExit(newRandomChamber.id, exit.id);
             */
            //console.log("newly random chamber", beyondDoor);
    
            break;
        case RandomBeyondExit.Passage:
            beyondDoor = buildRandomPassage(roomId);
            /* addToExitQueue(newRandomPassage.exitsIds);
            addDungeonArea(newRandomPassage);
             */
            //console.log("newly random Passage", beyondDoor);
            break;
        /* TODO: Add Stairs function
        case RandomBeyondExit.Stairs:
            break;
         */
        default:
            beyondDoor = {description: "error"};
    }

    if(beyondDoor.description != 'error') {
        const newRoom: RoomEntity = beyondDoor as RoomEntity;
        addToExitQueue(newRoom.exitsIds);
        addDungeonArea(newRoom);
        addRoomsToExit(newRoom.id, exit.id);
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

const decodeStartingExitRegex = (roomId: string, exitCode: string): string[] => {
    let exits = EntityGenerator.extractArrayFromRegexMatch(exitCode, exitsRegex);
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

const addNewExitsInStartingRoom = (roomId: string, exitCode: string, amount: number, isSecret = false): string[] => {
    
    let newStartingExits: ExitDTO[] = [];
    for(let i = 0; i < amount; i++) {
        let exitType = getExitTypeByCode(exitCode);
        let exitId = generateExitId(exitCode);
        newStartingExits.push(EntityGenerator.genExit(exitId, exitType, isSecret))
    }
    buildStartingExitEntities(roomId, newStartingExits);
    
    return newStartingExits.map(exit => exit.exitId || "");
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

const addToExitQueue = (exitIds: string[]) => {
    const exitsExcludeFirst = exitIds.filter((_, idx) => idx > 0);
    if(exitsExcludeFirst.length) {
        exitQueue.push(...exitsExcludeFirst);
    }
}