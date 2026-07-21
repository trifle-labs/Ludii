import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isIdent,
  isList,
  type LudNode,
  parseLud,
} from "@ludii/typescript-language";

import { collectTopLevelDefines, expandDefines } from "../src/index.js";

function findChild(node: LudNode, name: string): LudNode | undefined {
  if (!isList(node)) return undefined;
  for (const item of node.items) {
    if (!isList(item)) continue;
    const head = item.items[0];
    if (head && isIdent(head) && head.name === name) return item;
  }
  return undefined;
}

function expectList(
  node: LudNode | undefined,
): LudNode & { items: readonly LudNode[] } {
  assert.ok(node && isList(node));
  return node;
}

function expectIdent(node: LudNode | undefined): string {
  assert.ok(node && isIdent(node));
  return node.name;
}

describe("expandDefines", () => {
  it("substitutes a parameter-less define at every call site", () => {
    const ast = parseLud(`
      (define "Hello" (greet world))
      (root ("Hello") ("Hello"))
    `);
    const expanded = expandDefines(ast);
    const root = expectList(findChild(expanded, "root"));
    assert.equal(root.items.length, 3); // "root" head + 2 expansions
    for (let i = 1; i < 3; i += 1) {
      const child = expectList(root.items[i]);
      assert.equal(expectIdent(child.items[0]), "greet");
    }
  });

  it("substitutes #1 / #2 with positional call arguments", () => {
    const ast = parseLud(`
      (define "Pair" (cons #1 #2))
      (root ("Pair" alpha beta))
    `);
    const expanded = expandDefines(ast);
    const root = expectList(findChild(expanded, "root"));
    const call = expectList(root.items[1]);
    // (cons alpha beta)
    assert.equal(call.items.length, 3);
    assert.equal(expectIdent(call.items[1]), "alpha");
    assert.equal(expectIdent(call.items[2]), "beta");
  });

  it("strips the (define ...) form from the expanded AST", () => {
    const ast = parseLud(`(define "X" foo) (game "X")`);
    const expanded = expandDefines(ast);
    assert.ok(isList(expanded));
    for (const item of expanded.items) {
      if (!isList(item)) continue;
      const head = item.items[0];
      if (head && isIdent(head)) assert.notEqual(head.name, "define");
    }
  });

  it("expands nested defines (one define calling another)", () => {
    const ast = parseLud(`
      (define "Outer" (wrap ("Inner" #1)))
      (define "Inner" (mark #1))
      (root ("Outer" hello))
    `);
    const expanded = expandDefines(ast);
    const root = expectList(findChild(expanded, "root"));
    const wrap = expectList(root.items[1]);
    // (wrap (mark hello))
    const inner = expectList(wrap.items[1]);
    assert.equal(expectIdent(inner.items[0]), "mark");
    assert.equal(expectIdent(inner.items[1]), "hello");
  });

  it("collectTopLevelDefines enumerates without expanding", () => {
    const ast = parseLud(`
      (define "A" foo)
      (define "B" (bar baz))
    `);
    const entries = collectTopLevelDefines(ast);
    const names = entries.map((e) => e.name).sort();
    assert.deepEqual(names, ["A", "B"]);
  });
});
