import { DoorType, ExitType, RoomShapeType } from '../model/dungeon-type.model';
import { CardinalDirectionName, RotateDirection, Transform, Vector2, Vector3 } from "../model/Transform";
import { RoomEntityModelRequest } from "../model/dungeon-entity.model";
import { Chamber, Door, ExitDTO, Passage, PassageWay } from "../model/dungeon-entity.model";
import { RegexDungeonRules } from '../dungeon.config';
import { UtilitiesService } from './utilities.service';

export class EntityGeneratorService {

  static genShape = (shape: string): RoomShapeType => {
    switch(shape) {
        case RegexDungeonRules.s_Square:
            return RoomShapeType.Square;
        case RegexDungeonRules.c_Circle:
            return RoomShapeType.Circle;
        case RegexDungeonRules.r_Rectangle:
            return RoomShapeType.Rectangle;
        case RegexDungeonRules.o_Octagon:
            return RoomShapeType.Octagon;
        case RegexDungeonRules.t_Trapezoid:
            return RoomShapeType.Trapezoid;
        default:
            return RoomShapeType.None;
    }
}

  public static genTransform(dimension2D: Vector2 | Vector3, position3D: Vector3, dir?: CardinalDirectionName): Transform;
  public static genTransform(length?:number, width?:number, x?:number, y?:number, z?:number, dir?: CardinalDirectionName):Transform;
  public static genTransform(lengthOrTransform?:any, widthOrPosition?:any, xOrDir?:any, y=0,z=0, dir = CardinalDirectionName.East): Transform {
      let dimension: Vector3 =  typeof lengthOrTransform === 'number' || lengthOrTransform === undefined ?
      {
          x: lengthOrTransform ? lengthOrTransform:0,
          y: widthOrPosition ? widthOrPosition:0,
          z: 0,
      }
      :lengthOrTransform;

      let position: Vector3 = typeof widthOrPosition === 'number' || widthOrPosition === undefined ?
      {
          x:typeof xOrDir === 'number'? xOrDir:0,
          y:y,
          z:z
      }
      : widthOrPosition;

      if(typeof xOrDir === 'string'){
          dir = xOrDir as CardinalDirectionName;
      }

      let isHorizontal = UtilitiesService.isDirectionHorizontal(dir);
      let centerX = isHorizontal ? position.x + dimension.x/2 : position.x + dimension.y/2;
      let centerY = isHorizontal ? position.y + dimension.y/2 : position.y + dimension.x/2;
      const dimY = !dimension.y ? dimension.x : dimension.y;
      const transformDimension = new Vector3(dimension.x, dimY, 10);
      return {
          dimension: transformDimension,
          center: {x: centerX, y: centerY} as Vector2,
          position: position,
          direction: dir,
      }
  }

  static genTransformRotate(transform: Transform, rotateDirection: RotateDirection): Transform {
      let newDirection:CardinalDirectionName  = UtilitiesService.cardinalRotate(transform.direction, rotateDirection);
      let newDirectionTransform = UtilitiesService.getAbsoluteDimensions(newDirection, transform);
      let newX = transform.center.x - newDirectionTransform.x/2;
      let newY = transform.center.y - newDirectionTransform.y/2;
      const position = new Vector3(newX, newY, transform.position.z);
      return this.genTransform(transform.dimension, position, newDirection);
  }

  static genExit(
      exitId: string,
      exitType: ExitType,
      position: Vector2,
      direction = CardinalDirectionName.East,
      isSecret = false,
      isTrap = false,
      isLocked = false
      ): ExitDTO {

      const exit: ExitDTO = {
          exitId: exitId,
          exitType: exitType,
          isSecret: isSecret,
          position: position,
          direction: direction,
          isTrap: isTrap,
          isLocked: isLocked,
      }
      return exit;
  }

  static genPassageWay(newId: string, newRoomIds: string[], exit: ExitDTO): PassageWay{
      const vector2 = new Vector2(0,5);
      const vector3 = new Vector3(exit.position.x, exit.position.y);
      const newTransform = this.genTransform(vector2, vector3, exit.direction);
      return new PassageWay(newId, newTransform, exit.exitType, newRoomIds);
  }

  static genDoor(newId: string, newDoorType: DoorType, newRoomIds: string[], exit: ExitDTO): Door {
      const vector2 = new Vector2(0,5);
      const vector3 = new Vector3(exit.position.x, exit.position.y);
      const newTransform = this.genTransform(vector2, vector3, exit.direction);
      return new Door(newId, newTransform, exit.exitType, newRoomIds, {
          doorType: newDoorType,
          isLocked: exit.isLocked,
          isSecret: exit.isSecret,
          isTrap: exit.isTrap,
      });
  }


  static genChamber(newId: string, newTransform: Transform, newShape: RoomShapeType, isLarge: boolean ,newExitsIds: string[] = []): Chamber {
      return new Chamber(newId, newTransform, newShape, isLarge, newExitsIds);
  }

  static genPassage(newId: string, newTransform: Transform, newExitsIds: string[] = []): Passage{
      return new Passage(newId, newTransform, newExitsIds);
  }

  static genEntityModelReq(entity: string[], exits: string[] = []): RoomEntityModelRequest{
    let [entityDesc, dimension] = entity;
    let [entityCode,shape, size] = entityDesc;
    let [length, width] = [10, 0];
    if(dimension.includes('w')) {
    [width] = dimension.split('w').map(e => Number(e ?? 0));
    } else {
        [length, width] = dimension.split('x').map(e => Number(e ?? 0));
    }
    if (width === undefined || width === 0){
        width = length;
    }
    if(shape === 'c') {
        width *= 2;
        length *= 2;
    }

    return {
        entityCode: entityCode,
        shape: shape,
        size: size,
        dimension: {x: length, y: width} as Vector2,
        exits: exits,
    }
  }

}
