export interface WeightedOption {
    option: string;
    weight: number;
    
}

//Regex Rules

export const startingAreaRegex = /([CDPS][corst]?[ln]?\d{2}w?(x\d{2})*)|(s?[A-Z]\d{1,}w?)|([A-Z][a-z][A-Z])/g;

export enum RegexDungeonRules {
    //Dungeon Entity
   C_Chamber = "C",
   P_Passage = "P",
   D_Door = "D",
   S_Stairs = "S",
   //Chamber Shapes
   s_Square = "s",
   c_Circle = "c",
   r_Rectangle = "r",
   o_Octagon = "o",
   t_Trapezoid = "t",
   l_LargeChamber = "l",
   n_NormalChamber = "n",
   //other
   sD_SecretDoor = "sD",
   T_Trap = "T",
}

//functions

const createWeightedOptionMap = (obj: Object): WeightedOption[] => {
    return Object.entries(obj)
        .map<WeightedOption>(([k, v]) => {
            return {option: k, weight: v}
        });
}

const createUnweightedOptionMap = (obj: Object): WeightedOption[] => {
    return Object.entries(obj)
    .map<WeightedOption>(([_,v]) => {
        return {option: v, weight: 1}
    });
} 

export const weightedRandom = (options: WeightedOption[]): string => {
    let i;
    let weights:number[] = [];

    for(i = 0; i < options?.length; i++)
        weights[i] = options[i]?.weight + (weights[i - 1] || 0);
    
    let random = Math.random() * weights[weights.length - 1];

    for (i = 0; i < weights?.length; i++)
        if (weights[i] > random)
            break;
    
    return options[i]?.option;
}


//Starting Area Random Table

export enum RandomStartingArea {
    Square20PassageEachWall = "Csn20P4",
    Square20Door2WallsPassage1Wall = "Csn20D2P1",
    Square40Door3Walls = "Csn40D3",
    Square20Door2WallsPassage1WallSecretDoor1Wall = "Csn20D2P1sD1",
    Rect80x20PassageEachLongWallDoorsEachShortWall = "Crl80x20PlWDsW",
    Rect20x40PassageEachWall = "Crn20x40P4",
    Circle40PassageEachCardinal = "Ccn40P4",
    Circle40PassageEachCardinalDoorDown = "Ccn40P4DmW",
    Passage10WideTIntersection = "P10wP2",
    Passage10Wide4Intersection = "P10wP3",
}

export const randomStartingAreaOptions: WeightedOption[] = createUnweightedOptionMap(RandomStartingArea);

//Passage Random Table

export enum RandomPassage {
    Straight30 = "F30",
    Straight30DoorRightStraight10 = "F30DRF10",
    Straight30DoorLeftStraight10 = "F30DLF10",
    Straight20DoorEnd = "F20DF",
    Straight20PassageRightStraight10 = "F20PRF10",
    Straight20PassageLeftStraight10 = "F20PLF10",
    Straight20SecretDoor10percent = "F20sDF10%",
    Straight20PassageLeft10 = "F20PL10",
    Straight20PassageRight10 = "F20PR10",
    Chamber = "C",
    Stair = "S",
}

export const randomPassageWeights = {
    [RandomPassage.Straight30]: 2,
    [RandomPassage.Straight30DoorRightStraight10]: 1,
    [RandomPassage.Straight30DoorLeftStraight10]: 1,
    [RandomPassage.Straight20DoorEnd]: 1,
    [RandomPassage.Straight20PassageRightStraight10]: 2,
    [RandomPassage.Straight20PassageLeftStraight10]: 2,
    [RandomPassage.Straight20SecretDoor10percent]: 1,
    [RandomPassage.Straight20PassageLeft10]: 2,
    [RandomPassage.Straight20PassageRight10]: 2,
    [RandomPassage.Chamber]: 5,
    [RandomPassage.Stair]: 1,
}

export const randomPassageOptions: WeightedOption[] = createWeightedOptionMap(randomPassageWeights);

// Random Door Table

export enum RandomDoorType {
    Wooden = "Wo",
    WoodenLocked = "Wl",
    Stone = "So",
    StoneLocked = "Sl",
    Iron = "Io",
    IronLocked = "Il",
    Portcullis = "Po",
    PortcullisLocked = "Pl",
    Secret = "Xo",
    SecretLocked = "Xl",
}

export const randomDoorTypeWeights = {
    [RandomDoorType.Wooden]: 10,
    [RandomDoorType.WoodenLocked]: 2,
    [RandomDoorType.Stone]: 1,
    [RandomDoorType.StoneLocked]: 1,
    [RandomDoorType.Iron]: 1,
    [RandomDoorType.IronLocked]: 1,
    [RandomDoorType.Portcullis]: 1,
    [RandomDoorType.PortcullisLocked]: 1,
    [RandomDoorType.Secret]: 1,
    [RandomDoorType.SecretLocked]: 1,
}

export const RandomBeyondDoor = {
    Passage: RegexDungeonRules.P_Passage,
    Chamber: RegexDungeonRules.C_Chamber,
    Stairs: RegexDungeonRules.S_Stairs,
    Trap: RegexDungeonRules.T_Trap,
}

export const RandomBeyondDoorWeights = {
    [RandomBeyondDoor.Passage]: 8,
    [RandomBeyondDoor.Chamber]: 10,
    [RandomBeyondDoor.Stairs]: 1,
    [RandomBeyondDoor.Trap]: 1,
}

export const randomDoorTypeOptions: WeightedOption[] = createWeightedOptionMap(randomDoorTypeWeights);
export const RandomBeyondDoorOptions: WeightedOption[] = createWeightedOptionMap(RandomBeyondDoorWeights);

// Random Chamber Table

export enum RandomChamber {
    Square20 = "Csn20", //Normal
    Square30 = "Csn30", //Normal
    Square40 = "Csn40", //Normal
    Rect20x30 = "Crn20x30", //Normal
    Rect30x40 = "Crn30x40", //Normal
    Rect40x50 = "Crl40x50", //Large
    Rect50x80 = "Crl50x80", //Large
    Circle30 = "Ccl30", //Normal
    Circle50 = "Ccl50", //Large
    Octagon40 = "Col40", //Large
    Octagon60 = "Col60", //Large
    Trapezoid40x60 = "Ctl40x60", //Large
}

export const randomChamberWeights = {
    [RandomChamber.Square20]: 2,
    [RandomChamber.Square30]: 2,
    [RandomChamber.Square40]: 2,
    [RandomChamber.Rect20x30]: 2,
    [RandomChamber.Rect30x40]: 2,
    [RandomChamber.Rect40x50]: 2,
    [RandomChamber.Rect50x80]: 1,
    [RandomChamber.Circle30]: 1,
    [RandomChamber.Circle50]: 1,
    [RandomChamber.Octagon40]: 1,
    [RandomChamber.Octagon60]: 1,
    [RandomChamber.Trapezoid40x60]: 1,
}

export enum RandomNormalExit {
    Zero = "0",
    One = "1",
    Two = "2",
    Three = "3",
    Four = "4",
}

export enum RandomLargeExit {
    Five = "5",
    Six = "6",
}

export const randomNormalExitWeights = {
    [RandomNormalExit.Zero]: 5,
    [RandomNormalExit.One]: 6,
    [RandomNormalExit.Two]: 4,
    [RandomNormalExit.Three]: 1,
    [RandomNormalExit.Four]: 1,
}

export const randomLargeExitWeights = {
    [RandomNormalExit.Zero]: 3,
    [RandomNormalExit.One]: 5,
    [RandomNormalExit.Two]: 5,
    [RandomNormalExit.Three]: 4,
    [RandomNormalExit.Four]: 1,
    [RandomLargeExit.Five]: 1,
    [RandomLargeExit.Six]: 1,
}

export enum RandomExitLocation {
    WallOppositeEntrance = "FW",
    WallLeftEntrance = "LW",
    WallRightEntrance = "RW",
    WallSameEntrance = "BW",
}

export const randomExitLocationWeights = {
    [RandomExitLocation.WallOppositeEntrance]: 7,
    [RandomExitLocation.WallLeftEntrance]: 5,
    [RandomExitLocation.WallRightEntrance]: 5,
    [RandomExitLocation.WallSameEntrance]: 3,
}

export const RandomExitType = {
    Door: RegexDungeonRules.D_Door,
    Passage: RegexDungeonRules.P_Passage,
}

export const randomChamberOptions: WeightedOption[] = createWeightedOptionMap(randomChamberWeights);
export const randomNormalExitOptions: WeightedOption[] = createWeightedOptionMap(randomNormalExitWeights);
export const randomLargeExitOptions: WeightedOption[] = createWeightedOptionMap(randomLargeExitWeights);
export const randomExitLocationOptions: WeightedOption[] = createWeightedOptionMap(randomExitLocationWeights);
export const randomExitTypeOptions: WeightedOption[] = createUnweightedOptionMap(RandomExitType);

// Random Stair Table
