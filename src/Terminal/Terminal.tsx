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
import { evaluate, listenForUnhandledError } from "../acl2";
import { connect } from "react-redux";
import { State, recordInput, recordOutput } from "../reducer";
import { Dispatch } from "redux";
import { InputField } from "./InputField";
import { LogEntry, Kind } from "./LogEntry";

interface TerminalStore {
  log: State["log"];
  pendingInput: State["pendingInput"];
}

interface TerminalDispatcher {
  dispatch: Dispatch<State>;
}

type TerminalProps = TerminalStore & TerminalDispatcher;

class TerminalImpl extends React.Component<
  TerminalProps,
  {
    running: boolean;
  }
> {
  private input: HTMLInputElement = document.createElement("input");
  private focusTrap: HTMLDivElement = document.createElement("div");

  constructor(props: TerminalProps) {
    super(props);
    this.state = {
      running: false,
    };
    listenForUnhandledError(error => {
      this.props.dispatch(recordOutput(error));
    });
  }

  private async run(code: string) {
    this.focusTrap!.focus();
    this.props.dispatch(recordInput(code));
    this.setState({
      running: true,
    });
    let result: string;
    try {
      this.props.dispatch(recordOutput(await evaluate(code)));
    } catch (e) {
      this.props.dispatch(recordOutput(`Error: ${e}`));
    } finally {
      this.setState({ running: false });
      if (document.activeElement === this.focusTrap) {
        this.input.focus();
      }
    }
  }

  componentDidUpdate() {
    this.input.scrollIntoView();
  }

  render() {
    return (
      <div
        id="terminal"
        onClick={async () => {
          await new Promise(resolve => setTimeout(resolve, 0));
          if (document.getSelection().isCollapsed) {
            if (this.state.running) {
              this.focusTrap.focus();
            } else {
              this.input.focus();
            }
          }
        }}
      >
        <pre id="output">
          {this.props.log.map((entry, i) => (
            <div className="log" key={i}>
              {entry.input ? (
                <LogEntry kind={Kind.INPUT} value={entry.input} />
              ) : (
                ""
              )}
              <LogEntry kind={Kind.OUTPUT} value={entry.output} />
            </div>
          ))}
          {this.props.pendingInput ? (
            <div className="log">
              <LogEntry kind={Kind.INPUT} value={this.props.pendingInput} />
              <LogEntry kind={Kind.OUTPUT} value="..." />
            </div>
          ) : (
            ""
          )}
        </pre>
        <InputField
          onInputRef={i => {
            this.input = i;
          }}
          onFocusTrapRef={f => {
            this.focusTrap = f;
          }}
          onSubmit={c => {
            this.run(c);
          }}
          log={this.props.log}
          running={this.state.running}
        />
      </div>
    );
  }
}

export const Terminal = connect((state: State) => ({
  log: state.log,
  pendingInput: state.pendingInput,
}))(TerminalImpl);
