import { CodeHighlighter, HighlightResult } from "@motion-canvas/2d";

type PythonToken = { offset: number; content: string; color: string };

export type PythonTheme = {
  default: string;
  keyword: string;
  builtin: string;
  string: string;
  number: string;
  comment: string;
  decorator: string;
  operator: string;
  punctuation: string;
};

const DEFAULT_THEME: PythonTheme = {
  default: "#c0caf5",
  keyword: "#bb9af7",
  builtin: "#7dcfff",
  string: "#9ece6a",
  number: "#ff9e64",
  comment: "#8b95c0",
  decorator: "#f7768e",
  operator: "#89ddff",
  punctuation: "#89ddff",
};

export class PythonHighlighter implements CodeHighlighter<PythonToken[]> {
  private theme: PythonTheme;
  private map = new Map<number, PythonToken>();
  private cache: PythonToken[] = [];

  constructor(theme?: Partial<PythonTheme>) {
    this.theme = { ...DEFAULT_THEME, ...(theme || {}) };
  }

  initialize(): boolean {
    return true;
  }

  tokenize(code: string): string[] {
    return this.lex(code).map((token) => token.content);
  }

  prepare(code: string): PythonToken[] {
    this.cache = this.lex(code);
    this.map.clear();
    for (const token of this.cache) {
      this.map.set(token.offset, token);
    }
    return this.cache;
  }

  highlight(index: number, _cache: PythonToken[]): HighlightResult {
    const token = this.map.get(index);
    return token
      ? { color: token.color, skipAhead: token.content.length }
      : { color: this.theme.default, skipAhead: 1 };
  }

  private lex(code: string): PythonToken[] {
    const out: PythonToken[] = [];
    let offset = 0;
    const push = (content: string, color: string) => {
      out.push({ offset, content, color });
      offset += content.length;
    };

    const NL = /^\r?\n/;
    const WS = /^[ \t]+/;
    const COMMENT = /^#[^\n]*/;
    const DECORATOR = /^@[_A-Za-z][_A-Za-z0-9.]*/;
    const KEYWORD =
      /^(?:False|await|else|import|pass|None|break|except|in|raise|True|class|finally|is|return|and|continue|for|lambda|try|as|def|from|nonlocal|while|assert|del|global|with|async|elif|if|not|yield|or)\b/;
    const BUILTIN =
      /^(?:abs|all|any|ascii|bin|bool|bytearray|bytes|callable|chr|classmethod|compile|complex|dict|dir|divmod|enumerate|eval|exec|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|isinstance|issubclass|iter|len|list|locals|map|max|min|next|object|oct|open|ord|pow|print|property|range|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|vars|zip)\b/;
    const NUMBER =
      /^(?:0[xX][0-9A-Fa-f_]+|0[bB][01_]+|0[oO][0-7_]+|(?:\d[\d_]*\.\d[\d_]*|\d[\d_]*\.|\.\d[\d_]*)(?:[eE][+-]?\d[\d_]*)?|(?:\d[\d_]*)(?:[eE][+-]?\d[\d_]*)?)/;
    const IDENT = /^[_A-Za-z][_A-Za-z0-9]*/;
    const OPERATOR =
      /^(?:==|!=|<=|>=|->|:=|\+=|-=|\*=|\/=|\/\/=|%=|\*\*=|@=|&=|\|=|\^=|>>=|<<=|\*\*|\/\/|<<|>>|[+\-*/%@&|^~=<>]=?|@)/;
    const PUNCT = /^[()\[\]{}.,;:?]/;

    while (offset < code.length) {
      const slice = code.slice(offset);

      const matchNL = slice.match(NL);
      if (matchNL) {
        push(matchNL[0], this.theme.default);
        continue;
      }

      const matchWS = slice.match(WS);
      if (matchWS) {
        push(matchWS[0], this.theme.default);
        continue;
      }

      const stringLiteral = this.readStringLiteral(slice);
      if (stringLiteral) {
        push(stringLiteral, this.theme.string);
        continue;
      }

      const matchComment = slice.match(COMMENT);
      if (matchComment) {
        push(matchComment[0], this.theme.comment);
        continue;
      }

      const matchDecorator = slice.match(DECORATOR);
      if (matchDecorator) {
        push(matchDecorator[0], this.theme.decorator);
        continue;
      }

      const matchKeyword = slice.match(KEYWORD);
      if (matchKeyword) {
        push(matchKeyword[0], this.theme.keyword);
        continue;
      }

      const matchBuiltin = slice.match(BUILTIN);
      if (matchBuiltin) {
        push(matchBuiltin[0], this.theme.builtin);
        continue;
      }

      const matchNumber = slice.match(NUMBER);
      if (matchNumber) {
        push(matchNumber[0], this.theme.number);
        continue;
      }

      const matchOperator = slice.match(OPERATOR);
      if (matchOperator) {
        push(matchOperator[0], this.theme.operator);
        continue;
      }

      const matchPunct = slice.match(PUNCT);
      if (matchPunct) {
        push(matchPunct[0], this.theme.punctuation);
        continue;
      }

      const matchIdent = slice.match(IDENT);
      if (matchIdent) {
        push(matchIdent[0], this.theme.default);
        continue;
      }

      push(slice[0], this.theme.default);
    }

    return out;
  }

  private readStringLiteral(source: string): string | null {
    const prefixMatch = source.match(/^(?:[rRbBuUfF]{0,2})/);
    const prefix = prefixMatch ? prefixMatch[0] : "";
    const rest = source.slice(prefix.length);

    if (!rest.startsWith("'") && !rest.startsWith("\"")) {
      return null;
    }

    const quoteChar = rest[0];
    const triple = rest.slice(0, 3) === quoteChar.repeat(3);
    const delimiterLength = triple ? 3 : 1;
    const raw = prefix.toLowerCase().includes("r");
    let index = prefix.length + delimiterLength;

    while (index < source.length) {
      const char = source[index];

      if (!raw && char === "\\") {
        index += 2;
        continue;
      }

      if (triple) {
        if (source.startsWith(quoteChar.repeat(3), index)) {
          index += 3;
          return source.slice(0, index);
        }
        index++;
        continue;
      }

      if (char === quoteChar) {
        index++;
        return source.slice(0, index);
      }

      index++;
    }

    return source;
  }
}

