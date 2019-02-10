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

import React from "react";
import { State } from "../reducer";

export class InputField extends React.Component<
  {
    onInputRef: (ref: HTMLInputElement) => void;
    onFocusTrapRef: (ref: HTMLDivElement) => void;
    onSubmit: (code: string) => void;
    log: State["log"];
    running: boolean;
  },
  { code: string }
> {
  private historyIdx = 0;
  state = { code: "" };

  private handleKeyShortcuts(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.which) {
      case 38: // up
        if (this.historyIdx >= this.props.log.length) return;
        this.historyIdx++;
        break;
      case 40: // down
        if (this.historyIdx === 1) return;
        this.historyIdx--;
        break;
      default:
        return;
    }
    this.setState({
      code: this.props.log[this.props.log.length - this.historyIdx].input || "",
    });
  }

  render() {
    return (
      <form
        id="input"
        onSubmit={async e => {
          e.preventDefault();
          this.props.onSubmit(this.state.code);
          this.setState({ code: "" });
          this.historyIdx = 0;
        }}
      >
        <span className="display">{">"}&nbsp;&nbsp;</span>
        <input
          spellCheck={false}
          ref={i => {
            this.props.onInputRef(i!);
          }}
          onChange={e => {
            this.setState({
              code: e.target.value,
            });
          }}
          onKeyDown={e => this.handleKeyShortcuts(e)}
          value={this.state.code}
          disabled={this.props.running}
          autoFocus
        />
        <div
          ref={f => {
            this.props.onFocusTrapRef(f!);
          }}
          tabIndex={-1}
        />
      </form>
    );
  }
}
