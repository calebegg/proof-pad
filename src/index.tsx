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
import { Editor } from "./Editor";
import { Terminal } from "./Terminal/Terminal";
import { evaluate, evaluateInProgramMode } from "./acl2";
import { Provider, connect } from "react-redux";
import { createStore } from "redux";
import { proofPad, recordOutput, doIt } from "./reducer";

let error: string | undefined;

const store = createStore(proofPad);

class MainImpl extends React.Component {
  state = {
    editorValue: `(defun fac (n)
  (if (zp n)
      1
      (* n (fac (1- n)))))

(defthm fac-pos
  (> (fac n) 0))

(defun range (m)
  (if (zp m)
      nil
      (cons m (range (1- m)))))

(defthm range-len
  (implies (natp x)
          (= (len (range x)) x)))
`,
  };
  render() {
    return (
      <div id="react">
        <Editor
          onChange={v => {
            this.setState({ editorValue: v });
          }}
          value={this.state.editorValue}
        />
        <div className="toolbar" style={{ flex: 0 }}>
          <div className="wrapper">
            <button
              onClick={async () => {
                store.dispatch(
                  recordOutput(
                    await evaluateInProgramMode(this.state.editorValue)
                  )
                );
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
                <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z" />
              </svg>
            </button>
            <div className="shadow" />
          </div>
          <div className="wrapper">
            <button
              onClick={async () => {
                store.dispatch(
                  recordOutput(await evaluate(this.state.editorValue))
                );
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
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            </button>
            <div className="shadow" />
          </div>
        </div>
        <Terminal />
      </div>
    );
  }
}

document.body.addEventListener("keydown", e => {
  switch (e.which) {
    case "L".charCodeAt(0):
      if (e.ctrlKey) {
        store.dispatch(doIt(s => ({ ...s, log: [] })));
      }
  }
});

const Main = connect()(MainImpl);

ReactDOM.render(
  <Provider store={store}>
    <Main />
  </Provider>,
  document.getElementById("container")
);
