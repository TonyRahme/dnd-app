import React, {ReactElement, useEffect, useState} from "react";
import { createRoot } from 'react-dom/client';
import { Stage, Layer, Star, Rect, Text, Circle } from 'react-konva';
import { CardinalDirectionName, Transform, RoomEntity, ExitEntity, RoomShapeType } from "../random-dungeon-gen/random-dungeon-gen.model";
import { dungeonMap, exitMap } from "../random-dungeon-gen/services/dungeon-graph.service";
import EntityGenerator from "../random-dungeon-gen/services/entity-generator.service";
import { DungeonRenderUI } from "./graph-render.config";


const GraphRenderTest = (props: DungeonRenderUI): ReactElement => {
  const [desc, setDesc] = useState(props.startRoom.description);
  const SCALE = 2;
  
  const randomColor = () => {
    return '#'+(0x1000000+Math.random()*0xffffff).toString(16).substring(1,7);
  }

  const colors: string[] = [];
  for(let i = 0; i < dungeonMap.size; i++){
    colors.push(randomColor());
  }
  
  let transform = props.startRoom.transform;
  let width = 500;
  let height = 400;
  let offSetX = -(width - transform.width)/2;
  let offSetY = -(height - transform.height)/2;
  


  const isFacingHorizontal = (direction: CardinalDirectionName): boolean => {
    switch(direction) {
      case CardinalDirectionName.East:
      case CardinalDirectionName.West:
        return true;
      default:
        return false;
    }
  }
  
  const getAllRooms = (): RoomEntity[] => {
    return Array.from(props.dungeonMap.values());
  }

  const getAllExits = (): ExitEntity[] => {
    return Array.from(props.exitMap.values());
  }


  const getRoomsAfterStart = (exitIds: string[]): RoomEntity[] => {
    let roomEntities: RoomEntity[] = [];
    exitIds.forEach(exitId => {
      const roomId  = props.exitMap.get(exitId)?.roomIds[1] || "";
      const roomEntity = props.dungeonMap.get(roomId);
      if(roomEntity) roomEntities.push(roomEntity);
    });
    return roomEntities;
  }

  const handleHoverDescription = (e:any) => {
    const id = e.target.id();
      setDesc(
        dungeonMap.get(id)?.description || ''
        );
  };

  const getExitsAfterStart = (exitIds: string[]):ExitEntity[] => {
    let exitEntities: ExitEntity[] = [];
    exitIds.forEach(exitId => {
      const exit = props.exitMap.get(exitId);
      if(exit) exitEntities.push(exit);
    });
    return exitEntities;
  }


  // let rotateTransform = EntityGenerator.entityRotate(props.startRoom.transform, false);
  //Debug
  // console.log('original:', transform, 'rotated:', rotateTransform);
  /**
   * Konva uses width on x-axis and height on y-axis
   */

  return (
      <div>
        {desc}
        <Stage 
         
        width={width} 
        height={height} 
        className="border"
        draggable={true}>
          <Layer>
            {/* <Rect
            key={props.startRoom.id}
            id={props.startRoom.id}
            x={transform.position.x * SCALE}
            y={transform.position.y * SCALE}
            width={isFacingHorizontal(transform.direction) ? transform.length*SCALE : transform.width*SCALE}
            height={isFacingHorizontal(transform.direction) ? transform.width*SCALE : transform.length*SCALE}
            fill={randomColor()}
            draggable={true}
            />
            <Circle
            x={transform.center.x*SCALE-2}
            y={transform.center.y*SCALE-2}
            radius={4}
            fill="black"
            /> */}
            {getAllRooms().map((room, idx) => 
              room.description.includes(RoomShapeType[RoomShapeType.Circle]) ? 
              (<Circle 
                key={room.id}
                id={room.id}
                x={room.transform.center.x*SCALE}
                y={room.transform.center.y*SCALE}
                radius={room.transform.length*SCALE/2}
                fill={colors[idx]}
                onMouseEnter={handleHoverDescription}
              />)
              :
              (<Rect 
              key={room.id}
              id={room.id}
              x={room.transform.position.x*SCALE}
              y={room.transform.position.y*SCALE}
              width={room.transform.length*SCALE}
              height={room.transform.width*SCALE}
              fill={colors[idx]}
              onMouseEnter={handleHoverDescription}
              />)
            )}
            {getAllExits().map((exit) => 
              (<Circle
              key={exit.id}
              id={exit.id}
              x={exit.transform.center.x*SCALE-2}
              y={exit.transform.center.y*SCALE-2}
              radius={exit.transform.width}
              fill={randomColor()}
              />)
            )}
            {getAllRooms().map((room) =>
            (
              <Circle 
              x={room.transform.center.x*SCALE-2}
              y={room.transform.center.y*SCALE-2}
              radius={4}
              fill="black"
              />
            ))}
          </Layer>
        </Stage>
      </div>
  )
}
export default GraphRenderTest;

/* function generateShapes() {
  return [...Array(10)].map((_, i) => ({
    id: i.toString(),
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    rotation: Math.random() * 180,
    isDragging: false,
  }));
}


const INITIAL_STATE = generateShapes();
 */
/*{stars.map((star) => (
    <Star
    key={star.id}
    id={star.id}
    x={star.x}
    y={star.y}
    numPoints={5}
    innerRadius={20}
    outerRadius={40}
    fill="#89b717"
    opacity={0.8}
    draggable
    rotation={star.rotation}
    shadowColor="black"
    shadowBlur={10}
    shadowOpacity={0.6}
    shadowOffsetX={star.isDragging ? 10 : 5}
    shadowOffsetY={star.isDragging ? 10 : 5}
    scaleX={star.isDragging ? 1.2 : 1}
    scaleY={star.isDragging ? 1.2 : 1}
    onDragStart={handleDragStart}
    onDragEnd={handleDragEnd}
    />
    ))}*/
    /* const handleDragStart = (e:any) => {
      const id = e.target.id();
      setStars(
        stars.map((star) => {
          return {
            ...star,
            isDragging: star.id === id,
          };
        })
      );
    };
    const handleDragEnd = (e:any) => {
      setStars(
        stars.map((star) => {
          return {
            ...star,
            isDragging: false,
          };
        })
      );
    }; */