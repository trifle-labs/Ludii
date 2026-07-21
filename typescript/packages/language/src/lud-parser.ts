/**
 * Minimal recursive-descent parser for the `.lud` S-expression grammar.
 *
 * Targets the subset used by tic-tac-toe-shaped game definitions in
 * `Common/res/lud/test/Tic-Tac-Toe Renamed.lud`. Anything outside the
 * supported syntax raises a `LudParseError` with the offending token.
 */

import type { LudList, LudNode } from "./lud-ast.js";
import { type LudToken, lexLud } from "./lud-lexer.js";
import { TokenRange } from "./token-range.js";

export class LudParseError extends Error {
  public readonly offset: number;

  public constructor(message: string, offset: number) {
    super(`${message} (at offset ${offset})`);
    this.name = "LudParseError";
    this.offset = offset;
  }
}

class Cursor {
  private index = 0;

  public constructor(private readonly tokens: readonly LudToken[]) {}

  public peek(): LudToken | undefined {
    return this.tokens[this.index];
  }

  public next(): LudToken {
    const tok = this.tokens[this.index];
    if (!tok) {
      throw new LudParseError("Unexpected end of input", this.endOffset());
    }
    this.index += 1;
    return tok;
  }

  public hasMore(): boolean {
    return this.index < this.tokens.length;
  }

  private endOffset(): number {
    const last = this.tokens[this.tokens.length - 1];
    return last ? last.range.to() : 0;
  }
}

function parseNode(cursor: Cursor): LudNode {
  const tok = cursor.next();
  switch (tok.kind) {
    case "lparen":
    case "lcurly":
      return parseListBody(cursor, tok);
    case "rparen":
    case "rcurly":
      throw new LudParseError(`Unexpected "${tok.lexeme}"`, tok.range.from());
    case "string":
      return {
        kind: "string",
        value: tok.text,
        range: tok.range,
      };
    case "number": {
      const value = Number(tok.text);
      if (!Number.isFinite(value)) {
        throw new LudParseError(
          `Invalid numeric literal "${tok.text}"`,
          tok.range.from(),
        );
      }
      return {
        kind: "number",
        value,
        range: tok.range,
      };
    }
    case "ident":
      return {
        kind: "ident",
        name: tok.text,
        range: tok.range,
      };
  }
}

function parseListBody(cursor: Cursor, opener: LudToken): LudList {
  const closer = opener.kind === "lparen" ? "rparen" : "rcurly";
  const delimiter = opener.kind === "lparen" ? "round" : "curly";
  const items: LudNode[] = [];
  while (true) {
    const next = cursor.peek();
    if (!next) {
      throw new LudParseError(
        `Unterminated ${delimiter}-bracket list`,
        opener.range.from(),
      );
    }
    if (next.kind === closer) {
      cursor.next();
      return {
        kind: "list",
        delimiter,
        items,
        range: new TokenRange(opener.range.from(), next.range.to()),
      };
    }
    items.push(parseNode(cursor));
  }
}

/** Parse a single `.lud` source string into a top-level node. */
export function parseLud(source: string): LudNode {
  const tokens = lexLud(source);
  const cursor = new Cursor(tokens);
  if (!cursor.hasMore()) {
    throw new LudParseError("Empty source", 0);
  }
  const node = parseNode(cursor);
  // Some `.lud` files have a trailing `(metadata ...)` form. Allow
  // multiple top-level forms by collecting them into a synthetic list.
  if (!cursor.hasMore()) {
    return node;
  }
  const extras: LudNode[] = [node];
  while (cursor.hasMore()) {
    extras.push(parseNode(cursor));
  }
  return {
    kind: "list",
    delimiter: "round",
    items: extras,
    range: new TokenRange(
      node.range.from(),
      extras[extras.length - 1]?.range.to() ?? node.range.to(),
    ),
  };
}
