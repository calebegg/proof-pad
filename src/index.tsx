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
import { createStore, Dispatch } from "redux";
import { proofPad, recordOutput, doIt, State, updateEditor } from "./reducer";
import { Tutorial } from "./Tutorial";
import { Toolbar } from "./Toolbar";

let error: string | undefined;

const store = createStore(proofPad);

class MainImpl extends React.Component<
  { dispatch: Dispatch<State>; editorValue: string; tutorialShowing: boolean },
  { editorHidden: boolean }
> {
  state = { editorHidden: false };

  render() {
    return (
      <>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {this.props.tutorialShowing ? (
            <Tutorial
              onReadyForDefs={() => {
                this.setState({ editorHidden: false });
              }}
            />
          ) : (
            <></>
          )}
          {this.state.editorHidden ? (
            ""
          ) : (
            <Editor
              onChange={v => {
                this.props.dispatch(updateEditor(v));
              }}
              value={this.props.editorValue}
              hidden={this.state.editorHidden}
            />
          )}
        </div>
        <Toolbar />
        <Terminal />
      </>
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

const Main = connect((store: State) => ({
  editorValue: store.editorValue,
  tutorialShowing: store.tutorialShowing,
}))(MainImpl);

ReactDOM.render(
  <Provider store={store}>
    <Main />
  </Provider>,
  document.getElementById("container")
);
