import React, {ReactElement, useEffect, useState} from "react";
import { Chamber, RoomEntity, RoomShapeType } from "./random-dungeon-gen.model";
import { startingAreaRegex, randomChamberOptions, RandomStartingArea, randomStartingAreaOptions, weightedRandom } from "./dungeon-graph.config";
import { dungeonGenerateGraph, dungeonMap, exitMap } from "./services/dungeon-graph.service";
import GraphRenderTest from "../graph-render-test/GraphRenderTest";
import EntityGenerator from "./services/entity-generator.service";

const RandomDungeonGen = (): ReactElement => {

    const INIT_ROOMENTITY: RoomEntity = {
        id:"-",
        dimension: EntityGenerator.genDimension(80, 40, 40, 60),
        exitsIds: []
      }
    let startingAreaCode = weightedRandom(randomStartingAreaOptions);
    // const startingAreaCode = RandomStartingArea.Passage10Wide4Intersection;
    // startingAreaCode = RandomStartingArea.Rect80x20PassageEachLongWallDoorsEachShortWall;
    // startingAreaCode = RandomStartingArea.Square20Door2WallsPassage1WallSecretDoor1Wall;
    const [dungeonArea, setDungeonArea] = useState(INIT_ROOMENTITY);

    useEffect(()=>{
        setDungeonArea(dungeonGenerateGraph(startingAreaCode));
    },[]);
    //hello
    return (
        <div>
            Dungeon Generator!
            <p>
                Dungeons: {dungeonMap.size}<br/>
                Exits: {exitMap.size}
            </p>
            {/* <GraphRenderTest key={dungeonArea.id} room={dungeonArea}/> */}
            <GraphRenderTest key={INIT_ROOMENTITY.id} room={INIT_ROOMENTITY}/>
        </div>
    )
}

export default RandomDungeonGen;