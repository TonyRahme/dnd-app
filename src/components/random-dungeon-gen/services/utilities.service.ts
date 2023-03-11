import { CardinalDirectionName, CardinalDirectionVector2, Transform, Vector2, Vector3 } from "../random-dungeon-gen.model";

class Utilities {

    static extractArrayFromRegexMatch = (entityType: string, regex: RegExp): string[] => {
        let match = entityType.match(regex);
        return match !== null ? Array.from<string>(match) : [];
    }

    static shiftAndExtractEntityExitsArray = (data: string[]): any[] => {
        let entityTypeDataShift = data.shift();
        let exits = data ? data : [];
        const entityType = entityTypeDataShift ? entityTypeDataShift : "";
        return [entityType, exits];
    }

    static isHorizontal = (cardinalName: CardinalDirectionName): boolean => {
        return CardinalDirectionVector2[cardinalName].y === 0;
    }

    static getCardinalDirectionNameByVector = (vector2: Vector2): CardinalDirectionName => {
        let result = CardinalDirectionName.East;
        Object.entries(CardinalDirectionVector2).forEach(([cardinalName, cardinalVector]) => {
            if(vector2.x === cardinalVector.x && vector2.y === cardinalVector.y){
                result = cardinalName as CardinalDirectionName;
            }
        });
        //defaults to East;
        return result;
    }

    static getCardinalDirectionVectorByName = (name: CardinalDirectionName): Vector2  => {
        let result = CardinalDirectionVector2[name];
        //defaults to East;
        return result;        
    }

    static getAbsoluteDimensions = (direction: CardinalDirectionName, transform: Transform): Vector2 => {
        let isHorizontal = this.isHorizontal(direction);
        return {
            x: isHorizontal? transform.length : transform.width,
            y: isHorizontal? transform.width : transform.length,
        }
    }

    static cardinalRotate = (cardinalDirection: CardinalDirectionName, clockwise=true): CardinalDirectionName => {
        if(clockwise) {
            switch(cardinalDirection) {
                case CardinalDirectionName.North:
                    return CardinalDirectionName.East;
                case CardinalDirectionName.West:
                    return CardinalDirectionName.North;
                case CardinalDirectionName.South:
                    return CardinalDirectionName.West;
                default:
                    return CardinalDirectionName.South;
            }
        } else {
            switch(cardinalDirection) {
                case CardinalDirectionName.North:
                    return CardinalDirectionName.West;
                case CardinalDirectionName.West:
                    return CardinalDirectionName.South;
                case CardinalDirectionName.South:
                    return CardinalDirectionName.East;
                default:
                    return CardinalDirectionName.North;
                
            }            
        }
    }


    static getExitPointsByRoomId = (roomTransform: Transform, exitCount: number): Vector2[] => {
        let directionVector = CardinalDirectionVector2[roomTransform.direction];
        
        let radianDelta = 2*Math.PI / (exitCount + 1);
        let startRadian = this.isHorizontal(roomTransform.direction) ? Math.acos(-directionVector.x) : -Math.asin(directionVector.y);
        let deltaRadian = startRadian;

        let exitPositions: Vector2[] = [];
        
        for(let i = 0;i<exitCount;i++){
            deltaRadian += radianDelta;
            deltaRadian += Math.random()*Math.PI/4
            exitPositions.push({
                x: Number(Math.cos(deltaRadian).toFixed(2))*(roomTransform.length/2) + roomTransform.center.x,
                y: Number(Math.sin(deltaRadian).toFixed(2))*(roomTransform.width/2) + roomTransform.center.y,
            });
        }
        return exitPositions;
    }

    static fixExitToRoomWall = (exitPosition: Vector2, exitDirection: CardinalDirectionName, newRoomTransform: Transform): Vector2 => {
        const topLeftCorner = newRoomTransform.position;
        const bottomRightCorner = new Vector3(
            newRoomTransform.position.x+newRoomTransform.length,
            newRoomTransform.position.y+newRoomTransform.width,
            newRoomTransform.position.z);
        const cardinalVector = CardinalDirectionVector2[exitDirection];
        let fixedExitPosition = exitPosition;
        if(this.isHorizontal(exitDirection)){
            fixedExitPosition.x = cardinalVector.x === -1 ? topLeftCorner.x : bottomRightCorner.x;
        } else {
            fixedExitPosition.y = cardinalVector.y === -1 ? bottomRightCorner.y : topLeftCorner.y;
        }
        return fixedExitPosition;
    }

    static fixRoomToExitDirection = (roomEntityTransform: Transform, exitEntityTransform: Transform):Vector3 =>{
        let vector3 = new Vector3();
        switch(exitEntityTransform.direction){
            case CardinalDirectionName.North:
                vector3.x = exitEntityTransform.position.x - roomEntityTransform.length/2;
                vector3.y = exitEntityTransform.position.y - roomEntityTransform.width;
                vector3.z = roomEntityTransform.position.z;
                break;
            case CardinalDirectionName.South:
                vector3.x = exitEntityTransform.position.x - roomEntityTransform.length/2;
                vector3.y = exitEntityTransform.position.y;
                vector3.z = roomEntityTransform.position.z;
                break;
            case CardinalDirectionName.West:
                vector3.x = exitEntityTransform.position.x - roomEntityTransform.length;
                vector3.y = exitEntityTransform.position.y - roomEntityTransform.width/2;
                vector3.z = roomEntityTransform.position.z;
                break;
            default: //East
                vector3.x = exitEntityTransform.position.x;
                vector3.y = exitEntityTransform.position.y - roomEntityTransform.width/2;
                vector3.z = roomEntityTransform.position.z;
        }
        return vector3;
    }

    static getRelativeDirection = (doorPosition: Vector2, roomTransform: Transform): CardinalDirectionName => {
        const roomLeftCornerPoint = new Vector2(roomTransform.position.x, roomTransform.position.y);
        const roomRightCornerPoint = new Vector2(roomLeftCornerPoint.x + roomTransform.length, roomLeftCornerPoint.y);
        const roomCenterPoint = roomTransform.center;
        
        const leftRatio = (roomCenterPoint.y - roomLeftCornerPoint.y)/(roomCenterPoint.x - roomLeftCornerPoint.x);
        const leftOffset = (roomCenterPoint.y - leftRatio*roomCenterPoint.x);
        const leftY = Number((leftRatio*doorPosition.x + leftOffset).toFixed(2));
        

        const rightRatio = (roomCenterPoint.y - roomRightCornerPoint.y)/(roomCenterPoint.x - roomRightCornerPoint.x);
        const rightOffset = (roomCenterPoint.y - rightRatio*roomCenterPoint.x);
        const rightY = Number((rightRatio*doorPosition.x + rightOffset).toFixed(2));

        const cardinalX = doorPosition.y - leftY >= 0 && doorPosition.y - rightY <= 0 ? -1 
        : doorPosition.y - leftY <= 0 && doorPosition.y - rightY >= 0 ? 1 : 0;
        const cardinalY = doorPosition.y - leftY < 0 && doorPosition.y - rightY < 0 ? 1 
        : doorPosition.y - leftY > 0 && doorPosition.y - rightY > 0  ? -1 : 0;
        
        const cardinal2D = new Vector2(cardinalX, cardinalY);
        
        const cardinalName = this.getCardinalDirectionNameByVector(cardinal2D);
        
        return cardinalName;
    }

}

export default Utilities;