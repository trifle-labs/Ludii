/**
 * Minimal `.lud` lexer. Produces a token stream suitable for an
 * S-expression-style parser.
 *
 * Java reference:
 * - The full Java tokenizer lives across the `Language/` module. This
 *   TS lexer targets the subset of `.lud` syntax needed by the
 *   browser-player MVE (game definitions like tic-tac-toe).
 *
 * Supported tokens:
 * - `(` / `)` — round-paren grouping
 * - `{` / `}` — curly-brace grouping (Ludii uses `{}` for ordered lists
 *   of equipment / metadata entries)
 * - strings — double-quoted, no escape sequences in the MVE subset
 * - numbers — integer or decimal, optional leading `-`
 * - identifiers — anything else not whitespace / paren / quote
 * - comments — `//` to end of line; ignored
 */

import { TokenRange } from "./token-range.js";

export type LudTokenKind =
  | "lparen"
  | "rparen"
  | "lcurly"
  | "rcurly"
  | "string"
  | "number"
  | "ident";

export interface LudToken {
  readonly kind: LudTokenKind;
  readonly text: string;
  /** Original lexeme exactly as found (strings include quotes). */
  readonly lexeme: string;
  readonly range: TokenRange;
}

export class LudLexError extends Error {
  public readonly offset: number;

  public constructor(message: string, offset: number) {
    super(`${message} (at offset ${offset})`);
    this.name = "LudLexError";
    this.offset = offset;
  }
}

function isDigit(ch: string): boolean {
  return ch >= "0" && ch <= "9";
}

function isIdentChar(ch: string): boolean {
  if (ch === "" || ch === "(" || ch === ")" || ch === "{" || ch === "}") {
    return false;
  }
  if (ch === '"') {
    return false;
  }
  // Treat any non-whitespace character as identifier content.
  return !/\s/.test(ch);
}

export function lexLud(source: string): LudToken[] {
  const tokens: LudToken[] = [];
  let i = 0;
  const length = source.length;

  while (i < length) {
    const ch = source[i] ?? "";

    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }

    // Line comment: `//` ... newline
    if (ch === "/" && source[i + 1] === "/") {
      while (i < length && source[i] !== "\n") {
        i += 1;
      }
      continue;
    }

    if (ch === "(") {
      tokens.push({
        kind: "lparen",
        text: "(",
        lexeme: "(",
        range: new TokenRange(i, i + 1),
      });
      i += 1;
      continue;
    }
    if (ch === ")") {
      tokens.push({
        kind: "rparen",
        text: ")",
        lexeme: ")",
        range: new TokenRange(i, i + 1),
      });
      i += 1;
      continue;
    }
    if (ch === "{") {
      tokens.push({
        kind: "lcurly",
        text: "{",
        lexeme: "{",
        range: new TokenRange(i, i + 1),
      });
      i += 1;
      continue;
    }
    if (ch === "}") {
      tokens.push({
        kind: "rcurly",
        text: "}",
        lexeme: "}",
        range: new TokenRange(i, i + 1),
      });
      i += 1;
      continue;
    }

    if (ch === '"') {
      const start = i;
      i += 1;
      let body = "";
      while (i < length && source[i] !== '"') {
        body += source[i];
        i += 1;
      }
      if (i >= length) {
        throw new LudLexError("Unterminated string literal", start);
      }
      i += 1; // consume closing quote
      tokens.push({
        kind: "string",
        text: body,
        lexeme: source.slice(start, i),
        range: new TokenRange(start, i),
      });
      continue;
    }

    if (isDigit(ch) || (ch === "-" && isDigit(source[i + 1] ?? ""))) {
      const start = i;
      if (ch === "-") {
        i += 1;
      }
      while (i < length && isDigit(source[i] ?? "")) {
        i += 1;
      }
      if (source[i] === ".") {
        i += 1;
        while (i < length && isDigit(source[i] ?? "")) {
          i += 1;
        }
      }
      const lexeme = source.slice(start, i);
      tokens.push({
        kind: "number",
        text: lexeme,
        lexeme,
        range: new TokenRange(start, i),
      });
      continue;
    }

    if (isIdentChar(ch)) {
      const start = i;
      while (i < length && isIdentChar(source[i] ?? "")) {
        i += 1;
      }
      const lexeme = source.slice(start, i);
      tokens.push({
        kind: "ident",
        text: lexeme,
        lexeme,
        range: new TokenRange(start, i),
      });
      continue;
    }

    throw new LudLexError(`Unexpected character "${ch}"`, i);
  }

  return tokens;
}
