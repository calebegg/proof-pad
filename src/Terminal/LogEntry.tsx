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

export enum Kind {
  INPUT,
  OUTPUT,
}

export class LogEntry extends React.Component<
  { kind: Kind; value: string },
  { expanded: boolean }
> {
  private elem: HTMLDivElement | null = null;
  state = { expanded: true };

  componentDidMount() {
    if (
      this.elem &&
      this.elem.clientHeight > 150 &&
      this.props.kind === Kind.OUTPUT
    ) {
      this.setState({ expanded: false });
    }
  }

  render() {
    return (
      <div
        ref={d => {
          this.elem = d;
        }}
      >
        <div
          style={{
            overflow: "hidden",
            maxHeight: this.state.expanded ? "" : 100,
          }}
        >
          <span className="display">
            {this.props.kind === Kind.INPUT ? ">" : "<"}&nbsp;
          </span>
          {this.props.value}
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
      </div>
    );
  }
}
