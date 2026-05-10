import { createRoot } from "react-dom/client";
import Stats from "./components/dnd-stats/Stats";
import RandomDungeonGen from "./components/random-dungeon-gen/RandomDungeonGen";
import RandomDungeonGenV2 from "./components/random-dungeon-gen-v2/RandomDungeonGenV2";
import PlayerView from "./components/random-dungeon-gen-v2/PlayerView";
import './custom.scss';
const title = "DnD";

const isPlayerView = new URLSearchParams(window.location.search).get('view') === 'player';

const root = createRoot(document.getElementById('root'));
root.render(
  isPlayerView ? (
    <PlayerView />
  ) : (
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
    </div>
  ),
);
