import React, {ReactElement, useEffect, useState} from "react";
import { createRoot } from 'react-dom/client';
import { Stage, Layer, Star, Rect, Text, Circle } from 'react-konva';
import { CardinalDirectionName, Dimension, RoomEntity } from "../random-dungeon-gen/random-dungeon-gen.model";
import { exitMap } from "../random-dungeon-gen/services/dungeon-graph.service";
import EntityGenerator from "../random-dungeon-gen/services/entity-generator.service";
import { DungeonRenderUI } from "./graph-render.config";


const GraphRenderTest = (props: DungeonRenderUI): ReactElement => {

  let roomDim = props.startRoom.dimension;
  let width = 500;
  let height = 400;
  let offSetX = -(width - roomDim.width)/2;
  let offSetY = -(height - roomDim.height)/2;

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
  let rotateRoomDim = EntityGenerator.entityRotate(props.startRoom.dimension, false);
  //Debug
  console.log('original:', roomDim, 'rotated:', rotateRoomDim);
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
            x={roomDim.x}
            y={roomDim.y}
            width={isFacingHorizontal(roomDim.direction) ? roomDim.length : roomDim.width}
            height={isFacingHorizontal(roomDim.direction) ? roomDim.width : roomDim.length}
            fill={randomColor()}
            draggable={true}
            />
            <Circle
            x={roomDim.center.x-2}
            y={roomDim.center.y-2}
            radius={4}
            fill="black"
            />
            {getRoomsAfterStart(props.startRoom.exitsIds).map((room) => 
              (<Rect 
              id={room.id}
              x={room.dimension.x}
              y={room.dimension.y}
              width={isFacingHorizontal(room.dimension.direction) ? room.dimension.length : room.dimension.width}
              height={isFacingHorizontal(room.dimension.direction) ? room.dimension.width : room.dimension.length}
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