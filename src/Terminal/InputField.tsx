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

import React, { useState } from "react";

export function InputField(props: {
  onInputRef: (ref: HTMLInputElement) => void;
  onFocusTrapRef: (ref: HTMLDivElement) => void;
  onSubmit: (code: string) => void;
  log: Array<{ input?: string }>;
  running: boolean;
}) {
  const [code, setCode] = useState("");
  const [historyIdx, setHistoryIdx] = useState(0);

  function handleKeyShortcuts(e: React.KeyboardEvent<HTMLInputElement>) {
    let currentIdx = historyIdx;
    switch (e.which) {
      case 38: // up
        if (currentIdx >= props.log.length) return;
        currentIdx++;
        break;
      case 40: // down
        if (currentIdx === 1) return;
        currentIdx--;
        break;
      default:
        return;
    }
    setCode(props.log[props.log.length - currentIdx].input || "");
    setHistoryIdx(currentIdx);
  }

  return (
    <form
      id="input"
      onSubmit={async (e) => {
        e.preventDefault();
        props.onSubmit(code);
        setCode("");
        setHistoryIdx(0);
      }}
    >
      <code className="display">{">"}&nbsp;&nbsp;</code>
      <input
        aria-label="Terminal input"
        spellCheck={false}
        ref={(i) => {
          props.onInputRef(i!);
        }}
        onChange={(e) => {
          setCode(e.target.value);
        }}
        onKeyDown={(e) => handleKeyShortcuts(e)}
        value={code}
        disabled={props.running}
        autoFocus
      />
      <div
        ref={(f) => {
          props.onFocusTrapRef(f!);
        }}
        tabIndex={-1}
      />
    </form>
  );
}
