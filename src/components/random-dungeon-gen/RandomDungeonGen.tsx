import React, {ReactElement} from "react";
import { Chamber, RoomShapeType } from "./random-dungeon-gen.model";
import { startingAreaRegex, randomChamberOptions, RandomStartingArea, randomStartingAreaOptions, weightedRandom } from "./dungeon-graph.config";
import { dungeonGenerateGraph } from "./dungeon-graph.service";

const RandomDungeonGen = (): ReactElement => {

    let startingAreaCode = weightedRandom(randomStartingAreaOptions);
    // const startingAreaCode = RandomStartingArea.Passage10Wide4Intersection;
    // startingAreaCode = RandomStartingArea.Rect80x20PassageEachLongWallDoorsEachShortWall;
    // startingAreaCode = RandomStartingArea.Square20Door2WallsPassage1WallSecretDoor1Wall;
    dungeonGenerateGraph(startingAreaCode);
    //hello
    return (
        <div>
            Dungeon Generator!
        </div>
    )
}

export default RandomDungeonGen;