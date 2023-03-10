import React, {ReactElement, useEffect, useState} from "react";
import { createRoot } from 'react-dom/client';
import { Stage, Layer, Star, Rect, Text, Circle } from 'react-konva';
import { CardinalDirectionName, Transform, RoomEntity } from "../random-dungeon-gen/random-dungeon-gen.model";
import { exitMap } from "../random-dungeon-gen/services/dungeon-graph.service";
import EntityGenerator from "../random-dungeon-gen/services/entity-generator.service";
import { DungeonRenderUI } from "./graph-render.config";


const GraphRenderTest = (props: DungeonRenderUI): ReactElement => {

  let transform = props.startRoom.transform;
  let width = 500;
  let height = 400;
  let offSetX = -(width - transform.width)/2;
  let offSetY = -(height - transform.height)/2;

  const randomColor = () => {
    return '#'+(0x1000000+Math.random()*0xffffff).toString(16).substring(1,7);
  }

  const isFacingHorizontal = (direction: CardinalDirectionName): boolean => {
    switch(direction) {
      case CardinalDirectionName.East:
      case CardinalDirectionName.West:
        return true;
      default:
        return false;
    }
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
  let rotateTransform = EntityGenerator.entityRotate(props.startRoom.transform, false);
  //Debug
  console.log('original:', transform, 'rotated:', rotateTransform);
  /**
   * Konva uses width on x-axis and height on y-axis
   */

  return (
      <div>
        {props.startRoom.description}
        <Stage 
         
        width={width} 
        height={height} 
        className="border"
        draggable={true}>
          <Layer>
            <Rect
            id={props.startRoom.id}
            x={transform.position.x}
            y={transform.position.y}
            width={isFacingHorizontal(transform.direction) ? transform.length : transform.width}
            height={isFacingHorizontal(transform.direction) ? transform.width : transform.length}
            fill={randomColor()}
            draggable={true}
            />
            <Circle
            x={transform.center.x-2}
            y={transform.center.y-2}
            radius={4}
            fill="black"
            />
            {getRoomsAfterStart(props.startRoom.exitsIds).map((room) => 
              (<Rect 
              id={room.id}
              x={room.transform.position.x}
              y={room.transform.position.y}
              width={isFacingHorizontal(room.transform.direction) ? room.transform.length : room.transform.width}
              height={isFacingHorizontal(room.transform.direction) ? room.transform.width : room.transform.length}
              fill={randomColor()}
              />)
            )}
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