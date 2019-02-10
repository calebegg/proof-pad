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

import { Acl2Response } from "./acl2";

export enum LogKind {
  INPUT,
  PENDING,
  INFO,
  ERROR,
  SUCCESS,
  WELCOME,
}

export interface State {
  pendingInput?: string;
  log: Array<{
    input?: string;
    output: { kind: LogKind; value?: string };
  }>;
  editorValue: string;
  tutorialShowing: boolean;
}

const INITIAL_STATE: State = {
  log: [{ output: { kind: LogKind.WELCOME } }],
  editorValue: `(defun fac (n)
  (if (zp n)
      1
      (* n (fac (1- n)))))

(thm (= (fac 3) 6))
`,
  tutorialShowing: false,
};

export function recordInput(input: string) {
  return { type: "RECORD_INPUT" as "RECORD_INPUT", input };
}

export function recordOutput(output: Acl2Response) {
  return { type: "RECORD_OUTPUT" as "RECORD_OUTPUT", output };
}

export function doIt(act: (state: State) => State) {
  return { type: "ONE_OFF" as "ONE_OFF", act };
}

export function updateEditor(value: string) {
  return { type: "UPDATE_EDITOR" as "UPDATE_EDITOR", value };
}

export function showTutorial() {
  return { type: "SHOW_TUTORIAL" as "SHOW_TUTORIAL" };
}

type ProofPadAction =
  | ReturnType<
      | typeof recordInput
      | typeof recordOutput
      | typeof updateEditor
      | typeof doIt
      | typeof showTutorial
    >
  | { type: "" };

export function proofPad(state = INITIAL_STATE, action: ProofPadAction): State {
  switch (action.type) {
    case "RECORD_INPUT":
      return {
        ...state,
        pendingInput: action.input,
      };
    case "RECORD_OUTPUT":
      let kind;
      switch (action.output.Kind) {
        case "ERROR":
          kind = LogKind.ERROR;
          break;
        case "SUCCESS":
          kind = LogKind.SUCCESS;
          break;
        default:
          console.error(`Unexpected response kind: ${action.output.Kind}`);
          kind = LogKind.INFO;
          break;
      }
      return {
        ...state,
        log: state.log.concat({
          input: state.pendingInput,
          output: { kind, value: action.output.Body },
        }),
        pendingInput: undefined,
      };
    case "ONE_OFF":
      return action.act(state);
    case "UPDATE_EDITOR":
      return {
        ...state,
        editorValue: action.value,
      };
    case "SHOW_TUTORIAL":
      return {
        ...state,
        tutorialShowing: true,
      };
    default:
      const foo: "" = action.type;
      return state;
  }
}
