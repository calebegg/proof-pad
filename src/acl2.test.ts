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

import 'jest';

class MockWebSocket implements Partial<WebSocket> {
  static OPEN = 1;
  static callbacks: {[type: string]: (...args: any[]) => void} = {};
  static lastInstance: any;

  constructor() {
    MockWebSocket.lastInstance = this;
  }

  send = jest.fn();
  addEventListener = jest.fn().mockImplementation((type, cb) => {
    MockWebSocket.callbacks[type] = cb;
  });
  readyState = MockWebSocket.OPEN;
}

jest.mock('./websocket', () => ({WebSocket: MockWebSocket}));

import {evaluate, listenForUnhandledError} from './acl2';

let mockSocket: jest.Mocked<WebSocket>;

beforeEach(() => {
  jest.resetAllMocks();
  mockSocket = MockWebSocket.lastInstance;
});

describe('evaluate', () => {
  test('runs normally', async() => {
    mockSocket.send.mockImplementation(async message => {
      await new Promise(r => r());
      MockWebSocket.callbacks['message']({
        type: 'message',
        data: 'test data',
      });
    });
    expect(await evaluate('hi')).toBe('test data');
  });

  test('rejects when socket closes', async() => {
    mockSocket.send.mockImplementation(async message => {
      await new Promise(r => r());
      MockWebSocket.callbacks['close']({type: 'close', code: 12345});
    });
    await expect(evaluate('hi')).rejects.toContain('12345');
  });
});

test('manages unexpected errors', () => {
  const cb = jest.fn();
  listenForUnhandledError(cb);
  expect(cb).not.toHaveBeenCalled();
  MockWebSocket.callbacks['close']({type: 'close'});
  expect(cb).toHaveBeenCalled();
});
