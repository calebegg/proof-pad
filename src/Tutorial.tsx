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
import * as ReactDOM from "react-dom";
import { State } from "./reducer";
import { Dispatch, connect } from "react-redux";

const tutorial = require("./tutorial.md");

const sections: HTMLElement[] = [];

let elem = new DOMParser().parseFromString(tutorial, "text/html").body
  .firstChild!;

let heading;
let sectionIdx = -1;
let SHOW_DEFS: number;
while (elem.nextSibling) {
  const section = document.createElement("section");
  sectionIdx++;
  if ((elem.nextSibling as Element).tagName == "H2") {
    heading = elem.nextSibling;
    elem = elem.nextSibling.nextSibling!;
    if (heading.textContent!.includes("Functions")) {
      SHOW_DEFS = sectionIdx;
    }
  }
  if (heading) section.appendChild(heading.cloneNode(true));
  while (elem.nextSibling!) {
    if (elem instanceof HTMLElement && elem.tagName === "PRE") {
      const text = elem.textContent!;
      if (text.split("\n").length == 2) {
        const codeElem = elem.firstChild as HTMLElement;
        codeElem.innerHTML =
          codeElem.innerHTML.replace(/;/g, '<span class="sample-comment">;') +
          "</span>";
      }
      elem.addEventListener("click", () => {
        console.log(text);
      });
    }
    const prev = elem;
    elem = elem.nextSibling!;
    section.appendChild(prev);
    if (elem instanceof Element && elem.tagName === "HR") break;
  }
  if (elem.nextSibling) elem = elem.nextSibling;
  sections.push(section);
}

export class Tutorial extends React.PureComponent<
  { onReadyForDefs: () => void },
  { selectedKey: number }
> {
  state = { selectedKey: 0 };

  render() {
    return (
      <div id="tutorial">
        <button
          disabled={this.state.selectedKey <= 0}
          onClick={() => {
            this.setState({ selectedKey: this.state.selectedKey - 1 });
          }}
        >
          &larr;
        </button>
        <button
          disabled={this.state.selectedKey >= sections.length}
          onClick={() => {
            this.setState({ selectedKey: this.state.selectedKey + 1 });
            if (this.state.selectedKey + 1 >= SHOW_DEFS) {
              this.props.onReadyForDefs();
            }
          }}
        >
          &rarr;
        </button>
        <section
          ref={r => {
            if (!r) return;
            while (r.firstChild) r.removeChild(r.firstChild);
            r.appendChild(sections[this.state.selectedKey]);
          }}
        />
      </div>
    );
  }
}
