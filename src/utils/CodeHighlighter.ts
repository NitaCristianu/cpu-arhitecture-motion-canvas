import { HighlightStyle } from "@codemirror/language";
import { parser } from "@lezer/cpp";
import { tags as t } from "@lezer/highlight";
import { DefaultHighlightStyle, LezerHighlighter } from "@motion-canvas/2d";

const cppHighlightSpecs = DefaultHighlightStyle.specs.map((spec) => {
  const updated = { ...spec };
  const tags = Array.isArray(spec.tag) ? spec.tag : [spec.tag];

  if (tags.includes(t.comment)) {
    updated.color = "#8b95c0";
  }

  return updated;
});

// Align comment styling with the ASM highlighter palette.
const CPP_HIGHLIGHT_STYLE = HighlightStyle.define(cppHighlightSpecs);

export const CPP_Highlight = new LezerHighlighter(parser, CPP_HIGHLIGHT_STYLE);
