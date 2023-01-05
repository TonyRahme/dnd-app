import React from "react";
import ReactDOM from "react-dom";
import Stats from "./components/dnd-stats/Stats";
import './custom.scss';
const title = "DnD";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <div className="stats-container">
    <h1 className="heading">{title}</h1>
    <Stats />
  </div>,
);
