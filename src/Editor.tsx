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

import * as React from "react";
import * as ReactDOM from "react-dom";
import "codemirror/addon/edit/matchbrackets";
import "codemirror/mode/commonlisp/commonlisp";
import { Controlled } from "react-codemirror2";
import { Dispatch, connect } from "react-redux";
import { evaluate } from "./acl2";
import { reset } from "./acl2";
import { State } from "./reducer";
import {} from "@types/codemirror/codemirror-matchbrackets";

export class Editor extends React.Component<{
  value: string;
  onChange(value: string): void;
  hidden?: boolean;
}> {
  private editor: CodeMirror.Editor | null = null;

  render() {
    return (
      <div id="editor" hidden={this.props.hidden}>
        <div id="editor-toolbar">
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
            <svg
              fill="currentColor"
              viewBox="0 0 24 24"
              height="24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 0h24v24H0z" fill="none" />
              <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" />
            </svg>
          </button>
          <input
            ref={fileInput => (this.fileInput = fileInput)}
            type="file"
            id="fileInput"
            accept=".lisp"
            style={{ display: "none" }}
          />
          <button
            onClick={() => {
              fileInput.click(); // Activates the hidden file input.
              const changeHandler = () => {
                const reader = new FileReader();
                reader.readAsText(fileInput.files[0]);
                reader.addEventListener("load", () => {
                  this.props.onChange(reader.result);
                  fileInput.removeEventListener("change", changeHandler);
                });
                // Ensures change event triggered if same file uploaded twice.
                fileInput.value = null;
              };
              fileInput.addEventListener("change", changeHandler);
            }}
          >
            <svg
              fill="currentColor"
              height="24"
              viewBox="0 0 24 24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 0h24v24H0z" fill="none" />
              <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
            </svg>
          </button>
          <button
            aria-label="Undo"
            onClick={() => {
              if (this.editor) this.editor.execCommand("undo");
            }}
          >
            <svg
              fill="currentColor"
              height="24"
              viewBox="0 0 24 24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 0h24v24H0z" fill="none" />
              <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" />
            </svg>
          </button>
          <button
            aria-label="Redo"
            onClick={() => {
              if (this.editor) this.editor.execCommand("redo");
            }}
          >
            <svg
              fill="currentColor"
              height="24"
              viewBox="0 0 24 24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 0h24v24H0z" fill="none" />
              <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z" />
            </svg>
          </button>
        </div>
        <Controlled
          options={{ mode: "commonlisp", matchBrackets: true }}
          onBeforeChange={(editor, data, value) => {
            this.props.onChange(value);
          }}
          editorDidMount={e => {
            this.editor = e;
          }}
          value={this.props.value}
        />
      </div>
    );
  }
}
