// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { parser } from "../../grammar/acl2";
import { completeFromList } from "@codemirror/autocomplete";
import { indentNodeProp } from "@codemirror/language";
import { LRLanguage } from "@codemirror/language";
import { LanguageSupport } from "@codemirror/language";
import { styleTags, tags } from "@lezer/highlight";

const acl2Language = LRLanguage.define({
  parser: parser.configure({
    props: [
      styleTags({
        Identifier: tags.variableName,
        String: tags.string,
        LineComment: tags.lineComment,
        Symbol: tags.literal,
        Keyword: tags.keyword,
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
      closeBrackets: {
        brackets: ["(", '"'],
      },
    }),
  ]);
}
