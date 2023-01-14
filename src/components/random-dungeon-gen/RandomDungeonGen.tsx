import React, {ReactElement} from "react";
import { Chamber, RoomShape } from "./random-dungeon-gen.model";
import { startingAreaRegex, randomChamberOptions, RandomStartingArea, randomStartingAreaOptions, weightedRandom } from "./dungeon-graph.config";
import { dungeonGenerateGraph } from "./dungeon-graph.service";

const RandomDungeonGen = (): ReactElement => {

    const startingAreaCode = weightedRandom(randomStartingAreaOptions);
    // const startingAreaCode = RandomStartingArea.Passage10Wide4Intersection;
    // const startingAreaCode = RandomStartingArea.Square20Door2WallsPassage1WallSecretDoor1Wall;
    let match = startingAreaCode.match(startingAreaRegex);
    let startingAreaData: string[] = match !== null ? Array.from<string>(match) : [];
    console.log(startingAreaCode, startingAreaData);
    dungeonGenerateGraph(startingAreaData);
    //hello
    return (
        <div>
            Dungeon Generator!
        </div>
    )
}

export default RandomDungeonGen;