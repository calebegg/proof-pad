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
import { Acl2Response, evaluate } from "../acl2_driver";
import { syntaxTree } from "@codemirror/language";
import { EditorState, RangeSet } from "@codemirror/state";
import { gutter, GutterMarker, ViewPlugin, ViewUpdate } from "@codemirror/view";

let forms: Array<{
  start: number;
  lines: number;
  source: string;
  from: number;
}> = [];

const domNodes: HTMLDivElement[] = [];

let provedThrough = -1;

let oldDoc = "";

class FormMarker extends GutterMarker {
  constructor(
    private readonly onOutput: (response: Acl2Response) => void,
    private readonly index: number,
  ) {
    super();
  }
  toDOM() {
    const div = document.createElement("div");
    div.classList.add("proof-bar-form");
    if (this.index <= provedThrough) div.classList.add("proof-bar-proved");
    div.style.width = "100%";
    div.style.height =
      this.index === -1 ? "0" : forms[this.index].lines + "00%";
    div.addEventListener("click", async () => {
      for (; provedThrough < this.index; provedThrough++) {
        const response = await evaluate(forms[provedThrough + 1].source);
        this.onOutput(response);
        if (response.Kind === "ERROR") {
          domNodes[provedThrough + 1].classList.add("proof-bar-error");
          break;
        }
        domNodes[provedThrough + 1].classList.add("proof-bar-proved");
      }
    });
    domNodes[this.index] = div;
    return div;
  }
}

export function proofBar(onOutput: (response: Acl2Response) => void) {
  return [
    ViewPlugin.fromClass(
      class {
        update(vu: ViewUpdate) {
          const doc = vu.state.doc.toString();
          // Avoid unnecessary recalculations
          if (doc === oldDoc) return;
          oldDoc = doc;
          forms = [];
          const tree = syntaxTree(vu.state).cursor();
          // Enter 'Program'
          if (!tree.firstChild()) {
            return [0, 0];
          }
          let from = 0;
          let start = 1;
          do {
            if (tree.name !== "Application") continue;
            const source = vu.state.sliceDoc(from, tree.to);
            const lines =
              [...source].filter((c) => c === "\n").length +
              (from === 0 ? 1 : 0);
            forms.push({
              start,
              from: from === 0 ? 0 : from + 1,
              lines,
              source,
            });
            from = tree.to;
            start += lines;
          } while (tree.nextSibling());
        }
      },
    ),
    EditorState.changeFilter.of(() => {
      // TODO(calebegg): Mark parts of the document readonly
      return [0, forms[provedThrough + 1].from];
    }),
    gutter({
      class: "proof-bar",
      initialSpacer: () => new FormMarker(onOutput, -1),
      markers: () => {
        return RangeSet.of(
          forms.map((f, i) => new FormMarker(onOutput, i).range(f.from)),
        );
      },
    }),
  ];
}
