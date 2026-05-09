import { createRoot } from "react-dom/client";
import Stats from "./components/dnd-stats/Stats";
import RandomDungeonGen from "./components/random-dungeon-gen/RandomDungeonGen";
import RandomDungeonGenV2 from "./components/random-dungeon-gen-v2/RandomDungeonGenV2";
import './custom.scss';
const title = "DnD";

const root = createRoot(document.getElementById('root'));
root.render(
  <div>
    <h1 className="heading">{title}</h1>
    <div className="tabs">
      <Stats />
      <RandomDungeonGenV2 />
      <hr />
      <details>
        <summary>Legacy v1 generator</summary>
        <RandomDungeonGen />
      </details>
    </div>
  </div>,
);
