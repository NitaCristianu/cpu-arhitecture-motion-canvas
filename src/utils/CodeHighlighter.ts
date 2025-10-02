import { parser } from "@lezer/cpp";
import { LezerHighlighter } from "@motion-canvas/2d";

export const CPP_Highlight = new LezerHighlighter(parser);