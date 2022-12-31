import React, { useState } from "react";
import Stat from "./Stat";

const stats = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

function Stats() {
  let statPoints = 0;
  let statBlocks = [];
  let multiRollArray = [];
  let statsPointBalance = "";
  
  function createStat(stat) {
    let multiRoll = [];
    multiRoll = Array.from(
      { length: 4 },
      () => Math.floor(Math.random() * 6) + 1
      );
      const multiRollResult = multiRoll.toLocaleString();
      multiRollArray += multiRollResult;
      multiRoll.sort().shift();
      const reducedMultiRoll = multiRoll.reduce((prev, cur) => prev + cur);
      incTotalStatPoints(reducedMultiRoll);
      return {
        stat: stat,
        rawScore: reducedMultiRoll,
        multiRollArray: multiRollResult,
      }
  }
  
  function incTotalStatPoints(points) {
    statPoints += points;
  }

  function createStatBlocks() {
    statBlocks = stats.map((stat) => {
      return createStat(stat);
    })
  }
  
  function evaluateStatsBalance() {
    statsPointBalance =
    statPoints < 65
    ? "Too Low"
    : statPoints > 80
    ? "Too High"
    : "Balanced";
  }
  
  function refresh() {
    init();
    setStatBlockArray(statBlocks);
    
  }
  
  function init() {
    createStatBlocks();
    evaluateStatsBalance();
  }
  
  init();
  const [statBlockArray, setStatBlockArray] = useState(statBlocks);
  
  return (
    <div>
      <ul>
        {statBlockArray.map(statBlock => {
          const {stat, rawScore, multiRollArray} = statBlock;
          return (
            <Stat 
            key={stat}
            stat={stat}
            rawScore = {rawScore}
            multiRollArray = {multiRollArray}
            />
          );
        })}
      </ul>
      <p>
        Total: {statPoints} <span>{statsPointBalance}</span>
      </p>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}

export default Stats;
