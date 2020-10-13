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

import {
  faQuestionCircle,
  faRedo,
  faSave,
  faUndo,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Editor as CodeMirrorEditor, Position, TextMarker } from "codemirror";
import "codemirror/addon/edit/matchbrackets";
import "codemirror/mode/commonlisp/commonlisp";
import React from "react";
import { Controlled as CodeMirrorComponent } from "react-codemirror2";
import { Acl2Response, evaluate, reset } from "../acl2";
import { ProofBar } from "./ProofBar";

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
  private fileInput!: HTMLInputElement;
  private editor: CodeMirrorEditor | null = null;
  state = { forms: [] as Form[], verifiedLines: 0, scrollOffset: 0 };
  readOnlyMarker?: TextMarker;

  render() {
    return (
      <div id="editor">
        <div id="toolbar">
          <button
            aria-label="Save"
            onClick={() => {
              const element = document.createElement("a");
              const file = new Blob([this.props.value]);
              element.href = URL.createObjectURL(file);
              element.download = "code.lisp";
              element.click();
            }}
          >
            <FontAwesomeIcon icon={faSave} />
          </button>
          <input
            ref={(fileInput) => {
              this.fileInput = fileInput!;
            }}
            type="file"
            accept=".lisp"
            style={{ display: "none" }}
          />
          <button
            aria-label="Upload"
            onClick={() => {
              this.fileInput.click(); // Activates the hidden file input.
              const changeHandler = () => {
                const reader = new FileReader();
                reader.readAsText(this.fileInput.files![0]);
                reader.addEventListener("load", () => {
                  this.props.onChange(reader.result as string);
                  this.fileInput.removeEventListener("change", changeHandler);
                });
                // Ensures change event triggered if same file uploaded twice.
                this.fileInput.value = "";
              };
              this.fileInput.addEventListener("change", changeHandler);
            }}
          >
            <FontAwesomeIcon icon={faUpload} />
          </button>
          <button
            aria-label="Undo"
            onClick={() => {
              if (this.editor) this.editor.execCommand("undo");
            }}
          >
            <FontAwesomeIcon icon={faUndo} />
          </button>
          <button
            aria-label="Redo"
            onClick={() => {
              if (this.editor) this.editor.execCommand("redo");
            }}
          >
            <FontAwesomeIcon icon={faRedo} />
          </button>
          <button
            onClick={() => {
              this.props.onEnterTutorial();
            }}
          >
            <FontAwesomeIcon icon={faQuestionCircle} />
          </button>
        </div>
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
            }}
            onBeforeChange={(editor, data, value) => {
              this.props.onChange(value);
            }}
            onChange={(editor, data, value) => {
              this.computeForms();
            }}
            onScroll={(editor, value) => {
              this.setState({ ...this.state, scrollOffset: value.top });
            }}
            editorDidMount={(e) => {
              this.editor = e;
              this.computeForms();
            }}
            value={this.props.value}
          >
            a
          </CodeMirrorComponent>
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
