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

import { gutter, GutterMarker } from "@codemirror/gutter";
import { syntaxTree } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { Acl2Response, evaluate } from "../acl2_driver";

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
  return gutter({
    class: "proof-bar",
    lineMarker(view, line) {
      let node = syntaxTree(view.state).resolve(line.from, 1);
      let prevNode = node;
      if (node.type.name === "Document") return null;
      let depth = 0;
      const lineStart = getLineNo(view, line.from);
      do {
        const content = view.state.sliceDoc(node.from, node.to);
        if (node.name === "bracket" && content === "(") {
          depth++;
        } else if (node.name === "bracket" && content === ")") {
          depth--;
        }
        prevNode = node;
        node = node.nextSibling!;
      } while (depth > 0 && node);
      let height = view.viewportLineBlocks.length - lineStart;
      if (node) height = getLineNo(view, node.from) - lineStart;
      return new FormMarker(
        onOutput,
        height,
        view.state.sliceDoc(0, prevNode.to),
      );
    },
    initialSpacer: () => new FormMarker(onOutput, 0, ""),
  });
}

function getLineNo(view: EditorView, pos: number) {
  const lineBlock = view.lineBlockAt(pos);
  return lineBlock.top / lineBlock.height;
}
