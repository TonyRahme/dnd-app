import { RandomBeyondExit, RandomBeyondDoorOptions, randomChamberOptions, RandomDoorType, randomDoorTypeOptions, randomExitTypeOptions, randomLargeExitOptions, randomNormalExitOptions, randomPassageOptions, RandomStartingArea, RegexDungeonRules, startingAreaRegex, weightedRandom, RandomPassage } from "../dungeon-graph.config";
import { Chamber, RoomShapeType, Transform, Passage, RoomEntityModelRequest, ExitDTO, RoomEntity, ExitEntity, ExitType, Door, DoorType, PassageWay, Vector2, CardinalDirectionVector2, Vector3, CardinalDirectionName } from "../random-dungeon-gen.model";
import EntityGenerator from "./entity-generator.service";
import Utilities from "./utilities.service";

export const dungeonMap: Map<string, RoomEntity> = new Map();
export const exitMap: Map<string, ExitEntity> = new Map();


const MAX_DUNGEON_SIZE = 50;
let exitQueue: string[] = [];
let exitCount: number = 0;
const exitsRegex = /(s?[A-Z])|((\d{1,}w?)|[a-z][A-Z])/g
const chamberRegex = /C[corst]?[nl]?\d{2}(x\d{2})*/g;
const EntitySplitRegex = /[CDPS][corst]?[ln]?|\d{2}w?(x\d{2})*/g
let startingArea: RoomEntity;

export const dungeonGenerateGraph = (startingAreaCode: string, debugStartChamber = false): RoomEntity => {
    startingArea = generateStartingArea(startingAreaCode);
    exitQueue.push(...startingArea.exitsIds);
    while (exitQueue.length && isDebugStart(debugStartChamber)) {
        let newExit = exitQueue.shift();
        //Debug
        if (newExit !== undefined) {
            buildBeyondExit(newExit);
        }
    }

    console.log(startingArea);
    console.log("dungeonMap", dungeonMap);
    console.log("exitMap", exitMap);
    return startingArea;
    
}

const isDebugStart = (condition: boolean): boolean => {
    return condition ? dungeonMap.size <= startingArea.exitsIds.length : true;
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
        const newExitDTOs = generateStartingExitDTOs(newRoom.id, entityModel.exits);
        buildStartingExitEntities(newRoom.id, newExitDTOs);
        const newExitIds = newExitDTOs.map(exit => exit.exitId || "");
        start = addExitsToDungeonArea(newExitIds, newRoom.id) as RoomEntity;
    }

    return start as RoomEntity;
    
}

const getStartingAreaEntityModelReq = (areaCode: string): RoomEntityModelRequest => {
    const data = Utilities.extractArrayFromRegexMatch(areaCode, startingAreaRegex)
    let entityType: string = "";
    let exits: string[] = [];
    
    [entityType, exits] = Utilities.shiftAndExtractEntityExitsArray(data);

    let entity: string[] = Utilities.extractArrayFromRegexMatch(entityType, EntitySplitRegex)
    return EntityGenerator.genEntityModelReq(entity, exits);
};

const generateStartingExitDTOs = (dungeonId: string, startingExits: string[]): ExitDTO[] => {
    let decodedExits = Utilities.decodeExitRegex(startingExits, exitsRegex);
    let exitDTOs: ExitDTO[] = addNewExitsInStartingRoom(dungeonId, decodedExits);
    return exitDTOs;
}

const buildStartingExitEntities = (roomId: string, exits: ExitDTO[]) => {
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

const buildRandomExitEntities = (roomId: string, exits: ExitDTO[]) => {
    exits.forEach(exit => {
        switch(exit.exitType) {
            case ExitType.Passage:
                buildPassageWay(roomId, exit);
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
    let entity: string[] = Utilities.extractArrayFromRegexMatch(randomChamber, EntitySplitRegex);
    const entityModel = EntityGenerator.genEntityModelReq(entity);
    
    const newChamber =  buildChamber(newId, entityModel);
    let chamberTransform = newChamber.transform;
    let exitEntity = getExitById(entranceExitId);
    let room = getDungeonAreaById(exitEntity.roomIds[0] || "");
    if(!room || !exitEntity){
        return newChamber;
    }
    let vector3 = Utilities.fixRoomToExitDirection(chamberTransform, exitEntity.transform);
    let newChamberTransform = EntityGenerator.genTransform({x: chamberTransform.length, y: chamberTransform.width}, vector3, exitEntity.transform.direction);;
    
    let exitCount: number = newChamber.isLarge ? 
    Number(weightedRandom(randomLargeExitOptions)) :
    Number(weightedRandom(randomNormalExitOptions));
    
    //debug to prevent memory leak
    if(dungeonMap.size > MAX_DUNGEON_SIZE) {
        exitCount = 0;
    }
    let newExitIds =  [entranceExitId , ...buildRandomExits(newId, newChamberTransform, exitCount)];
    newChamber.transform = newChamberTransform;
    newChamber.setExits(newExitIds);
    return newChamber;
}

const buildChamber = (newId: string ,entityModel: RoomEntityModelRequest) => {
    let [_, shape, size] = entityModel.entityDesc;
    let [length, width] = entityModel.dimension.split('x');
    if (width === undefined){
        width = length;
    }
    const shapeValue = EntityGenerator.genShape(shape);
    const isLargeSize = size === RegexDungeonRules.l_LargeChamber;
    let newChamber: Vector3 = {x:0,y:0, z:0};
    let vector2: Vector2 = {x: Number(length), y: Number(width)};
    const newTransform = EntityGenerator.genTransform(vector2, newChamber);
    return EntityGenerator.genChamber(newId, newTransform, shapeValue, isLargeSize);
}

const buildStartPassage = (newId: string,entityModel: RoomEntityModelRequest): Passage => {
    let [width] = entityModel.dimension.split('w');
    const newTransform: Transform = EntityGenerator.genTransform(10, Number(width));
    
    return EntityGenerator.genPassage(newId, newTransform);
}

const buildRandomPassage = (roomId: string) => {
    //TODO - complete function implementation
    const passageRegex = /([CFS]|([PsD]*[LRF]))(\d*)%?/g
    const randomPassage = weightedRandom(randomPassageOptions);
    //Debug
    // const randomPassage = RandomPassage.Straight20SecretDoor10percent;
    const passageData = Utilities.extractArrayFromRegexMatch(randomPassage, passageRegex);
    let length = 0;
    let width = 0;
    passageData.forEach(p => {
        //if contains D AND F then door is at end of passage
        if(p.includes('D')) {
            let newExitId = generateExitId(RegexDungeonRules.D_Door);
            let isSecret = p.includes('s');
            //TODO fix position
            let position:Vector2 = {x:length,y:width}
            buildRandomDoor(roomId, EntityGenerator.genExit(newExitId, ExitType.Door, position, CardinalDirectionName.East,isSecret));
        }
        //if does not contain D but contains F then passage extends
        else if(p.includes('F')) {
            length += Number(p.substring(1));
        }
        else if(p.includes('P')) {
            let newExitId = generateExitId(RegexDungeonRules.P_Passage);
            let exitDTO: ExitDTO = EntityGenerator.genExit(newExitId, ExitType.Passage, {x:length, y:width});
            buildPassageWay(roomId, exitDTO);
        }
    })
    
    const exits: string[] = [getDungeonAreaById(roomId).exitsIds.at(0) || ""];
    
    console.log("passageData", passageData);
    //TODO figure out passageData to be added to exitsIds
    const newId = generateDungeonId(RegexDungeonRules.P_Passage);
    const newTransform = EntityGenerator.genTransform(Number(length), 10);
    return EntityGenerator.genPassage(newId, newTransform, exits);
}

const buildPassageWay = (roomId: string, exit: ExitDTO) => {
    let newPassage: PassageWay =  EntityGenerator.genPassageWay(exit.exitId, [roomId], exit);
    addExitPoint(newPassage);
}

const buildRandomStairs = (roomId: string, exit: ExitDTO) => {

}

const buildStartingStairs = (roomId: string, exit: ExitDTO) => {

}

const buildRandomDoor = (roomId: string, exit: ExitDTO) => {
    const randomBeyondDoor: string = weightedRandom(RandomBeyondDoorOptions);
    exit.isTrap = randomBeyondDoor === RandomBeyondExit.Trap;
    
    buildDoor(roomId, exit);
}

const buildStartingDoor = (roomId: string, exit: ExitDTO) => {
    buildDoor(roomId, exit);
}

const buildDoor = (roomId: string, exit: ExitDTO) => {
    const randomDoorType:string = weightedRandom(randomDoorTypeOptions);
    let doorType: DoorType;
    let isLocked: boolean = false;
    [doorType, isLocked] = extractDoorPropFromCode(randomDoorType);
    exit.isLocked = isLocked;
    exit.isSecret = doorType === DoorType.Secret;
    
    let newDoor: Door = EntityGenerator.genDoor(exit.exitId, doorType, [roomId], exit);
    addExitPoint(newDoor);

}

const buildRandomExits = (newRoomId: string, newRoomTransform: Transform, exitCount: number): string[] => {
    let exits: ExitDTO[] = [];

    let exitPositions: Vector2[] = Utilities.getExitPointsByRoomId(newRoomTransform, exitCount);
    exitPositions.forEach(exitPosition => {
            let exitCode = weightedRandom(randomExitTypeOptions);
            let exitId = generateExitId(exitCode);
            let exitType = getExitTypeByCode(exitCode);
            let exitDirection = Utilities.getRelativeDirection(exitPosition, newRoomTransform);
            let fixedExitPosition = Utilities.fixExitToRoomWall(exitPosition, exitDirection, newRoomTransform);
            exits.push(EntityGenerator.genExit(exitId, exitType, fixedExitPosition, exitDirection));
        }); 
    //TODO - Implement function equivalent to buildStartingExitEntities
    buildRandomExitEntities(newRoomId, exits);
    return exits.map(exit => exit.exitId || "");
}

const buildBeyondExit = (exitId: string) => {
    // const randomBeyondDoorRoomType: string = weightedRandom(RandomBeyondDoorOptions);
    //TODO - refactor switch statement similar to generateStartingArea()
    const randomBeyondExit: string = RandomBeyondExit.Chamber;

    const exit = getExitById(exitId);
    let room = getDungeonAreaById(exit.roomIds?.length ? exit.roomIds[0] : '');
    let roomId = room.id;
    let beyondDoor: Partial<RoomEntity>;
    let newId = "";
    
    switch(randomBeyondExit) {
        case RandomBeyondExit.Chamber:
            newId = generateDungeonId(RegexDungeonRules.C_Chamber)
            beyondDoor = buildRandomChamber(newId, exitId);
            
            break;
        case RandomBeyondExit.Passage:
            beyondDoor = buildRandomPassage(roomId);
            break;
        /* TODO: Add Stairs function
        case RandomBeyondExit.Stairs:
            break;
         */
        default:
            beyondDoor = {description: "error"};
    }

    if(beyondDoor.description !== 'error') {
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

const getDungeonAreaById = (roomId: string): RoomEntity => {
    return dungeonMap.get(roomId) as RoomEntity;
}

const generateExitId = (entityCode: string): string => {
    return `${entityCode}${exitCount++}`
}

const addExitPoint = (exit: ExitEntity) => {
    exitMap.set(exit.id, exit);
}

const getExitById = (exitId: string): ExitEntity => {
    return exitMap.get(exitId) as ExitEntity;
}

const getExitTypeByCode = (exitCode: string): ExitType => {
    switch(exitCode) {
        case RegexDungeonRules.D_Door:
        case RegexDungeonRules.sD_SecretDoor:
            return ExitType.Door;
        case RegexDungeonRules.S_Stairs:
            return ExitType.Stair;
        default:
            return ExitType.Passage;
    }
}

const addNewExitsInStartingRoom = (roomId: string, exitCodes: string[]): ExitDTO[] => {
    let amount = exitCodes.length;
    let newStartingExits: ExitDTO[] = [];
    
    let roomTransform = getDungeonAreaById(roomId).transform;
    if(!roomTransform){
        return [];
    }
    
    let exitPositions: Vector2[] = Utilities.getExitPointsByRoomId(roomTransform, amount);
    for(let i = 0; i < amount; i++) {
        let exitCode = exitCodes[i];
        let exitType = getExitTypeByCode(exitCode);
        let exitId = generateExitId(exitCode);
        let isSecret = exitCode === RegexDungeonRules.sD_SecretDoor;
        let direction = Utilities.getRelativeDirection(exitPositions[i], roomTransform);
        let fixedExitPosition = Utilities.fixExitToRoomWall(exitPositions[i], direction, roomTransform);
        newStartingExits.push(EntityGenerator.genExit(exitId, exitType, fixedExitPosition, direction, isSecret));
    }
    //Debug
    // console.log('new starting exits', newStartingExits);
    return newStartingExits;
}

const addExitsToDungeonArea = (newExitIds: string[], id: string): RoomEntity => {
    let room: RoomEntity = getDungeonAreaById(id);
    room.setExits(newExitIds);
    dungeonMap.set(id, room);
    return room;
}

const addRoomsToExit = (roomId: string, exitId: string) => {
    let exit: ExitEntity = getExitById(exitId);
    let newRoomIds: string[] = exit.roomIds;
    newRoomIds.push(roomId)
    exit.setRooms(newRoomIds);
    exitMap.set(exitId, exit);
}

const addToExitQueue = (exitIds: string[]) => {
    const exitsExcludeFirst = exitIds.filter((_, idx) => idx > 0);
    if(exitsExcludeFirst.length) {
        exitQueue.push(...exitsExcludeFirst);
    }
}