import React, { useState } from "react";
import Stat from "./Stat";

const stats = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

function Stats() {
  let statPoints = 0;
  let statBlocks = [];
  let statsPointBalance = "";

  function createStat(stat) {
    let multiRoll = [];
    multiRoll = Array.from(
      { length: 4 },
      () => Math.floor(Math.random() * 6) + 1
      );
      const multiRollResult = multiRoll.toLocaleString();
      multiRoll.sort().shift();
      const reducedMultiRoll = multiRoll.reduce((prev, cur) => prev + cur);
      incTotalStatPoints(reducedMultiRoll);
      return (
        <Stat 
        key={stat}
        stat={stat}
        rawScore = {reducedMultiRoll}
        multiRollArray = {multiRollResult}
        />
    );
  }
  
  function incTotalStatPoints(points) {
    statPoints += points;
  }
  
  statBlocks = stats.map((stat) => {
    return createStat(stat);
  })
  
  function refresh() {
    setLoad(!isLoaded);
  }
  
  statsPointBalance =
  statPoints < 65
  ? "Too Low"
  : statPoints > 80
  ? "Too High"
  : "Balanced";

  const [isLoaded, setLoad] = useState(true);
  return (
    <div>
      <ul>{statBlocks}</ul>
      <p>
        Total: {statPoints} <span>{statsPointBalance}</span>
      </p>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}

export default Stats;
