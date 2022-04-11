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

import { Editor as CodeMirrorEditor, Position, TextMarker } from "codemirror";
import "codemirror/addon/edit/matchbrackets";
import "codemirror/addon/hint/show-hint";
import "codemirror/mode/commonlisp/commonlisp";
import React, { useEffect, useState } from "react";
import { Controlled as CodeMirrorComponent } from "react-codemirror2";
import { Acl2Response, evaluate, reset } from "../acl2";
import { ProofBar } from "./ProofBar";
import { Toolbar } from "./Toolbar";
import { registerAutocomplete } from "./register_autocomplete";

/** A top-level s-expression from the editor */
export interface Form {
  /** Pixel height of this form as it is in the editor. */
  height: number;
  source: string;
  /** Position of the end character of the form in the editor */
  end: Position;
}

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
  const [editor, setEditor] = useState<CodeMirrorEditor | null>(null);
  const [verifiedLines, setVerifiedLines] = useState(0);
  const [forms, setForms] = useState<Form[]>([]);
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    if (!editor) return;
    let nestLevel = 0;
    let forms: Form[] = [];
    let source = "";
    let startingLine = verifiedLines;
    outer: for (let i = startingLine; i < editor.lastLine() + 1; i++) {
      for (const token of editor.getLineTokens(i)) {
        if (token.type === "comment") continue;
        source += token.string;
        if (!token.type) continue;
        if (token.string === "(") {
          nestLevel++;
        } else if (token.string === ")") {
          nestLevel--;
        }
        if (nestLevel < 0) {
          // Bail out because there are un-balanced parens and the rest of this code is going to go south.
          break outer;
        }
        if (nestLevel == 0) {
          forms.push({
            height: (i - startingLine + 1) * editor.defaultTextHeight(),
            source,
            end: { line: i, ch: token.end },
          });
          startingLine = i + 1;
          source = "";
        }
      }
    }
    setForms(forms);
  }, [editor, verifiedLines, value]);

  return (
    <div id="editor">
      <Toolbar
        editor={editor}
        onEnterTutorial={onEnterTutorial}
        onLoad={(value) => {
          onChange(value);
        }}
        value={value}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flex: 1,
          position: "relative",
          height: "100%",
        }}
      >
        <ProofBar
          forms={forms}
          verifiedHeight={
            editor ? verifiedLines * editor!.defaultTextHeight() : 0
          }
          advanceTo={async (index) => {
            if (!editor) return;
            const f = [...forms];
            let v = verifiedLines;
            for (let i = 0; i <= index; i++) {
              const form = f.shift()!;
              const response = await evaluate(form.source);
              onOutput(response);

              if (response.Kind !== "SUCCESS") {
                f.unshift(form);
                break;
              }

              v = form.end.line + 1;
            }
            setForms(f);
            setVerifiedLines(v);
          }}
          reset={async () => {
            await reset();
            setVerifiedLines(0);
          }}
          offset={scrollOffset}
        />
        <div
          className="read-only-background"
          style={{
            background: "#ddd",
            position: "absolute",
            left: 40,
            right: 0,
            top: -scrollOffset,
            height: verifiedLines * (editor ? editor.defaultTextHeight() : 0),
          }}
        />
        <CodeMirrorComponent
          options={{
            mode: "commonlisp",
            matchBrackets: true,
            lineNumbers: true,
            extraKeys: { "Ctrl-Space": "autocomplete" },
          }}
          onBeforeChange={(_editor, _data, value) => {
            onChange(value);
          }}
          onScroll={(_editor, value) => {
            setScrollOffset(value.top);
          }}
          editorDidMount={(e) => {
            setEditor(e);
            e.on("inputRead", (e, c) => {
              // https://github.com/DefinitelyTyped/DefinitelyTyped/pull/48799
              if (c.text[0] == "(") (e as any).showHint();
            });
          }}
          value={value}
        ></CodeMirrorComponent>
      </div>
    </div>
  );
}

registerAutocomplete();
