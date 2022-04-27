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

import { EditorView } from "@codemirror/view";
import React, { useState } from "react";
import { Acl2Response } from "../acl2_driver";
import { CodeMirror } from "./CodeMirror";
import { Toolbar } from "./Toolbar";

export function Editor({
  onOutput,
  onEnterTutorial,
}: {
  onOutput: (response: Acl2Response) => void;
  onEnterTutorial: () => void;
}) {
  const [editorView, setEditorView] = useState<EditorView | null>(null);
  const [resetValue, setResetValue] = useState(
    localStorage.getItem("autosave") ?? "",
  );
  const [doc, setDoc] = useState("");

  return (
    <div id="editor">
      <Toolbar
        onEnterTutorial={onEnterTutorial}
        onLoad={(v) => {
          setResetValue(v);
        }}
        value={doc}
        editorView={editorView}
      />
      <CodeMirror
        initialValue={resetValue}
        onOutput={onOutput}
        onChange={(v) => {
          localStorage.setItem("autosave", v);
          setDoc(v);
        }}
        onEditorViewUpdate={(ev) => {
          setEditorView(ev);
        }}
      ></CodeMirror>
    </div>
  );
}
