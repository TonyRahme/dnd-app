import { RegexDungeonRules } from "./dungeon-graph.config";
import { Chamber, RoomShape, Dimension, DungeonEntity, ExitType, StairType, Passage } from "./random-dungeon-gen.model";


const chamberRegex = /C[corst]?[nl]?\d{2}(x\d{2})*/g;
const EntitySplitRegex = /[CDPS][corst]?[ln]?|\d{2}w?(x\d{2})*/g

export const dungeonGenerateGraph = (data: string[]) => {


    const startingArea = generateStartingArea(data);
    console.log(startingArea);
    
}

const generateStartingArea = (data:string[]):DungeonEntity => {
    let entityTypeDataShift = data.shift();
    let exits = data;
    const entityType = entityTypeDataShift?.length ? entityTypeDataShift : "";
    

    let match = entityType.match(EntitySplitRegex);
    let entity: string[] = match !== null ? Array.from<string>(match) : [];
    let [entityDesc, dimension] = entity;
    let [entityCode] = entityDesc;
    
    let start: DungeonEntity;

    switch(entityCode) {
        case 'C':
            start = buildStartChamber(entityDesc, dimension, exits);
            break;
        case 'P':
            start = buildStartPassage(dimension, exits);
            break;
        default:
            start = {description: "error"};
        
    }
    return start;
    
    
}

const buildStartChamber = (entityDesc: string, dimension: string, exits?: string[]): Chamber => {
    let [_, shape, size] = entityDesc;
    let [length, width] = dimension.split('x');

    console.log(`entityCode: ${_}, shape:${shape}, size: ${size}, length:${length}, width: ${width}, exits: ${exits}`);
    

    const startingAreaChamber: Chamber = {
        shape: genShape(shape),
        isLarge: size === 'l',
        dimension: genDimension(Number(length), Number(width)),
        exits: [],
        description: "",
    }

    startingAreaChamber.exits = [{exitType: ExitType.Door, to: {dimension: {x:0,y:0,z:0,width:5,length:10,height:10}}}];
    return startingAreaChamber;
    
}

const buildStartPassage = (dimension: string, exits?: string[]): Passage => {
    let [width] = dimension.split('w');

    console.log(`width: ${width}, exits: ${exits}`);
    

    const startingAreaPassage: Passage = {
        dimension: genDimension(10, Number(width)),
        exits: [],
        description: "",
    }
    return startingAreaPassage;
}

const genShape = (shape: string): RoomShape => {
    switch(shape) {
        case 's':
            return RoomShape.Square;
        case 'c':
            return RoomShape.Circle;
        case 'r':
            return RoomShape.Rectangle;
        case 'o':
            return RoomShape.Octagon;
        case 't':
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