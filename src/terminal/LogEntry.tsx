/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useCallback, useState } from "react";
import { LogKind } from "../LogKind";

const KIND_TO_SYMBOL = new Map([
  [LogKind.ERROR, "×"],
  [LogKind.INPUT, ">"],
]);

export function LogEntry({ kind, value }: { kind: LogKind; value?: string }) {
  const [expanded, setExpanded] = useState(true);

  const measure = useCallback(
    (pre: HTMLPreElement | null) => {
      if (pre && pre.clientHeight > 150 && kind !== LogKind.INPUT) {
        setExpanded(false);
      }
    },
    [kind],
  );

  if (kind === LogKind.WELCOME) {
    return (
      <div>
        <h1>Welcome to Proof Pad</h1>
        <p>
          Proof Pad is a web-based IDE for{" "}
          <a href="https://www.cs.utexas.edu/users/moore/acl2/">ACL2</a>.
        </p>
        <p>
          Learn more about the project or file issues{" "}
          <a href="https://github.com/calebegg/proof-pad">on Github</a>.
        </p>
      </div>
    );
  }
  return (
    <pre ref={measure} className={kind === LogKind.ERROR ? "error" : ""}>
      <div
        style={{
          overflow: "hidden",
          maxHeight: expanded ? "" : 75,
        }}
      >
        <code className="display">
          {KIND_TO_SYMBOL.get(kind) || "<"}&nbsp;&nbsp;
        </code>
        {kind === LogKind.PENDING ? "..." : value}
      </div>
      <div>
        {expanded ? (
          ""
        ) : (
          <button
            className="show-more"
            onClick={() => {
              setExpanded(true);
            }}
          >
            Show more...
          </button>
        )}
      </div>
    </pre>
  );
}
