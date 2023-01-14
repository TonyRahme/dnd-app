import { RegexDungeonRules } from "./dungeon-graph.config";
import { Chamber, RoomShape, Dimension, DungeonEntity, ExitType, StairType, Passage, EntityModelRequest } from "./random-dungeon-gen.model";


const chamberRegex = /C[corst]?[nl]?\d{2}(x\d{2})*/g;
const EntitySplitRegex = /[CDPS][corst]?[ln]?|\d{2}w?(x\d{2})*/g

export const dungeonGenerateGraph = (data: string[]) => {

    const startingAreaData = getStartingAreaReq(data);
    const startingArea = generateStartingArea(startingAreaData);
    console.log(startingArea);
    
}

const getStartingAreaReq = (data: string[]): EntityModelRequest => {
    
    let entityTypeDataShift = data.shift();
    let exits = data;
    const entityType = entityTypeDataShift?.length ? entityTypeDataShift : "";
    
    
    let match = entityType.match(EntitySplitRegex);
    let entity: string[] = match !== null ? Array.from<string>(match) : [];
    let [entityDesc, dimension] = entity;
    let [entityCode] = entityDesc;

    return {
        entityCode: entityCode,
        entityDesc: entityDesc,
        dimension: dimension,
        exits: exits
    }
};

const generateStartingArea = (entityModel:EntityModelRequest):DungeonEntity => {
    
    let start: DungeonEntity;

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
    return start;
    
    
}

const buildStartChamber = (entityModel: EntityModelRequest): Chamber => {
    let [_, shape, size] = entityModel.entityDesc;
    let [length, width] = entityModel.dimension.split('x');

    console.log(`entityCode: ${_}, shape:${shape}, size: ${size}, length:${length}, width: ${width}, exits: ${entityModel.exits}`);
    

    const startingAreaChamber: Chamber = {
        shape: genShape(shape),
        isLarge: size === 'l',
        dimension: genDimension(Number(length), Number(width)),
        exits: [],
        description: "",
    }

    // startingAreaChamber.exits = [{exitType: ExitType.Door, to: {dimension: {x:0,y:0,z:0,width:5,length:10,height:10}}}];
    return startingAreaChamber;
    
}

const buildStartPassage = (entityModel: EntityModelRequest): Passage => {
    let [width] = entityModel.dimension.split('w');

    console.log(`width: ${width}, exits: ${entityModel.exits}`);
    

    const startingAreaPassage: Passage = {
        dimension: genDimension(10, Number(width)),
        exits: [],
        description: "",
    }
    return startingAreaPassage;
}

const genShape = (shape: string): RoomShape => {
    switch(shape) {
        case RegexDungeonRules.s_Square:
            return RoomShape.Square;
        case RegexDungeonRules.c_Circle:
            return RoomShape.Circle;
        case RegexDungeonRules.r_Rectangle:
            return RoomShape.Rectangle;
        case RegexDungeonRules.o_Octagon:
            return RoomShape.Octagon;
        case RegexDungeonRules.t_Trapezoid:
            return RoomShape.Trapezoid;
        default:
            return RoomShape.None
    }
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