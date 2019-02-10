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
import { create } from "react-test-renderer";
import { LogKind } from "../reducer";
import { LogEntry } from "./LogEntry";

test("Renders inputs", () => {
  const c = create(<LogEntry kind={LogKind.INPUT} value="hi" />);
  expect(c.toJSON()).toMatchSnapshot();
});

test("Renders welcome", () => {
  const c = create(<LogEntry kind={LogKind.WELCOME} value="hi" />);
  expect(c.toJSON()).toMatchSnapshot();
});

test("Renders small outputs", () => {
  const c = create(<LogEntry kind={LogKind.INFO} value="bye" />);
  expect(c.toJSON()).toMatchSnapshot();
});

// There's no dom, so this test can't actually check the div's height.
test("Renders big outputs", () => {
  const c = create(<LogEntry kind={LogKind.INFO} value="bye" />);
  c.root.instance!.setState({ expanded: false });
  expect(c.toJSON()).toMatchSnapshot();
});
