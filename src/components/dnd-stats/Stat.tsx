import React, {ReactElement} from "react";
import { StatProp } from "./stats.config";
import './stats.scss';

const Stat = (props: StatProp):ReactElement => {
  return(
    <div className="stat-row" key={props.stat}>
      <span className="stat-row-name">{props.stat}</span>
      <span className="stat-row-value">{props.rawScore}</span>
      <span className="stat-row-arrow">=&gt;</span>
      <span className="stat-row-multiroll">{props.multiRollArray}</span>
    </div>
  );
}

export default Stat;