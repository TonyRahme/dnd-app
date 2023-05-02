import React, {ReactElement, useEffect, useState} from "react";
import { CardinalDirectionName, Chamber, RoomEntity, RoomShapeType, Vector2 } from "./random-dungeon-gen.model";
import { startingAreaRegex, randomChamberOptions, RandomStartingArea, randomStartingAreaOptions, weightedRandom, RegexDungeonRules } from "./dungeon-graph.config";
import { dungeonGenerateGraph, dungeonMap, exitMap } from "./services/dungeon-graph.service";
import GraphRenderTest from "../graph-render-test/GraphRenderTest";
import EntityGenerator from "./services/entity-generator.service";

const RandomDungeonGen = (): ReactElement => {

    const INIT_ROOMENTITY: RoomEntity = {
        id: "-",
        transform: EntityGenerator.genTransform({ x: 80, y: 40 }, { x: 40, y: 60, z: 0 }, CardinalDirectionName.North),
        exitsIds: [],
        description: ``,
        setDescription() {
            return ``;
        },
        setExits: function (exitIds: string[]): void {
            this.exitsIds = exitIds;
        },
        getDescription: function (): string {
            return this.description;
        },
        getDimensionString: function (): string {
            return ``;
        }
    }
    let startingAreaCode = weightedRandom(randomStartingAreaOptions);
    // startingAreaCode = RandomStartingArea.Square20PassageEachWall;
    // startingAreaCode = RandomStartingArea.Rect80x20PassageEachLongWallDoorsEachShortWall;
    // startingAreaCode = RandomStartingArea.Square20Door2WallsPassage1WallSecretDoor1Wall;
    // startingAreaCode = RandomStartingArea.Circle40Door2Test;
    const [dungeonArea, setDungeonArea] = useState(INIT_ROOMENTITY);

    useEffect(()=>{
        setDungeonArea(dungeonGenerateGraph(startingAreaCode, false));
    },[]);
    //hello
    return (
        <div>
            Dungeon Generator!
            <p>
                Dungeons: {dungeonMap.size}<br/>
                Exits: {exitMap.size}
            </p>
            <GraphRenderTest key={dungeonArea.id} startRoom={dungeonArea} dungeonMap={dungeonMap} exitMap={exitMap} />
            {/* <GraphRenderTest key={INIT_ROOMENTITY.id} room={INIT_ROOMENTITY}/> */}
        </div>
    )
}

export default RandomDungeonGen;