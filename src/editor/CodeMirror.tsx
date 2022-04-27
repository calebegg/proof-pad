import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  bracketMatching,
  defaultHighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { EditorState } from "@codemirror/state";
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import React, { useCallback, useEffect, useRef } from "react";
import { Acl2Response } from "../acl2_driver";
import { acl2 } from "./acl2_language";
import { autocompletions } from "./autocompletions";
import { proofBar } from "./proofbar";

export function CodeMirror({
  initialValue,
  onOutput,
  onChange,
  onEditorViewUpdate,
}: {
  initialValue: string;
  onOutput: (r: Acl2Response) => void;
  onChange: (v: string) => void;
  onEditorViewUpdate: (ev: EditorView) => void;
}) {
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.setState(getState());
  }, [initialValue, viewRef.current]);

  function getState() {
    return EditorState.create({
      doc: initialValue,
      extensions: [
        proofBar(onOutput),
        lineNumbers(),
        history(),
        drawSelection(),
        EditorState.allowMultipleSelections.of(true),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        bracketMatching(),
        closeBrackets(),
        autocompletion({ override: [autocompletions] }),
        highlightActiveLine(),
        highlightSelectionMatches(),
        acl2(),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...completionKeymap,
        ]),
      ],
    });
  }

  const refCallback = useCallback((ref: HTMLDivElement | null) => {
    if (!ref) {
      viewRef.current?.destroy();
      return;
    }
    viewRef.current = new EditorView({
      state: getState(),
      parent: ref,
      dispatch: (t) => {
        onChange(t.newDoc.toString());
        viewRef.current!.update([t]);
      },
    });
    onEditorViewUpdate(viewRef.current);
  }, []);

  return (
    <div
      ref={refCallback}
      style={{ height: "100%", overflowY: "scroll" }}
    ></div>
  );
}
