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

import {Action} from 'redux';

export interface State {
  pendingInput?: string;
  log: Array < {
    input?: string;
    output: string
  }
  > ;
}

const INITIAL_STATE: State = {
  log: [],
};

interface RecordInputAction extends Action {
  type: 'RECORD_INPUT';
  input: string;
}
export function recordInput(input: string): RecordInputAction {
  return {type: 'RECORD_INPUT', input};
}

interface RecordOutputAction {
  type: 'RECORD_OUTPUT';
  output: string;
}
export function recordOutput(output: string): RecordOutputAction {
  return {type: 'RECORD_OUTPUT', output};
}

interface OneOffAction {
  type: 'ONE_OFF';
  act: (state: State) => State;
}
export function doIt(act: (state: State) => State): OneOffAction {
  return {type: 'ONE_OFF', act};
}

type ProofPadAction =
    |RecordInputAction|RecordOutputAction|OneOffAction|{type: ''};

export function proofPad(state = INITIAL_STATE, action: ProofPadAction): State {
  switch (action.type) {
    case 'RECORD_INPUT':
      return {
        ...state,
        pendingInput: action.input,
      };
    case 'RECORD_OUTPUT':
      return {
        ...state,
        log: state.log.concat({
          input: state.pendingInput,
          output: action.output,
        }),
        pendingInput: undefined,
      };
    case 'ONE_OFF':
      return action.act(state);
    default:
      const foo: '' = action.type;
      return state;
  }
}
