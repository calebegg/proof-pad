import React from "react";
import { setInputCode } from "../Terminal/InputField";

export function ClickablePre({ children }: { children: any }) {
  return (
    <pre className="clickable">
      <code
        onClick={() => {
          setInputCode(
            children.props.children
              .replace(/\s*;.*\n/g, "")
              .replace(/\s+/g, " "),
          );
        }}
      >
        {children}
      </code>
    </pre>
  );
}
