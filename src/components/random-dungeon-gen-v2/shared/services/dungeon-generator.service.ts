import { cloneDeep, remove } from 'lodash-es';
import { DoorType, ErrorType, ExitType, RoomShapeType } from '../model/dungeon-type.model';
import { CardinalDirectionName, Transform, Vector2, Vector3 } from "../model/Transform";
import { RoomEntityModelRequest } from "../model/dungeon-entity.model";
import { Chamber, Door, ExitDTO, Passage, PassageWay } from "../model/dungeon-entity.model";
import { ExitEntity, RoomEntity } from "../model/dungeon-entity.model";
import {
  RandomBeyondExit,
  RegexDungeonRules,
  decodeDoorTypeCode,
  randomBeyondDoorOptions,
  randomChamberOptions,
  randomDoorTypeOptions,
  randomExitTypeOptions,
  randomLargeExitOptions,
  randomNormalExitOptions,
  randomPassageOptions,
  startingAreaRegex,
  weightedRandom,
} from '../dungeon.config';
import { UtilitiesService } from './utilities.service';
import { EntityGeneratorService } from './entity-generator.service';

export class DungeonGeneratorService {
  private dungeonMap: Map<string, RoomEntity> = new Map();
  private exitMap: Map<string, ExitEntity> = new Map();
  private collisionMap: boolean[][] = [[]];

  private readonly MAX_DUNGEON_SIZE = 10;
  private exitQueue: string[] = [];
  private exitCount: number = 0;
  private exitsRegex = /(s?[A-Z])|((\d{1,}w?)|[a-z][A-Z])/g;
  private EntitySplitRegex = /[CDPS][corst]?[ln]?|\d{2}w?(x\d{2})*/g;
  private startingArea!: RoomEntity;

  public getDungeonMap(): Map<string, RoomEntity> {
    const map = new Map();
    this.dungeonMap.forEach((value, key) => {
      map.set(key, cloneDeep(value));
    });
    return map;
  }

  public getExitMap(): Map<string, ExitEntity> {
    const map = new Map();
    this.exitMap.forEach((value, key) => {
      map.set(key, cloneDeep(value));
    });
    return map;
  }

  private reset() {
    this.dungeonMap = new Map();
    this.exitMap = new Map();
    this.collisionMap = [[]];
    this.exitCount = 0;
    this.exitQueue = [];
  }

  public dungeonGenerateGraph = (startingAreaCode: string, debugStartChamber = false): RoomEntity => {
    this.reset();
    this.startingArea = this.generateStartingArea(startingAreaCode);
    this.exitQueue.push(...this.startingArea.exitsIds);
    while (this.exitQueue.length && this.isDebugStart(debugStartChamber)) {
      let newExit = this.exitQueue.shift();
      if (newExit !== undefined) {
        this.buildBeyondExit(newExit);
      }
    }

    return this.startingArea;
  };

  public isDebugStart = (condition: boolean): boolean => {
    return condition ? this.dungeonMap.size <= this.startingArea.exitsIds.length : true;
  };

  public generateStartingArea = (startingAreaCode: string): RoomEntity => {
    const entityModel = this.getStartingAreaEntityModelReq(startingAreaCode);

    let [length, width] = [entityModel.dimension.x, entityModel.dimension.y];
    const startTansform = EntityGeneratorService.genTransform(length, width, 0, 0, 0, CardinalDirectionName.East);

    UtilitiesService.isValidCollisionPlacement(this.collisionMap, startTansform);

    let start: Partial<RoomEntity>;
    let newId: string = this.generateDungeonId(entityModel.entityCode);

    switch (entityModel.entityCode) {
      case RegexDungeonRules.C_Chamber:
        start = this.buildStartChamber(newId, entityModel);
        break;
      case RegexDungeonRules.P_Passage:
        start = this.buildStartPassage(newId, entityModel);
        break;
      default:
        start = { description: ErrorType.ERROR };
    }

    if (start.description !== ErrorType.ERROR) {
      const newRoom: RoomEntity = start as RoomEntity;
      this.addDungeonArea(newRoom);
      const newExitDTOs = this.generateStartingExitDTOs(newRoom.id, entityModel.exits);
      this.buildStartingExitEntities(newRoom.id, newExitDTOs, (newRoom as Chamber).shape);
      const newExitIds = newExitDTOs.map(exit => exit.exitId || "");
      start = this.addExitsToDungeonArea(newExitIds, newRoom.id) as RoomEntity;
    }

    return start as RoomEntity;
  };

  public getStartingAreaEntityModelReq = (areaCode: string): RoomEntityModelRequest => {
    const data = UtilitiesService.extractArrayFromRegexMatch(areaCode, startingAreaRegex);
    let entityType: string = "";
    let exits: string[] = [];

    [entityType, exits] = UtilitiesService.shiftAndExtractEntityExitsArray(data);

    let entity: string[] = UtilitiesService.extractArrayFromRegexMatch(entityType, this.EntitySplitRegex);
    return EntityGeneratorService.genEntityModelReq(entity, exits);
  };

  public generateStartingExitDTOs = (dungeonId: string, startingExits: string[]): ExitDTO[] => {
    let decodedExits = UtilitiesService.decodeExitRegex(startingExits, this.exitsRegex);
    let exitDTOs: ExitDTO[] = this.addNewExitsInStartingRoom(dungeonId, decodedExits);
    return exitDTOs;
  };

  public buildStartingExitEntities = (roomId: string, exits: ExitDTO[], shape?: RoomShapeType) => {
    exits.forEach(exit => {
      switch (exit.exitType) {
        case ExitType.Passage:
          this.buildPassageWay(roomId, exit);
          break;
        case ExitType.Stair:
          this.buildStartingStairs(roomId, exit);
          break;
        default:
          this.buildStartingDoor(roomId, exit);
          break;
      }
      this.fixCircleExitCenter(exit, shape);
    });
  };

  public buildRandomExitEntities = (roomId: string, exits: ExitDTO[], shape?: RoomShapeType) => {
    exits.forEach(exit => {
      switch (exit.exitType) {
        case ExitType.Passage:
          this.buildPassageWay(roomId, exit);
          break;
        case ExitType.Stair:
          this.buildRandomStairs(roomId, exit);
          break;
        default:
          this.buildRandomDoor(roomId, exit);
          break;
      }
      this.fixCircleExitCenter(exit, shape);
    });
  };

  // EntityGeneratorService.genTransform offsets the exit's center from its
  // position by half the door's perpendicular thickness — correct for doors
  // against straight rect walls, wrong for circles where we want the rendered
  // dot exactly at the parametric circumference point.
  private fixCircleExitCenter = (exit: ExitDTO, shape?: RoomShapeType): void => {
    if (shape !== RoomShapeType.Circle || !exit.exitId) return;
    const entity = this.exitMap.get(exit.exitId);
    if (!entity) return;
    entity.transform.center = { x: exit.position.x, y: exit.position.y } as Vector2;
  };

  public buildStartChamber = (newId: string, entityModel: RoomEntityModelRequest): Chamber => {
    return this.buildChamber(newId, entityModel);
  };

  public buildRandomChamber = (newId: string, entranceExitId: string): Chamber => {
    const randomChamber = weightedRandom(randomChamberOptions);
    let entity: string[] = UtilitiesService.extractArrayFromRegexMatch(randomChamber, this.EntitySplitRegex);
    const entityModel = EntityGeneratorService.genEntityModelReq(entity);

    const newChamber = this.buildChamber(newId, entityModel);
    let chamberTransform = newChamber.transform;
    let exitEntity = this.getExitById(entranceExitId);
    let room = this.getDungeonAreaById(exitEntity.roomIds[0] || "");
    if (!room || !exitEntity) {
      return newChamber;
    }
    let roomPosition = UtilitiesService.fixRoomPositionToExitDirection(chamberTransform, exitEntity.transform);
    let dimension = new Vector3(chamberTransform.dimension.x, chamberTransform.dimension.y);
    let newChamberTransform = EntityGeneratorService.genTransform(dimension, roomPosition, exitEntity.transform.direction);

    const validCollision = UtilitiesService.isValidCollisionPlacement(this.collisionMap, newChamberTransform);
    if (!validCollision) {
      newChamber.description = ErrorType.INVALID_COLLISION;
      return newChamber;
    }

    let exitCount: number = newChamber.isLarge
      ? Number(weightedRandom(randomLargeExitOptions))
      : Number(weightedRandom(randomNormalExitOptions));

    if (this.dungeonMap.size > this.MAX_DUNGEON_SIZE) {
      exitCount = 0;
    }
    let newExitIds = [entranceExitId, ...this.buildRandomExits(newId, newChamberTransform, exitCount, newChamber.shape)];
    newChamber.transform = newChamberTransform;
    newChamber.setExits(newExitIds);
    return newChamber;
  };

  public buildChamber = (newId: string, entityModel: RoomEntityModelRequest) => {
    let [length, width] = [entityModel.dimension.x, entityModel.dimension.y];
    const shapeValue = EntityGeneratorService.genShape(entityModel.shape);
    const isLargeSize = entityModel.size === RegexDungeonRules.l_LargeChamber;
    let newChamber: Vector3 = { x: 0, y: 0, z: 0 } as Vector3;
    let vector2: Vector2 = { x: Number(length), y: Number(width) } as Vector2;
    const newTransform = EntityGeneratorService.genTransform(vector2, newChamber);
    return EntityGeneratorService.genChamber(newId, newTransform, shapeValue, isLargeSize);
  };

  public buildStartPassage = (newId: string, entityModel: RoomEntityModelRequest): Passage => {
    let [length, width] = [entityModel.dimension.x, entityModel.dimension.y];
    const newTransform: Transform = EntityGeneratorService.genTransform(length, width);

    return EntityGeneratorService.genPassage(newId, newTransform);
  };

  public buildRandomPassage = (roomId: string) => {
    const passageRegex = /([CFS]|([PsD]*[LRF]))(\d*)%?/g;
    const randomPassage = weightedRandom(randomPassageOptions);
    const passageData = UtilitiesService.extractArrayFromRegexMatch(randomPassage, passageRegex);
    let length = 0;
    let width = 0;
    passageData.forEach(p => {
      if (p.includes('D')) {
        let newExitId = this.generateExitId(RegexDungeonRules.D_Door);
        let isSecret = p.includes('s');
        let position: Vector2 = { x: length, y: width } as Vector2;
        this.buildRandomDoor(roomId, EntityGeneratorService.genExit(newExitId, ExitType.Door, position, CardinalDirectionName.East, isSecret));
      } else if (p.includes('F')) {
        length += Number(p.substring(1));
      } else if (p.includes('P')) {
        let newExitId = this.generateExitId(RegexDungeonRules.P_Passage);
        let exitDTO: ExitDTO = EntityGeneratorService.genExit(newExitId, ExitType.Passage, { x: length, y: width } as Vector2);
        this.buildPassageWay(roomId, exitDTO);
      }
    });

    const exits: string[] = [this.getDungeonAreaById(roomId).exitsIds.at(0) || ""];

    const newId = this.generateDungeonId(RegexDungeonRules.P_Passage);
    const newTransform = EntityGeneratorService.genTransform(Number(length), 10);
    return EntityGeneratorService.genPassage(newId, newTransform, exits);
  };

  public buildPassageWay = (roomId: string, exit: ExitDTO) => {
    let newPassage: PassageWay = EntityGeneratorService.genPassageWay(exit.exitId, [roomId], exit);
    this.addExitPoint(newPassage);
  };

  public buildRandomStairs = (roomId: string, exit: ExitDTO) => {};

  public buildStartingStairs = (roomId: string, exit: ExitDTO) => {};

  public buildRandomDoor = (roomId: string, exit: ExitDTO) => {
    const randomBeyondDoor: string = weightedRandom(randomBeyondDoorOptions);
    exit.isTrap = randomBeyondDoor === RandomBeyondExit.Trap;

    this.buildDoor(roomId, exit);
  };

  public buildStartingDoor = (roomId: string, exit: ExitDTO) => {
    this.buildDoor(roomId, exit);
  };

  public buildDoor = (roomId: string, exit: ExitDTO) => {
    const randomDoorType: string = weightedRandom(randomDoorTypeOptions);
    const [doorType, isLocked] = decodeDoorTypeCode(randomDoorType);
    exit.isLocked = isLocked;
    exit.isSecret = doorType === DoorType.Secret;

    const newDoor: Door = EntityGeneratorService.genDoor(exit.exitId, doorType, [roomId], exit);
    this.addExitPoint(newDoor);
  };

  public buildRandomExits = (newRoomId: string, newRoomTransform: Transform, exitCount: number, shape?: RoomShapeType): string[] => {
    let exits: ExitDTO[] = [];

    let exitPositions: Vector2[] = UtilitiesService.buildExitsInRoom(newRoomTransform, exitCount, shape);
    exitPositions.forEach(exitPosition => {
      let exitCode = weightedRandom(randomExitTypeOptions);
      let exitId = this.generateExitId(exitCode);
      let exitType = this.getExitTypeByCode(exitCode);
      let exitDirection = UtilitiesService.getRelativeDirection(exitPosition, newRoomTransform);
      let fixedExitPosition = UtilitiesService.fixExitToRoomWall(exitPosition, exitDirection, newRoomTransform, shape);
      exits.push(EntityGeneratorService.genExit(exitId, exitType, fixedExitPosition, exitDirection));
    });
    this.buildRandomExitEntities(newRoomId, exits, shape);
    return exits.map(exit => exit.exitId || "");
  };

  public buildBeyondExit = (exitId: string) => {
    const randomBeyondExit: string = RandomBeyondExit.Chamber;

    const exit = this.getExitById(exitId);
    let room = this.getDungeonAreaById(exit.roomIds?.length ? exit.roomIds[0] : '');
    let roomId = room.id;
    let beyondDoor: Partial<RoomEntity>;
    let newId = "";

    switch (randomBeyondExit) {
      case RandomBeyondExit.Chamber:
        newId = this.generateDungeonId(RegexDungeonRules.C_Chamber);
        beyondDoor = this.buildRandomChamber(newId, exitId);
        break;
      case RandomBeyondExit.Passage:
        beyondDoor = this.buildRandomPassage(roomId);
        break;
      default:
        beyondDoor = { description: ErrorType.ERROR };
    }

    if (beyondDoor.description === ErrorType.INVALID_COLLISION) {
      this.removeExitPoint(exitId);
      this.removeDungeonArea(newId);
      return;
    }

    if (beyondDoor.description !== ErrorType.ERROR) {
      const newRoom: RoomEntity = beyondDoor as RoomEntity;
      this.addToExitQueue(newRoom.exitsIds);
      this.addDungeonArea(newRoom);
      this.addRoomsToExit(newRoom.id, exit.id);
    }
  };

  public generateDungeonId = (entityCode: string): string => {
    return `${entityCode}${this.dungeonMap.size}`;
  };

  public addDungeonArea = (room: RoomEntity) => {
    this.dungeonMap.set(room.id, room);
  };

  public removeDungeonArea = (roomId: string): boolean => {
    return this.dungeonMap.delete(roomId);
  };

  public getDungeonAreaById = (roomId: string): RoomEntity => {
    return this.dungeonMap.get(roomId) as RoomEntity;
  };

  public generateExitId = (entityCode: string): string => {
    return `${entityCode}${this.exitCount++}`;
  };

  public addExitPoint = (exit: ExitEntity) => {
    this.exitMap.set(exit.id, exit);
  };

  public getExitById = (exitId: string): ExitEntity => {
    return this.exitMap.get(exitId) as ExitEntity;
  };

  public removeExitPoint = (exitId: string): boolean => {
    const exitToRemove = this.getExitById(exitId);
    exitToRemove.roomIds.forEach(e => {
      const room = this.getDungeonAreaById(e);
      remove(room.exitsIds, (f) => f === exitId);
      room.setExits(room.exitsIds);
    });
    return this.exitMap.delete(exitId);
  };

  public getExitTypeByCode = (exitCode: string): ExitType => {
    switch (exitCode) {
      case RegexDungeonRules.D_Door:
      case RegexDungeonRules.sD_SecretDoor:
        return ExitType.Door;
      case RegexDungeonRules.S_Stairs:
        return ExitType.Stair;
      default:
        return ExitType.Passage;
    }
  };

  public addNewExitsInStartingRoom = (roomId: string, exitCodes: string[]): ExitDTO[] => {
    let amount = exitCodes.length;
    let newStartingExits: ExitDTO[] = [];

    const room = this.getDungeonAreaById(roomId);
    let roomTransform = room?.transform;
    if (!roomTransform) {
      return [];
    }
    const shape: RoomShapeType | undefined = (room as Chamber).shape;

    let exitPositions: Vector2[] = UtilitiesService.buildExitsInRoom(roomTransform, amount, shape);
    for (let i = 0; i < amount; i++) {
      let exitCode = exitCodes[i];
      let exitType = this.getExitTypeByCode(exitCode);
      let exitId = this.generateExitId(exitCode);
      let isSecret = exitCode === RegexDungeonRules.sD_SecretDoor;
      let direction = UtilitiesService.getRelativeDirection(exitPositions[i], roomTransform);
      let fixedExitPosition = UtilitiesService.fixExitToRoomWall(exitPositions[i], direction, roomTransform, shape);
      newStartingExits.push(EntityGeneratorService.genExit(exitId, exitType, fixedExitPosition, direction, isSecret));
    }
    return newStartingExits;
  };

  public addExitsToDungeonArea = (newExitIds: string[], id: string): RoomEntity => {
    let room: RoomEntity = this.getDungeonAreaById(id);
    room.setExits(newExitIds);
    this.dungeonMap.set(id, room);
    return room;
  };

  public addRoomsToExit = (roomId: string, exitId: string) => {
    let exit: ExitEntity = this.getExitById(exitId);
    let newRoomIds: string[] = exit.roomIds;
    newRoomIds.push(roomId);
    exit.setRooms(newRoomIds);
    this.exitMap.set(exitId, exit);
  };

  public addToExitQueue = (exitIds: string[]) => {
    const exitsExcludeFirst = exitIds.filter((_, idx) => idx > 0);
    if (exitsExcludeFirst.length) {
      this.exitQueue.push(...exitsExcludeFirst);
    }
  };
}
