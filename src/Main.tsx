/**
 * @license
 * Copyright 2022 Google LLC
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
import { Editor } from "./editor/Editor";
import { LogKind } from "./LogKind";
import { Terminal } from "./terminal/Terminal";
import { Acl2Response } from "./acl2";
import { Tutorial } from "./tutorial/Tutorial";

export function Main() {
  const [editorValue, setEditorValue] = useState(
    () => localStorage.getItem("autosave") || "",
  );

  const [showTutorial, setShowTutorial] = useState(false);

  const [log, setLog] = useState<
    Array<{
      input?: string;
      output: { kind: LogKind; value?: string };
    }>
  >([{ output: { kind: LogKind.WELCOME } }]);

  const [pendingInput, setPendingInput] = useState<string | undefined>(
    undefined,
  );

  function updateLog(r: Acl2Response) {
    let kind: LogKind;
    switch (r.Kind) {
      case "ERROR":
        kind = LogKind.ERROR;
        break;
      case "SUCCESS":
        kind = LogKind.SUCCESS;
        break;
      default:
        console.error(`Unexpected response kind: ${r.Kind}`);
        kind = LogKind.INFO;
        break;
    }
    setLog((log) =>
      log.concat({
        input: pendingInput,
        output: { kind, value: r.Body },
      }),
    );
    setPendingInput(undefined);
  }

  return (
    <>
      {showTutorial ? (
        <Tutorial
          onEdit={() => {
            setShowTutorial(false);
          }}
        />
      ) : (
        <Editor
          onChange={(v) => {
            setEditorValue(v);
            localStorage.setItem("autosave", v);
          }}
          value={editorValue}
          onOutput={(r) => {
            updateLog(r);
          }}
          onEnterTutorial={() => {
            setShowTutorial(true);
          }}
        />
      )}
      <Terminal
        log={log}
        pendingInput={pendingInput}
        onOutput={(r) => {
          updateLog(r);
        }}
        onInput={(i) => {
          setPendingInput(i);
        }}
      />
    </>
  );
}
