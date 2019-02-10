import React, { useState } from "react";
import { Form } from "./Editor";

interface ProofBarProps {
  forms: Form[];
  onClick: (i: number) => void;
}

export function ProofBar(props: ProofBarProps) {
  const [mouseIndex, setMouseIndex] = useState(-1);
  return (
    <div id="proofbar">
      {props.forms.map((f, i) => (
        <div
          className="form"
          style={{
            height: f.height,
            lineHeight: f.height + "px",
            background:
              i <= mouseIndex || f.verified ? "lightseagreen" : "#eee",
          }}
          onClick={() => props.onClick(i)}
          onMouseEnter={() => {
            setMouseIndex(i);
          }}
          onMouseLeave={() => {
            setMouseIndex(-1);
          }}
        >
          {f.verified ? "✓" : ""}
        </div>
      ))}
    </div>
  );
}
