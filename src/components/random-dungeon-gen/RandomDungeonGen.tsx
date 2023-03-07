import React, {ReactElement, useEffect, useState} from "react";
import { Chamber, RoomEntity, RoomShapeType } from "./random-dungeon-gen.model";
import { startingAreaRegex, randomChamberOptions, RandomStartingArea, randomStartingAreaOptions, weightedRandom } from "./dungeon-graph.config";
import { dungeonGenerateGraph, dungeonMap, exitMap } from "./services/dungeon-graph.service";
import GraphRenderTest from "../graph-render-test/GraphRenderTest";

const RandomDungeonGen = (): ReactElement => {

    const INIT_ROOMENTITY: RoomEntity = {
        id:"-",
        dimension: {
          x: 0,
          y: 0,
          z: 0,
          width: 50,
          length: 50,
          height: 0
        },
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
            <GraphRenderTest key={dungeonArea.id} room={dungeonArea}/>
        </div>
    )
}

export default RandomDungeonGen;