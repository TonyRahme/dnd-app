import React, {ReactElement, useEffect, useState} from "react";
import { createRoot } from 'react-dom/client';
import { Stage, Layer, Star, Rect, Text } from 'react-konva';
import { RoomEntity } from "../random-dungeon-gen/random-dungeon-gen.model";
import { DungeonRenderUI } from "./graph-render.config";


const GraphRenderTest = (props: DungeonRenderUI): ReactElement => {

    
    return (
        <div>
            Graph Render Here!
            <Stage width={200} height={200}>
      <Layer>
        <Rect
        id={props.room.id}
        x={10}
        y={10}
        width={props.room.dimension.width}
        height={props.room.dimension.length}
        fill="red"
        />
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