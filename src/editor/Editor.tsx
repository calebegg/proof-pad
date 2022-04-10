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
import React from "react";
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

export class Editor extends React.Component<
  {
    value: string;
    onChange(value: string): void;
    onOutput: (response: Acl2Response) => void;
    onEnterTutorial: () => void;
  },
  { forms: Form[]; verifiedLines: number; scrollOffset: number }
> {
  private editor: CodeMirrorEditor | null = null;
  state = { forms: [] as Form[], verifiedLines: 0, scrollOffset: 0 };
  readOnlyMarker?: TextMarker;

  render() {
    return (
      <div id="editor">
        <Toolbar
          editor={this.editor}
          onEnterTutorial={this.props.onEnterTutorial}
          onLoad={(value) => {
            this.props.onChange(value);
          }}
          value={this.props.value}
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
            forms={this.state.forms}
            verifiedHeight={
              this.editor
                ? this.state.verifiedLines * this.editor!.defaultTextHeight()
                : 0
            }
            advanceTo={async (index) => {
              if (!this.editor) return;
              const forms = [...this.state.forms];
              let verifiedLines = this.state.verifiedLines;
              for (let i = 0; i <= index; i++) {
                const form = forms.shift()!;
                const response = await evaluate(form.source);
                this.props.onOutput(response);

                if (response.Kind !== "SUCCESS") {
                  forms.unshift(form);
                  break;
                }

                verifiedLines = form.end.line + 1;
                if (this.readOnlyMarker) this.readOnlyMarker.clear();
                this.readOnlyMarker = this.editor.markText(
                  this.editor.posFromIndex(0),
                  form.end,
                  {
                    readOnly: true,
                  },
                );
              }
              this.setState({ ...this.state, forms, verifiedLines });
            }}
            reset={async () => {
              await reset();
              if (this.readOnlyMarker) this.readOnlyMarker.clear();
              this.setState({
                ...this.state,
                verifiedLines: 0,
              });
              this.computeForms();
            }}
            offset={this.state.scrollOffset}
          />
          <div
            className="read-only-background"
            style={{
              background: "#ddd",
              position: "absolute",
              left: 40,
              right: 0,
              top: -this.state.scrollOffset,
              height:
                this.state.verifiedLines *
                (this.editor ? this.editor.defaultTextHeight() : 0),
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
              this.props.onChange(value);
            }}
            onChange={() => {
              this.computeForms();
            }}
            onScroll={(_editor, value) => {
              this.setState({ ...this.state, scrollOffset: value.top });
            }}
            editorDidMount={(e) => {
              this.editor = e;
              this.computeForms();
              e.on("inputRead", (e, c) => {
                // https://github.com/DefinitelyTyped/DefinitelyTyped/pull/48799
                if (c.text[0] == "(") (e as any).showHint();
              });
            }}
            value={this.props.value}
          ></CodeMirrorComponent>
        </div>
      </div>
    );
  }

  computeForms() {
    if (!this.editor) return;
    let nestLevel = 0;
    let forms: Form[] = [];
    let source = "";
    let startingLine = this.state.verifiedLines;
    outer: for (let i = startingLine; i < this.editor.lastLine() + 1; i++) {
      for (const token of this.editor.getLineTokens(i)) {
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
            height: (i - startingLine + 1) * this.editor.defaultTextHeight(),
            source,
            end: { line: i, ch: token.end },
          });
          startingLine = i + 1;
          source = "";
        }
      }
    }
    this.setState({ ...this.state, forms });
  }
}

registerAutocomplete();
