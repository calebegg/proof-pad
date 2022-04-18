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

import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/closebrackets";
import { defaultKeymap } from "@codemirror/commands";
import { commentKeymap } from "@codemirror/comment";
import { lineNumbers } from "@codemirror/gutter";
import { defaultHighlightStyle } from "@codemirror/highlight";
import { history, historyKeymap } from "@codemirror/history";
import { commonLisp } from "@codemirror/legacy-modes/mode/commonlisp";
import { bracketMatching } from "@codemirror/matchbrackets";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { EditorState } from "@codemirror/state";
import { StreamLanguage } from "@codemirror/stream-parser";
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  keymap,
} from "@codemirror/view";
import React, { useState } from "react";
import { CodeMirrorLite as CodeMirror } from "react-codemirror6/dist/lite";
import { Acl2Response } from "../acl2";
import { autocompletions } from "./autocompletions";
import { proofBar } from "./proofbar";
import { Toolbar } from "./Toolbar";

export function Editor({
  value,
  onChange,
  onOutput,
  onEnterTutorial,
}: {
  value: string;
  onChange: (value: string) => void;
  onOutput: (response: Acl2Response) => void;
  onEnterTutorial: () => void;
}) {
  const [editorView, setEditorView] = useState<EditorView | null>(null);

  return (
    <div id="editor">
      <Toolbar
        onEnterTutorial={onEnterTutorial}
        onLoad={(value) => {
          onChange(value);
        }}
        value={value}
        editorView={editorView}
      />
      <CodeMirror
        style={{ height: "100%", overflowY: "scroll" }}
        extensions={[
          proofBar(onOutput),
          lineNumbers(),
          history(),
          drawSelection(),
          EditorState.allowMultipleSelections.of(true),
          defaultHighlightStyle.fallback,
          bracketMatching(),
          closeBrackets(),
          autocompletion({ override: [autocompletions] }),
          highlightActiveLine(),
          highlightSelectionMatches(),
          StreamLanguage.define(commonLisp),

          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            ...commentKeymap,
            ...completionKeymap,
          ]),
        ]}
        onChange={(value) => {
          onChange(value);
        }}
        onViewChange={(view) => {
          setEditorView(view);
        }}
        value={value}
      ></CodeMirror>
    </div>
  );
}

// registerAutocomplete();
