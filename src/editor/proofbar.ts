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
import { Acl2Response, evaluate, reset } from "../acl2_driver";
import { syntaxTree } from "@codemirror/language";
import {
  EditorState,
  RangeSet,
  StateEffect,
  StateField,
  TransactionSpec,
} from "@codemirror/state";
import {
  gutter,
  GutterMarker,
  ViewPlugin,
  ViewUpdate,
  Decoration,
  EditorView,
} from "@codemirror/view";

/** Data about top level admitable form in the document */
interface Form {
  /** Starting line of this form */
  start: number;
  /** Lines in this form */
  lines: number;
  /** Indices of line breaks in the document related to this Form */
  lineBreaks: number[];
  /** Source code of this form */
  source: string;
  /** Starting index for this form in the document */
  from: number;
  /** Ending index for this form in the document */
  to: number;
}

let forms: Form[] = [];

const PROVED_THROUGH = StateField.define<number>({
  create() {
    return -1;
  },
  update(v, t) {
    if (t.effects.some((e) => e.is(RESET))) return -1;
    return v + t.effects.filter((e) => e.is(NEW_FORM_PROVEN)).length;
  },
});

let oldDoc = "";

const REQUEST_TO_PROVE = StateEffect.define<Form[]>();
const NEW_FORM_PROVEN = StateEffect.define<Acl2Response>();
const PROOF_ERROR = StateEffect.define<Acl2Response>();
const RESET = StateEffect.define();

class FormMarker extends GutterMarker {
  constructor(private readonly index: number) {
    super();
  }
  toDOM(view: EditorView) {
    const div = document.createElement("div");
    const provedThrough = view.state.field(PROVED_THROUGH);
    div.classList.add("proof-bar-form");
    if (this.index <= provedThrough) {
      div.classList.add("proof-bar-proved");
    }
    div.style.width = "100%";
    div.style.height =
      this.index === -1 ? "0" : forms[this.index].lines + "00%";
    const handler = async () => {
      if (provedThrough < this.index) {
        view.dispatch({
          effects: REQUEST_TO_PROVE.of(
            forms.slice(provedThrough + 1, this.index + 1),
          ),
        });
      } else {
        view.dispatch({ effects: RESET.of(null) });
      }
    };
    // Can't use 'click' because it gets eaten by codemirror
    div.addEventListener("mouseup", handler);
    return div;
  }
}

const stripe = Decoration.line({
  attributes: { class: "read-only" },
});

async function evaluateAll(
  forms: Form[],
  dispatch: (...specs: TransactionSpec[]) => void,
) {
  for (const f of forms) {
    const r = await evaluate(f.source);
    if (r.Kind === "ERROR") {
      dispatch({ effects: PROOF_ERROR.of(r) });
      return;
    } else {
      dispatch({ effects: NEW_FORM_PROVEN.of(r) });
    }
  }
}

export function proofBar(onOutput: (response: Acl2Response) => void) {
  return [
    PROVED_THROUGH,
    ViewPlugin.fromClass(
      class {
        provedThrough = -1;
        update(vu: ViewUpdate) {
          this.provedThrough = vu.view.state.field(PROVED_THROUGH);
          for (const e of vu.transactions.flatMap((t) => t.effects)) {
            if (e.is(REQUEST_TO_PROVE)) {
              evaluateAll(e.value, vu.view.dispatch);
            } else if (e.is(RESET)) {
              reset();
            } else if (e.is(NEW_FORM_PROVEN) || e.is(PROOF_ERROR)) {
              onOutput(e.value);
            }
          }
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
            let lines = from === 0 ? 1 : 0;
            let lineBreaks = from === 0 ? [0] : [];
            for (const [i, c] of [...source].entries()) {
              if (c === "\n") {
                lines++;
                lineBreaks.push(from + i + 1);
              }
            }
            forms.push({
              start,
              from: from === 0 ? 0 : from + 1,
              to: tree.to,
              lines,
              lineBreaks,
              source,
            });
            from = tree.to;
            start += lines;
          } while (tree.nextSibling());
        }
      },
      {
        decorations(v) {
          return RangeSet.of(
            forms
              .slice(0, v.provedThrough + 1)
              .flatMap((f) => f.lineBreaks)
              .map((l) => stripe.range(l)),
          );
        },
      },
    ),
    EditorState.changeFilter.from(PROVED_THROUGH, (value) => {
      return () => [0, forms[value + 1]?.from ?? forms[value].to];
    }),
    gutter({
      class: "proof-bar",
      markers: () => {
        return RangeSet.of(
          forms.map((f, i) => new FormMarker(i).range(f.from)),
        );
      },
    }),
  ];
}
