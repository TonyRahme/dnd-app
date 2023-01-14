import React from "react";
import ReactDOM from "react-dom";
import Stats from "./components/dnd-stats/Stats";
import RandomDungeonGen from "./components/random-dungeon-gen/RandomDungeonGen";
import './custom.scss';
const title = "DnD";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <div>
    <h1 className="heading">{title}</h1>
    <div className="tabs">
      <Stats />
      <RandomDungeonGen />
    </div>
  </div>,
);
