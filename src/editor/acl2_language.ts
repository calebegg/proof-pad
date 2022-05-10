// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { parser } from "../../grammar/acl2";
import {
  indentNodeProp,
  LanguageSupport,
  LRLanguage,
} from "@codemirror/language";
import { styleTags, tags as t } from "@lezer/highlight";

const acl2Language = LRLanguage.define({
  parser: parser.configure({
    props: [
      styleTags({
        "( )": t.paren,
        Builtin: t.standard(t.name),
        Identifier: t.variableName,
        LineComment: t.lineComment,
        Literal: t.literal,
        Macro: t.keyword,
        Number: t.literal,
        String: t.string,
        Symbol: t.literal,
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
      closeBrackets: {
        brackets: ["(", '"'],
      },
    }),
  ]);
}
