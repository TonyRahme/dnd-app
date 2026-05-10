import { head, tail, get, set } from 'lodash-es';
import { CardinalDirectionName, CardinalDirectionVector2, RotateDirection, Transform, Vector2, Vector3 } from "../model/Transform";
import { RoomShapeType } from "../model/dungeon-type.model";

export class UtilitiesService {

  static shiftAndExtractEntityExitsArray(data: string[]): any[] {
    const entityType  = head(data);
    const exits = tail(data);
    return [entityType? entityType : "", exits? exits : []];
  }

  static extractArrayFromRegexMatch(entityType: string, regex: RegExp): string[] {
    let match = entityType.match(regex);
    return match !== null ? Array.from<string>(match) : [];
  }

  static decodeExitRegex(exitCodes: string[], exitRegex: RegExp): string[] {
    let decodedExits: string[] = [];
    exitCodes.forEach(ec => {
      const [exitCode, amount] = this.extractArrayFromRegexMatch(ec, exitRegex);

      switch(amount) {
          case 'lW':
          case 'sW':
              decodedExits.push(exitCode,exitCode);
              break;
          case 'mW':
              decodedExits.push(exitCode);
              break;
          default:
              for(let i=0;i<Number(amount);i++) {
                  decodedExits.push(exitCode);
              }
      }
    });
    return decodedExits;
  }

  static isDirectionHorizontal(cardinalName: CardinalDirectionName): boolean {
    return CardinalDirectionVector2[cardinalName].y === 0;
  }

  static isDirectionInverse(cardinalName: CardinalDirectionName): boolean {
    const cardinalVector2 = CardinalDirectionVector2[cardinalName];
    return cardinalVector2.x === -1 || cardinalVector2.y === -1;
  }

  static getCardinalDirectionNameByVector(vector2: Vector2): CardinalDirectionName {
      let result = CardinalDirectionName.East;
      Object.entries(CardinalDirectionVector2).forEach(([cardinalName, cardinalVector]) => {
          if(vector2.x === cardinalVector.x && vector2.y === cardinalVector.y){
              result = cardinalName as CardinalDirectionName;
          }
      });
      return result;
  }

  static getCardinalDirectionVectorByName(name: CardinalDirectionName): Vector2 {
      let result = CardinalDirectionVector2[name];
      return result;
  }

  static getAbsoluteDimensions(direction: CardinalDirectionName, transform: Transform): Vector2 {
      let isHorizontal = this.isDirectionHorizontal(direction);
      return {
          x: isHorizontal? transform.dimension.x : transform.dimension.y,
          y: isHorizontal? transform.dimension.y : transform.dimension.x,
      }
  }

  static cardinalRotateRight(cardinalDirection: CardinalDirectionName): CardinalDirectionName {
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
  }

  static cardinalRotateLeft(cardinalDirection: CardinalDirectionName): CardinalDirectionName {
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

  static cardinalRotateFlip(cardinalDirection: CardinalDirectionName): CardinalDirectionName {
      switch(cardinalDirection) {
          case CardinalDirectionName.North:
              return CardinalDirectionName.South;
          case CardinalDirectionName.West:
              return CardinalDirectionName.East;
          case CardinalDirectionName.South:
              return CardinalDirectionName.North;
          default:
              return CardinalDirectionName.West;
      }
  }


  static cardinalRotate(cardinalDirection: CardinalDirectionName, rotateDirection = RotateDirection.Right): CardinalDirectionName {
      switch(rotateDirection){
          case RotateDirection.Flip:
              return this.cardinalRotateFlip(cardinalDirection);
          case RotateDirection.Left:
              return this.cardinalRotateLeft(cardinalDirection);
          default:
              return this.cardinalRotateRight(cardinalDirection);

      }
  }

  static buildExitsInRoom(roomTransform: Transform, exitCount: number, shape?: RoomShapeType): Vector2[] {
    const isCircle = shape === RoomShapeType.Circle;
    const roundToFive = (num: number) => Math.round(num / 5) * 5;
      let directionVector = CardinalDirectionVector2[roomTransform.direction];

      let radianDelta = 2*Math.PI / (exitCount + 1);
      let startRadian = this.isDirectionHorizontal(roomTransform.direction) ? Math.acos(-directionVector.x) : -Math.asin(directionVector.y);
      let deltaRadian =                            startRadian;

      let exitPositions: Vector2[] = [];

      // For circles, use a single radius (dimension.x/2) for both axes so the
      // exit lands on the actual circumference, and skip the 5-unit rounding
      // that would otherwise pull it off-circle.
      const halfX = isCircle ? roomTransform.dimension.x/2 : roomTransform.dimension.x/2;
      const halfY = isCircle ? roomTransform.dimension.x/2 : roomTransform.dimension.y/2;

      for(let i = 0;i<exitCount;i++){
          deltaRadian += radianDelta;
          deltaRadian += Math.random()*Math.PI/4
          const cx = Math.cos(deltaRadian) * halfX + roomTransform.center.x;
          const cy = Math.sin(deltaRadian) * halfY + roomTransform.center.y;
          exitPositions.push({
              x: isCircle ? cx : roundToFive(Number(Math.cos(deltaRadian).toFixed(2))*halfX + roomTransform.center.x),
              y: isCircle ? cy : roundToFive(Number(Math.sin(deltaRadian).toFixed(2))*halfY + roomTransform.center.y),
          });
      }
      return exitPositions;
  }

  static fixExitToRoomWall(exitPosition: Vector2, exitDirection: CardinalDirectionName, newRoomTransform: Transform, shape?: RoomShapeType): Vector2 {
      // Circles already have exits on the circumference from buildExitsInRoom;
      // snapping to the bounding rect's wall would push them off-circle.
      if (shape === RoomShapeType.Circle) return exitPosition;

      const topLeftCorner = newRoomTransform.position;
      const bottomRightCorner = new Vector3(
          newRoomTransform.position.x+newRoomTransform.dimension.x,
          newRoomTransform.position.y+newRoomTransform.dimension.y,
          newRoomTransform.position.z);
      const cardinalVector = CardinalDirectionVector2[exitDirection];
      let fixedExitPosition = exitPosition;
      if(this.isDirectionHorizontal(exitDirection)){
          fixedExitPosition.x = cardinalVector.x === -1 ? topLeftCorner.x : bottomRightCorner.x;
      } else {
          fixedExitPosition.y = cardinalVector.y === 1 ? bottomRightCorner.y : topLeftCorner.y;
      }
      return fixedExitPosition;
  }

  static fixRoomPositionToExitDirection(roomEntityTransform: Transform, exitEntityTransform: Transform):Vector3 {
      let vector3 = new Vector3();
      switch(exitEntityTransform.direction){
          case CardinalDirectionName.North:
              vector3.x = exitEntityTransform.position.x - roomEntityTransform.dimension.x/2;
              vector3.y = exitEntityTransform.position.y - roomEntityTransform.dimension.y;
              vector3.z = roomEntityTransform.position.z;
              break;
          case CardinalDirectionName.South:
              vector3.x = exitEntityTransform.position.x - roomEntityTransform.dimension.x/2;
              vector3.y = exitEntityTransform.position.y;
              vector3.z = roomEntityTransform.position.z;
              break;
          case CardinalDirectionName.West:
              vector3.x = exitEntityTransform.position.x - roomEntityTransform.dimension.x;
              vector3.y = exitEntityTransform.position.y - roomEntityTransform.dimension.y/2;
              vector3.z = roomEntityTransform.position.z;
              break;
          default:
              vector3.x = exitEntityTransform.position.x;
              vector3.y = exitEntityTransform.position.y - roomEntityTransform.dimension.y/2;
              vector3.z = roomEntityTransform.position.z;
      }
      return vector3;
  }

  static getRelativeDirection(doorPosition: Vector2, roomTransform: Transform): CardinalDirectionName {
      const roomLeftCornerPoint = new Vector2(roomTransform.position.x, roomTransform.position.y);
      const roomRightCornerPoint = new Vector2(roomLeftCornerPoint.x + roomTransform.dimension.x, roomLeftCornerPoint.y);
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

  static isValidCollisionPlacement(collisionMap: boolean[][], transform: Transform): boolean {
    const gridX = Math.floor(transform.position.x/5);
    const gridY = Math.floor(transform.position.y/5);

    let colStartX, colEndX, colStartY, colEndY = 0;
    let isValidEmptyPlacement = true;
    colStartX = gridX;
    colEndX = gridX + transform.dimension.x/5;
    colStartY = gridY;
    colEndY = gridY + transform.dimension.y/5;

    isValidEmptyPlacement = this.isCollisionParameterValid(colStartX, colEndX, colStartY, colEndY, collisionMap);

    if(!isValidEmptyPlacement) return false;

    for(let y = colStartY; y<colEndY; y++) {
        const collYList = get(collisionMap, [y], [false]);
        for(let x = colStartX; x<colEndX; x++) {
            const isPositionMarked = get(collYList, [x], false);
            if(!isPositionMarked) set(collYList, [x], true);
            else {
                isValidEmptyPlacement = false;
                for(let failY = colStartY; failY<y; failY++) {
                    const resetXList = get(collisionMap, [failY], [false]);
                    for(let failX = colStartX; failX<colEndX; failX++) {
                        set(resetXList, [failX], false);
                    }
                    set(collisionMap, failY, resetXList);
                }
                const resetXLastList = get(collisionMap, [y], [false]);
                for(let failX = colStartX; failX<x; failX++) {
                    set(resetXLastList, [failX], false);
                }
                set(collisionMap, y, resetXLastList);
                break;
            }
        }
        if(!isValidEmptyPlacement) break;
        else {
            set(collisionMap, y, collYList);
        }
    }

    return isValidEmptyPlacement;
  }

  private static isCollisionParameterValid(colStartX: number, colEndX: number, colStartY: number, colEndY: number, collisionMap: boolean[][]): boolean {
    const arrayNumber = [];
    for(let i  = colStartY; i < colEndY; i++) {
        arrayNumber.push(i);
    }
    const collStartRow = get(collisionMap, [colStartY], [false]).slice(colStartX, colEndX);
    const collEndRow = get(collisionMap, [colEndY-1], [false]).slice(colStartX, colEndX);
    const collStartCol = [collStartRow[0]];
    const collEndCol = [collEndRow[0]];
    arrayNumber.forEach((e) => {
       const row = get(collisionMap, [e], [false]).slice(colStartX, colEndX);
       collStartCol.push(row[colStartX]);
       collEndCol.push(row[colEndX-1]);
    });
    collStartCol.push(collStartRow[colStartY]);
    collEndCol.push(collStartRow[colEndY-1]);
    return ![collStartRow, collStartCol, collEndRow, collEndCol].flat().some(e => e);
  }

}
