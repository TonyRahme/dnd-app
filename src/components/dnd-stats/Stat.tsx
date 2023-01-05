import React, {ReactElement} from "react";
import { StatProp } from "./stats.config";
import './stats.scss';

const Stat = (props: StatProp):ReactElement => {
  return(
    <li key={props.stat}>
      {props.stat}: {props.rawScore} =&gt; {props.multiRollArray}
    </li>
  );
}

export default Stat;