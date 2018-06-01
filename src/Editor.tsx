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
import { evaluate } from "./acl2";
import { State } from "./reducer";
import { Dispatch, connect } from "react-redux";
import { Controlled as CodeMirror } from "react-codemirror2";
import "codemirror/mode/commonlisp/commonlisp";
import "codemirror/addon/edit/matchbrackets";
import {} from "@types/codemirror/codemirror-matchbrackets";

export function Editor(props: {
  value: string;
  onChange(value: string): void;
}) {
  return (
    <div id="editor">
      <CodeMirror
        options={{ mode: "commonlisp", matchBrackets: true }}
        onBeforeChange={(editor, data, value) => {
          props.onChange(value);
        }}
        value={props.value}
      />
    </div>
  );
}
