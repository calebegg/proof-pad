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

export interface Acl2Response {
  Kind: string;
  Body: string;
}

const ws = new WebSocket(`wss://acl2-jbhe53iwqa-uc.a.run.app/acl2`);

ws.addEventListener("message", onUpdate);
ws.addEventListener("close", onUpdate);

const queue: Array<[(v: Acl2Response) => void, (v: {}) => void]> = [];
let unhandledErrorCallback: (e: unknown) => void = defaultCallback;

export async function reset() {
  try {
    return evaluate(`:ubu "centaur/bridge/top"`);
  } catch (r) {
    unhandledErrorCallback(r);
  }
}

function defaultCallback(e: unknown) {
  console.warn("No handler for", e);
}

function onUpdate(e: Event) {
  let resolver: (v: Acl2Response) => void;
  let rejecter: (e: string) => void;
  if (queue.length === 0) {
    rejecter = unhandledErrorCallback;
    resolver = defaultCallback;
  } else {
    [resolver, rejecter] = queue.shift()!;
  }
  switch (e.type) {
    case "message":
      resolver(JSON.parse((e as MessageEvent).data));
      break;
    case "close": {
      const closeEvent = e as CloseEvent;
      if (!closeEvent.wasClean) {
        rejecter(`Socket closed unexpectedly. Error code ${closeEvent.code}.`);
      } else {
        resolver({ Kind: "ERROR", Body: "Socket closed." });
      }
      break;
    }
    default:
      throw new Error(`Unexpected event type: ${e.type}`);
  }
}

export async function evaluate(code: string): Promise<Acl2Response> {
  if (ws.readyState !== WebSocket.OPEN) {
    throw new Error("Socket is not open");
  }
  ws.send(code);
  return new Promise((resolver, rejecter) => queue.push([resolver, rejecter]));
}

export function listenForUnhandledError(cb: (error: unknown) => void) {
  unhandledErrorCallback = cb;
}
