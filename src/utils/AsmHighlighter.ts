// AsmHighlighter.ts
import { CodeHighlighter, HighlightResult } from "@motion-canvas/2d";

type AsmToken = { offset: number; content: string; color: string };

export type AsmTheme = {
  default: string;   // base text (also spaces/newlines)
  keyword: string;   // LOAD/STORE/ADD/...
  register: string;  // ACC/PC/IR/R0..R15
  hex: string;       // 0x10
  immediate: string; // #5
  number: string;    // 42
  punc: string;      // [ ] , etc
  comment: string;   // ; ...
};

const DEFAULT_THEME: AsmTheme = {
  default:  "#c0caf5",
  keyword:  "#bb9af7",
  register: "#7dcfff",
  hex:      "#e0af68",
  immediate:"#e0af68",
  number:   "#ff9e64",
  punc:     "#89ddff",
  comment:  "#565f89",
};

export class AsmHighlighter implements CodeHighlighter<AsmToken[]> {
  private theme: AsmTheme;
  private map = new Map<number, AsmToken>();
  private cache: AsmToken[] = [];

  constructor(theme?: Partial<AsmTheme>) {
    this.theme = { ...DEFAULT_THEME, ...(theme || {}) };
  }

  initialize(): boolean { return true; }

  tokenize(code: string): string[] {
    return this.lex(code).map(t => t.content);
  }

  prepare(code: string): AsmToken[] {
    this.cache = this.lex(code);
    this.map.clear();
    for (const t of this.cache) this.map.set(t.offset, t);
    return this.cache;
  }

  highlight(index: number, _cache: AsmToken[]): HighlightResult {
    const t = this.map.get(index);
    return t
      ? { color: t.color, skipAhead: t.content.length }
      : { color: this.theme.default, skipAhead: 1 };
  }

  /* ------------ Lexer ------------ */
  private lex(code: string): AsmToken[] {
    const out: AsmToken[] = [];
    let i = 0;
    const push = (s: string, color: string) => {
      out.push({ offset: i, content: s, color });
      i += s.length;
    };

    const W  = /^[ \t\r]+/;
    const NL = /^\n/;

    const COMMENT  = /^;[^\n]*/;
    const KEYWORD  = /^(?:LOAD|STORE|MOV|ADD|SUB|INC|DEC|AND|OR|XOR|NOT|SHL|SHR|CMP|JMP|BRGT|BREQ|BRNEG|NOP|HLT|PUSH|POP|CALL|RET|VADD|VSUB|VMUL|VDIV)\b/;
    const REGISTER = /^(?:ACC|PC|IR|SP|BP|ALU|FPU|VPU|R(?:1[0-5]|[0-9]))\b/;

    const HEX      = /^0x[0-9A-Fa-f]+/;
    const IMM      = /^#\d+/;
    const NUM      = /^\b\d+\b/;

    const BRACKET  = /^[\[\]]/;
    const COMMA    = /^,/;

    while (i < code.length) {
      const s = code.slice(i);

      const mNL = s.match(NL);       if (mNL) { push(mNL[0], this.theme.default); continue; }
      const mW  = s.match(W);        if (mW)  { push(mW[0], this.theme.default); continue; }

      const mC  = s.match(COMMENT);  if (mC)  { push(mC[0], this.theme.comment);  continue; }
      const mK  = s.match(KEYWORD);  if (mK)  { push(mK[0], this.theme.keyword);  continue; }
      const mR  = s.match(REGISTER); if (mR)  { push(mR[0], this.theme.register); continue; }

      const mH  = s.match(HEX);      if (mH)  { push(mH[0], this.theme.hex);      continue; }
      const mI  = s.match(IMM);      if (mI)  { push(mI[0], this.theme.immediate);continue; }
      const mN  = s.match(NUM);      if (mN)  { push(mN[0], this.theme.number);   continue; }

      const mB  = s.match(BRACKET);  if (mB)  { push(mB[0], this.theme.punc);     continue; }
      const mCo = s.match(COMMA);    if (mCo) { push(mCo[0], this.theme.punc);    continue; }

      push(s[0], this.theme.default); // fallback always visible
    }
    return out;
  }
}
