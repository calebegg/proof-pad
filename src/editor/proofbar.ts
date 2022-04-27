/**
 * @license
 * Copyright 2022 Google LLC
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

import { syntaxTree } from "@codemirror/language";
import { EditorView, gutter, GutterMarker } from "@codemirror/view";
import { Acl2Response, evaluate } from "../acl2_driver";
import {
  StateField,
  StateEffect,
  RangeSet,
  EditorState,
} from "@codemirror/state";

class FormMarker extends GutterMarker {
  constructor(
    private readonly onOutput: (response: Acl2Response) => void,
    private readonly height: number,
    private readonly source: string,
  ) {
    super();
  }

  toDOM() {
    const div = document.createElement("div");
    div.className = "proof-bar-form";
    div.style.width = "100%";
    div.style.height = this.height + "00%";
    div.addEventListener("click", async () => {
      this.onOutput(await evaluate(this.source));
    });
    return div;
  }
}

export function proofBar(onOutput: (response: Acl2Response) => void) {
  return [
    EditorState.changeFilter.of(() => {
      // TODO(calebegg): Mark parts of the document readonly
      return [0, 0];
    }),
    gutter({
      class: "proof-bar",
      initialSpacer: () => new FormMarker(onOutput, 0, ""),
    }),
  ];
}

const proofBarState = StateField.define<RangeSet<GutterMarker>>({
  create() {
    return RangeSet.empty;
  },
  update(set, transaction) {
    set = set.map(transaction.changes);
    console.log(transaction);
    for (let e of transaction.effects) {
      console.log(e);
    }
    return set;
  },
});
