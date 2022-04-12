import React from "react";
import { setInputCode } from "../terminal/InputField";

export function ClickablePre({ children }: { children: React.ReactElement }) {
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
