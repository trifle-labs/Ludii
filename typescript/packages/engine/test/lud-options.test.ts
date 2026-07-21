import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isIdent,
  isList,
  isNumber,
  type LudNode,
  parseLud,
} from "@ludii/typescript-language";

import { applyOptions, collectDefaultOptions } from "../src/lud-options.js";

function findChild(node: LudNode, name: string): LudNode | undefined {
  if (!isList(node)) return undefined;
  for (const item of node.items) {
    if (!isList(item)) continue;
    const head = item.items[0];
    if (head && isIdent(head) && head.name === name) return item;
  }
  return undefined;
}

describe("applyOptions", () => {
  it("substitutes the default item's value at every <Tag> placeholder", () => {
    const ast = parseLud(`
      (game "X" (board (square <Board>)))
      (option "Board Size" <Board> args:{ <size> }
        {
          (item "3" <3>)
          (item "5" <5>)**
          (item "7" <7>)
        })
    `);
    const expanded = applyOptions(ast);
    const game = findChild(expanded, "game");
    const board = findChild(game as LudNode, "board");
    assert.ok(board && isList(board));
    const square = board.items[1];
    assert.ok(square && isList(square));
    const sizeNode = square.items[1];
    assert.ok(sizeNode && isNumber(sizeNode));
    assert.equal(sizeNode.value, 5);
  });

  it("falls back to the first item when no ** marker is present", () => {
    const ast = parseLud(`
      (game "X" (board (square <Board>)))
      (option "Board Size" <Board> args:{ <size> }
        { (item "3" <3>) (item "5" <5>) })
    `);
    const expanded = applyOptions(ast);
    const game = findChild(expanded, "game");
    const board = findChild(game as LudNode, "board");
    const square = (board as LudNode & { items: LudNode[] }).items[1];
    const sizeNode = (square as LudNode & { items: LudNode[] }).items[1];
    assert.ok(sizeNode && isNumber(sizeNode));
    assert.equal(sizeNode.value, 3);
  });

  it("strips (option ...) and ** sibling tokens from the expanded AST", () => {
    const ast = parseLud(`(game "X") (option "Y" <Y> { (item "a" <1>)** })`);
    const expanded = applyOptions(ast);
    assert.ok(isList(expanded));
    for (const item of expanded.items) {
      if (!isList(item)) {
        assert.ok(!isIdent(item) || item.name !== "**");
        continue;
      }
      const head = item.items[0];
      if (head && isIdent(head)) assert.notEqual(head.name, "option");
    }
  });

  it("resolves <Tag:argName> for multi-arg options", () => {
    const ast = parseLud(`
      (game "X" (players <Version:numPlayers>) <Version:playRules>)
      (option "Players" <Version> args:{ <numPlayers> <playRules> }
        {
          (item "2P" <2> <(play (move Add (to (sites Empty))))>)**
          (item "3P" <3> <(play (move Pass))>)
        })
    `);
    const expanded = applyOptions(ast);
    const game = findChild(expanded, "game");
    const players = findChild(game as LudNode, "players");
    assert.ok(players && isList(players));
    const arg = players.items[1];
    assert.ok(arg && isNumber(arg));
    assert.equal(arg.value, 2);
  });

  it("collectDefaultOptions enumerates without expanding", () => {
    const ast = parseLud(`
      (option "A" <A> args:{ <x> } { (item "i1" <1>)** (item "i2" <2>) })
      (option "B" <B> args:{ <y> } { (item "i1" <foo>) })
    `);
    const entries = collectDefaultOptions(ast);
    const tags = entries.map((e) => e.tag).sort();
    assert.deepEqual(tags, ["A", "B"]);
  });
});
