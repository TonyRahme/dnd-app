import React, { ReactElement, useState, useEffect } from "react";
import Stat from './Stat';
import { StatProp, stats } from "./stats.config";

const Stats = (): ReactElement => {
  
  const createStat = (stat: string): StatProp => {
    let multiRoll:number[] = [];
    multiRoll = Array.from(
      { length: 4 },
      () => Math.floor(Math.random() * 6) + 1
      );
      const multiRollResult = multiRoll.toLocaleString();
      multiRoll.sort().shift();
      const reducedMultiRoll = multiRoll.reduce((prev, cur) => prev + cur);
      return {
        stat: stat,
        rawScore: reducedMultiRoll,
        multiRollArray: multiRollResult,
      }
  }

  const createStatBlocks = ():StatProp[] => {
    return Object.values(stats).map((stat) => {
      return createStat(stat);
    })
  }
  
  const evaluateStatsBalance = (totalVal: number):string => {
    
    return (
    totalVal === 69
    ? "Nice"
    :  totalVal < 70
    ? "Too Low"
    : totalVal > 80
    ? "Too High"
    : "Balanced"
    );
  }
  
  const refresh = () => {
    const statBlocks: StatProp[] = createStatBlocks();
    setStatBlockArray(statBlocks);
  }
  const statBlocks: StatProp[] = [];
  const [statBlockArray, setStatBlockArray] = useState(statBlocks);
  
  useEffect(() => {
    refresh();
  },
  []
  );
  
  const statPoints = statBlockArray.reduce((acc, cur) => acc + cur.rawScore, 0);
  const statsPointBalance = evaluateStatsBalance(statPoints);

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
      <button type="button" className="btn btn-primary" onClick={refresh}>Refresh</button>
    </div>
  );
}

export default Stats;
