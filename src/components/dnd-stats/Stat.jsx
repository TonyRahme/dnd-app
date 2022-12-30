import React from "react";


function Stat(props) {
  return <li key={props.stat}>
      {props.stat}: {props.rawScore} =&gt; {props.multiRollArray}
    </li>;
        
}

export default Stat;