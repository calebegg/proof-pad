import { styleTags, tags } from "@codemirror/highlight";
import { indentNodeProp } from "@codemirror/language";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { parser } from "../../grammar/acl2";
import { LRLanguage } from "@codemirror/language";
import { completeFromList } from "@codemirror/autocomplete";
import { LanguageSupport } from "@codemirror/language";

const acl2Language = LRLanguage.define({
  parser: parser.configure({
    props: [
      styleTags({
        Identifier: tags.variableName,
        String: tags.string,
        LineComment: tags.lineComment,
        Symbol: tags.literal,
        "( )": tags.paren,
      }),
      indentNodeProp.add({
        Application: (context) =>
          context.column(context.node.from) + context.unit,
      }),
    ],
  }),
  languageData: {
    commentTokens: { line: ";" },
  },
});

export function acl2() {
  return new LanguageSupport(acl2Language, [
    acl2Language.data.of({
      autocomplete: completeFromList([
        { label: "defun", type: "keyword" },
        { label: "defvar", type: "keyword" },
        { label: "let", type: "keyword" },
        { label: "cons", type: "function" },
        { label: "car", type: "function" },
        { label: "cdr", type: "function" },
      ]),
      closeBrackets: {
        brackets: ["(", '"'],
      },
    }),
  ]);
}
