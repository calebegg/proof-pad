import React, { useState } from "react";
import { Form } from "./Editor";

interface ProofBarProps {
  forms: Form[];
  verifiedHeight: number;
  advanceTo: (i: number) => void;
  reset: () => void;
}

export function ProofBar(props: ProofBarProps) {
  const [mouseIndex, setMouseIndex] = useState(-1);
  return (
    <div id="proofbar">
      {props.verifiedHeight > 0 ? (
        <div
          className="form"
          style={{
            height: props.verifiedHeight,
            lineHeight: props.verifiedHeight + "px",
            background: "lightseagreen",
          }}
          onClick={() => {
            props.reset();
          }}
        >
          ✓
        </div>
      ) : (
        <></>
      )}
      {props.forms.map((f, i) => (
        <div
          className="form"
          style={{
            height: f.height,
            lineHeight: f.height + "px",
            background: i <= mouseIndex ? "lightseagreen" : "#eee",
          }}
          onClick={() => {
            props.advanceTo(i);
            // Stop highlighting while processing
            setMouseIndex(-1);
          }}
          onMouseEnter={() => {
            setMouseIndex(i);
          }}
          onMouseLeave={() => {
            setMouseIndex(-1);
          }}
        />
      ))}
    </div>
  );
}
