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
import { evaluate, listenForUnhandledError, Acl2Response } from "../acl2";
import { LogKind } from "../LogKind";
import { InputField } from "./InputField";
import { LogEntry } from "./LogEntry";

interface TerminalProps {
  log: Array<{ input?: string; output: { kind: LogKind; value?: string } }>;
  pendingInput: string | undefined;
  onOutput: (v: Acl2Response) => void;
  onInput: (v: string) => void;
}

export class Terminal extends React.Component<
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
    listenForUnhandledError((error) => {
      this.props.onOutput({ Kind: "ERROR", Body: error });
    });
  }

  private async run(code: string) {
    this.focusTrap!.focus();
    this.props.onInput(code);
    this.setState({
      running: true,
    });
    try {
      const output = await evaluate(code);
      this.props.onOutput(output);
    } catch (e) {
      this.props.onOutput({ Kind: "ERROR", Body: `Error: ${e}` });
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
          await new Promise((resolve) => setTimeout(resolve, 0));
          if (document.getSelection()!.isCollapsed) {
            if (this.state.running) {
              this.focusTrap.focus();
            } else {
              this.input.focus();
            }
          }
        }}
      >
        <div id="output">
          {this.props.log.map((entry, i) => (
            <div
              className={[
                "log",
                entry.output.kind == LogKind.ERROR ? "error" : "",
              ].join(" ")}
              key={i}
            >
              {entry.input ? (
                <LogEntry kind={LogKind.INPUT} value={entry.input} />
              ) : (
                ""
              )}
              <LogEntry kind={entry.output.kind} value={entry.output.value} />
            </div>
          ))}
          {this.props.pendingInput ? (
            <div className="log">
              <LogEntry kind={LogKind.INPUT} value={this.props.pendingInput} />
              <LogEntry kind={LogKind.PENDING} />
            </div>
          ) : (
            ""
          )}
        </div>
        <InputField
          onInputRef={(i) => {
            this.input = i;
          }}
          onFocusTrapRef={(f) => {
            this.focusTrap = f;
          }}
          onSubmit={(c) => {
            this.run(c);
          }}
          log={this.props.log}
          running={this.state.running}
        />
      </div>
    );
  }
}
