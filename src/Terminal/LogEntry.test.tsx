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
import { LogEntry, Kind } from "./LogEntry";
import { create } from "react-test-renderer";

test("Renders inputs", () => {
  const c = create(<LogEntry kind={Kind.INPUT} value="hi" />);
  expect(c.toJSON()).toMatchSnapshot();
});

test("Renders small outputs", () => {
  const c = create(<LogEntry kind={Kind.OUTPUT} value="bye" />);
  expect(c.toJSON()).toMatchSnapshot();
});

// There's no dom, so this test can't actually check the div's height.
test("Renders big outputs", () => {
  const c = create(<LogEntry kind={Kind.OUTPUT} value="bye" />);
  c.root.instance!.setState({ expanded: false });
  expect(c.toJSON()).toMatchSnapshot();
});
