import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  isIdent,
  isList,
  isNumber,
  isString,
  type LudList,
  type LudNode,
  lexLud,
  listHead,
  parseLud,
} from "../src/index.js";

function asList(node: LudNode): LudList {
  if (!isList(node)) {
    throw new Error(`Expected list, got ${node.kind}`);
  }
  return node;
}

describe("lexLud", () => {
  it("tokenizes parens, idents, strings, and numbers", () => {
    const tokens = lexLud('(game "T" 3)');
    assert.deepEqual(
      tokens.map((t) => t.kind),
      ["lparen", "ident", "string", "number", "rparen"],
    );
    assert.equal(tokens[1]?.text, "game");
    assert.equal(tokens[2]?.text, "T");
    assert.equal(tokens[3]?.text, "3");
  });

  it("skips // line comments", () => {
    const tokens = lexLud("(a) // trailing comment\n(b)");
    assert.deepEqual(
      tokens.map((t) => t.text),
      ["(", "a", ")", "(", "b", ")"],
    );
  });

  it("handles curly delimiters", () => {
    const tokens = lexLud("{ a b }");
    assert.deepEqual(
      tokens.map((t) => t.kind),
      ["lcurly", "ident", "ident", "rcurly"],
    );
  });

  it("supports negative numbers and decimals", () => {
    const tokens = lexLud("(x -3.5 7)");
    assert.equal(tokens[2]?.text, "-3.5");
    assert.equal(tokens[3]?.text, "7");
  });

  it("throws on unterminated strings", () => {
    assert.throws(() => lexLud('(x "unterminated'));
  });
});

describe("parseLud", () => {
  it("parses a simple atom into an ident node", () => {
    const node = parseLud("hello");
    assert.ok(isIdent(node));
    if (isIdent(node)) {
      assert.equal(node.name, "hello");
    }
  });

  it("parses a list with a head identifier", () => {
    const node = parseLud("(game 1)");
    const list = asList(node);
    assert.equal(listHead(list), "game");
    assert.equal(list.items.length, 2);
    const second = list.items[1];
    assert.ok(second && isNumber(second));
    if (second && isNumber(second)) {
      assert.equal(second.value, 1);
    }
  });

  it("distinguishes round and curly lists", () => {
    const node = parseLud("(a { b c })");
    const outer = asList(node);
    assert.equal(outer.delimiter, "round");
    const inner = outer.items[1];
    assert.ok(inner && isList(inner));
    if (inner && isList(inner)) {
      assert.equal(inner.delimiter, "curly");
      assert.equal(inner.items.length, 2);
    }
  });

  it("preserves string values", () => {
    const node = parseLud('(piece "Cross" P2)');
    const list = asList(node);
    const piece = list.items[1];
    assert.ok(piece && isString(piece));
    if (piece && isString(piece)) {
      assert.equal(piece.value, "Cross");
    }
  });

  it("throws on stray closing brackets", () => {
    assert.throws(() => parseLud("(a) )"));
  });

  it("parses the full tic-tac-toe corpus file", () => {
    const path = "Common/res/lud/test/Tic-Tac-Toe Renamed.lud";
    const absolute = new URL(`../../../../../${path}`, import.meta.url);
    const source = readFileSync(absolute, "utf8");
    const node = parseLud(source);
    // The file contains (game ...) followed by (metadata ...).
    const top = asList(node);
    // After parseLud wraps multiple top-level forms in a synthetic
    // round list, top.items should hold both.
    assert.ok(top.items.length >= 2);
    const game = top.items[0];
    assert.ok(game && isList(game));
    if (game && isList(game)) {
      assert.equal(listHead(game), "game");
    }
  });
});
