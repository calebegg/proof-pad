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

import { redo, undo } from "@codemirror/history";
import { EditorView } from "@codemirror/view";
import {
  faQuestionCircle,
  faRedo,
  faSave,
  faUndo,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useRef } from "react";

export function Toolbar({
  editorView,
  onEnterTutorial,
  onLoad,
  value,
}: {
  editorView: EditorView | null;
  onEnterTutorial: () => void;
  onLoad: (value: string) => void;
  value: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div id="toolbar">
      <button
        aria-label="Save"
        onClick={() => {
          const element = document.createElement("a");
          const file = new Blob([value]);
          element.href = URL.createObjectURL(file);
          element.download = "code.lisp";
          element.click();
        }}
      >
        <FontAwesomeIcon icon={faSave} />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".lisp"
        style={{ display: "none" }}
      />
      <button
        aria-label="Upload"
        onClick={() => {
          inputRef.current!.click(); // Activates the hidden file input.
          const changeHandler = () => {
            const reader = new FileReader();
            reader.readAsText(inputRef.current!.files![0]);
            reader.addEventListener("load", () => {
              onLoad(reader.result as string);
              inputRef.current!.removeEventListener("change", changeHandler);
            });
            // Ensures change event triggered if same file uploaded twice.
            inputRef.current!.value = "";
          };
          inputRef.current!.addEventListener("change", changeHandler);
        }}
      >
        <FontAwesomeIcon icon={faUpload} />
      </button>
      <button
        aria-label="Undo"
        onClick={() => {
          if (editorView) undo(editorView);
        }}
      >
        <FontAwesomeIcon icon={faUndo} />
      </button>
      <button
        aria-label="Redo"
        onClick={() => {
          if (editorView) redo(editorView);
        }}
      >
        <FontAwesomeIcon icon={faRedo} />
      </button>
      <button
        aria-label="ACL2 tutorial"
        onClick={() => {
          onEnterTutorial();
        }}
      >
        <FontAwesomeIcon icon={faQuestionCircle} />
      </button>
    </div>
  );
}
