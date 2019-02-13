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
import { connect } from "react-redux";
import { LogKind, showTutorial } from "../reducer";

const KIND_TO_SYMBOL = new Map([[LogKind.ERROR, "×"], [LogKind.INPUT, ">"]]);

class LogEntryImpl extends React.Component<
  { kind: LogKind; value?: string; showTutorial: () => void },
  { expanded: boolean }
> {
  private elem: Element | null = null;
  state = { expanded: true };

  componentDidMount() {
    if (
      this.elem &&
      this.elem.clientHeight > 250 &&
      this.props.kind !== LogKind.INPUT
    ) {
      this.setState({ expanded: false });
    }
  }

  render() {
    if (this.props.kind === LogKind.WELCOME) {
      return (
        <div>
          <h1>Welcome to Proof Pad</h1>
          <p>
            Proof Pad is a web-based IDE for{" "}
            <a href="https://www.cs.utexas.edu/users/moore/acl2/">ACL2</a>.
          </p>
          <p>
            Learn more about the project or file issues{" "}
            <a href="https://github.com/calebegg/proof-pad">on Github</a>.
          </p>
        </div>
      );
    }
    return (
      <pre
        ref={d => {
          this.elem = d;
        }}
        className={this.props.kind == LogKind.ERROR ? "error" : ""}
      >
        <div
          style={{
            overflow: "hidden",
            maxHeight: this.state.expanded ? "" : 75,
          }}
        >
          <code className="display">
            {KIND_TO_SYMBOL.get(this.props.kind) || "<"}&nbsp;&nbsp;
          </code>
          {this.props.kind === LogKind.PENDING ? "..." : this.props.value}
        </div>
        <div>
          {this.state.expanded ? (
            ""
          ) : (
            <button
              className="show-more"
              onClick={() => {
                this.setState({ expanded: true });
              }}
            >
              Show more...
            </button>
          )}
        </div>
      </pre>
    );
  }
}

export const LogEntry = connect(
  null,
  dispatch => ({
    showTutorial: () => {
      dispatch(showTutorial());
    },
  }),
)(LogEntryImpl);
