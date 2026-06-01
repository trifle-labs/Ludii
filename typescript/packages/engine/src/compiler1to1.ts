/**
 * compiler1to1.ts
 *
 * Recursive AST walker for the 1:1 Java→TS port.
 *
 * Takes a define-expanded, option-applied (game ...) LudList and constructs
 * a tree of faithful ludeme class instances — one class per Java ludeme.
 *
 * This file does NOT touch compile.ts or lud-compiler.ts (the interpreter path).
 *
 * Coverage: the ~15 ludeme heads needed for Tic-Tac-Toe.
 *
 * @see play1to1.ts — entry point
 */

import {
  isIdent,
  isList,
  isNumber,
  isString,
  type LudList,
  type LudNode,
  listHead,
} from "@ludii/typescript-language";

// Equipment
import { Piece } from "./ludemes/game/equipment/component/Piece.js";
import { Board1to1 } from "./ludemes/game/equipment/container/board/Board1to1.js";
import { Equipment1to1 } from "./ludemes/game/equipment/Equipment1to1.js";

// Functions
import { IntConstant } from "./ludemes/game/functions/ints/IntConstant.js";
import { IsLine } from "./ludemes/game/functions/booleans/is/line/IsLine.js";
import { SitesEmpty } from "./ludemes/game/functions/region/sites/SitesEmpty.js";

// Rules
import { Add } from "./ludemes/game/rules/play/moves/nonDecision/effect/Add.js";
import { Result } from "./ludemes/game/rules/end/Result.js";
import { If } from "./ludemes/game/rules/end/If.js";
import { End } from "./ludemes/game/rules/end/End.js";
import { Play1to1 } from "./ludemes/game/rules/play/Play1to1.js";
import { Rules1to1 } from "./ludemes/game/rules/Rules1to1.js";

// Game
import { Game1to1 } from "./ludemes/Game1to1.js";

import type { IntFunction, BooleanFunction, RegionFunction, MovesFunction, EndRuleFunction, RoleType, ResultType } from "./ludemes/base.js";

// ---------------------------------------------------------------------------
// Helper: split items into positional + named (key:value) args
// ---------------------------------------------------------------------------

interface ParsedArgs1to1 {
  positional: LudNode[];
  named: Map<string, LudNode>;
}

function parseArgs1to1(items: readonly LudNode[], startFrom = 1): ParsedArgs1to1 {
  const positional: LudNode[] = [];
  const named = new Map<string, LudNode>();
  for (let i = startFrom; i < items.length; i++) {
    const it = items[i];
    if (!it) continue;
    if (isIdent(it) && it.name.endsWith(":")) {
      const key = it.name.slice(0, -1).toLowerCase();
      const val = items[i + 1];
      if (val) { named.set(key, val); i++; }
    } else {
      positional.push(it);
    }
  }
  return { positional, named };
}

function headOf(node: LudNode): string | undefined {
  if (!isList(node)) return undefined;
  return listHead(node)?.toLowerCase();
}

// ---------------------------------------------------------------------------
// Compile IntFunction
// ---------------------------------------------------------------------------

export function compileInt1to1(node: LudNode | undefined): IntFunction {
  if (!node) return new IntConstant(0);
  if (isNumber(node)) return new IntConstant(node.value);
  if (isIdent(node)) {
    const n = parseInt(node.name, 10);
    if (!isNaN(n)) return new IntConstant(n);
  }
  if (isList(node)) {
    const h = headOf(node);
    if (h === "count" || h === null) {
      // (count Moves) — for now stub as 0; not needed for TTT
      return new IntConstant(0);
    }
  }
  throw new Error(`compiler1to1: cannot compile IntFunction from ${JSON.stringify(node)}`);
}

// ---------------------------------------------------------------------------
// Compile RegionFunction
// ---------------------------------------------------------------------------

export function compileRegion1to1(node: LudNode | undefined): RegionFunction {
  if (!node) throw new Error("compiler1to1: expected RegionFunction node");
  if (!isList(node)) throw new Error(`compiler1to1: expected list for RegionFunction, got ${node.kind}`);
  const h = headOf(node)!;
  if (h === "sites") {
    const { positional } = parseArgs1to1(node.items);
    const first = positional[0];
    if (first && isIdent(first) && first.name.toLowerCase() === "empty") {
      return new SitesEmpty();
    }
    throw new Error(`compiler1to1: (sites ${first ? (isIdent(first) ? first.name : first.kind) : "?"}) not supported`);
  }
  throw new Error(`compiler1to1: unknown RegionFunction head "${h}"`);
}

// ---------------------------------------------------------------------------
// Compile BooleanFunction
// ---------------------------------------------------------------------------

export function compileBool1to1(
  node: LudNode | undefined,
  numPlayers: number,
): BooleanFunction {
  if (!node) throw new Error("compiler1to1: expected BooleanFunction node");
  if (!isList(node)) throw new Error(`compiler1to1: expected list for BooleanFunction`);
  const h = headOf(node)!;

  if (h === "is") {
    const { positional } = parseArgs1to1(node.items);
    const first = positional[0];
    if (first && isIdent(first) && first.name.toLowerCase() === "line") {
      // (is Line N [dirnOrWho])
      const lenNode = positional[1];
      const len = compileInt1to1(lenNode);
      // Optional direction or who — for TTT it's absent (defaults to Adjacent)
      let dirnName = "Adjacent";
      const dirnNode = positional[2];
      if (dirnNode && isIdent(dirnNode)) {
        // Could be "Adjacent", "Orthogonal", "Diagonal", direction names, or a who (Mover/P1/etc.)
        // For now treat any non-role ident as a direction name
        const dn = dirnNode.name;
        const roles = new Set(["Mover", "Next", "P1", "P2", "All", "Each"]);
        if (!roles.has(dn)) {
          dirnName = dn;
        }
        // If it's a who-role, IsLine still uses Adjacent by default
      }
      return new IsLine(len, dirnName);
    }
    throw new Error(`compiler1to1: (is ${first && isIdent(first) ? first.name : "?"}) not supported`);
  }

  throw new Error(`compiler1to1: unknown BooleanFunction head "${h}"`);
}

// ---------------------------------------------------------------------------
// Compile EndRuleFunction
// ---------------------------------------------------------------------------

function compileEndRule1to1(node: LudNode, numPlayers: number): EndRuleFunction {
  if (!isList(node)) throw new Error("compiler1to1: end rule must be a list");
  const h = headOf(node)!;

  if (h === "if") {
    const { positional } = parseArgs1to1(node.items);
    const condNode = positional[0];
    const resultNode = positional[1];
    if (!condNode || !resultNode) {
      throw new Error("compiler1to1: (if condition result) — missing parts");
    }
    const condition = compileBool1to1(condNode, numPlayers);
    const result = compileResult1to1(resultNode);
    return new If(condition, result, numPlayers);
  }

  throw new Error(`compiler1to1: unknown end rule head "${h}"`);
}

function compileResult1to1(node: LudNode): Result {
  if (!isList(node)) throw new Error("compiler1to1: result must be a list");
  const h = headOf(node)!;
  if (h === "result") {
    const { positional } = parseArgs1to1(node.items);
    const who = positional[0];
    const resultType = positional[1];
    if (!who || !isIdent(who) || !resultType || !isIdent(resultType)) {
      throw new Error("compiler1to1: (result Who ResultType) malformed");
    }
    const whoStr = who.name as RoleType;
    const resultStr = resultType.name as ResultType;
    return new Result(whoStr, resultStr);
  }
  throw new Error(`compiler1to1: unknown result head "${h}"`);
}

// ---------------------------------------------------------------------------
// Compile End
// ---------------------------------------------------------------------------

function compileEnd1to1(node: LudNode, numPlayers: number): End {
  if (!isList(node)) throw new Error("compiler1to1: end must be a list");
  const h = headOf(node)!;
  if (h !== "end") throw new Error(`compiler1to1: expected (end ...), got "${h}"`);

  const { positional } = parseArgs1to1(node.items);
  const rules: EndRuleFunction[] = [];

  if (positional.length === 0) {
    // (end) with no rules — empty
    return new End([]);
  }

  // (end (if ...)) — single rule
  // (end { (if ...) (if ...) }) — multiple rules in curly braces
  const first = positional[0]!;
  if (isList(first) && first.delimiter === "curly") {
    // { (if ...) ... }
    for (const child of first.items) {
      if (isList(child)) {
        rules.push(compileEndRule1to1(child, numPlayers));
      }
    }
  } else if (isList(first)) {
    rules.push(compileEndRule1to1(first, numPlayers));
  } else {
    throw new Error("compiler1to1: end rule content must be a list or curly-list");
  }

  return new End(rules);
}

// ---------------------------------------------------------------------------
// Compile MovesFunction (the play generator)
// ---------------------------------------------------------------------------

function compileMoves1to1(node: LudNode): MovesFunction {
  if (!isList(node)) throw new Error("compiler1to1: play moves must be a list");
  const h = headOf(node);

  // (move Add (to (sites Empty)))
  if (h === "move") {
    const { positional } = parseArgs1to1(node.items);
    const first = positional[0];
    if (first && isIdent(first) && first.name.toLowerCase() === "add") {
      // Find the (to ...) clause
      const toNode = positional.find(n => isList(n) && headOf(n) === "to");
      if (!toNode || !isList(toNode)) {
        throw new Error("compiler1to1: (move Add ...) missing (to ...)");
      }
      const toArgs = parseArgs1to1(toNode.items);
      const regionNode = toArgs.positional[0];
      if (!regionNode) throw new Error("compiler1to1: (to ...) missing region");
      const region = compileRegion1to1(regionNode);
      return new Add(region);
    }
    throw new Error(`compiler1to1: (move ${first && isIdent(first) ? first.name : "?"}) not supported`);
  }

  throw new Error(`compiler1to1: unknown play moves head "${h ?? "?"}"`);
}

// ---------------------------------------------------------------------------
// Compile Play
// ---------------------------------------------------------------------------

function compilePlay1to1(node: LudNode): Play1to1 {
  if (!isList(node)) throw new Error("compiler1to1: play must be a list");
  const h = headOf(node)!;
  if (h !== "play") throw new Error(`compiler1to1: expected (play ...), got "${h}"`);
  const { positional } = parseArgs1to1(node.items);
  const movesNode = positional[0];
  if (!movesNode) throw new Error("compiler1to1: (play ...) missing move generator");
  return new Play1to1(compileMoves1to1(movesNode));
}

// ---------------------------------------------------------------------------
// Compile Equipment
// ---------------------------------------------------------------------------

function compileEquipment1to1(node: LudNode, numPlayers: number): Equipment1to1 {
  if (!isList(node)) throw new Error("compiler1to1: equipment must be a list");
  const h = headOf(node)!;
  if (h !== "equipment") throw new Error(`compiler1to1: expected (equipment ...), got "${h}"`);

  let board: Board1to1 | undefined;
  const pieces: Piece[] = [];

  // Items of (equipment { ... }) — find the curly-list child
  const { positional } = parseArgs1to1(node.items);
  const listNode = positional[0];
  const items = (listNode && isList(listNode) && listNode.delimiter === "curly")
    ? listNode.items
    : positional;

  for (const child of items) {
    if (!isList(child)) continue;
    const ch = headOf(child)!;

    if (ch === "board") {
      // (board (square N)) or (board (rectangle H W))
      board = compileBoard1to1(child);
    } else if (ch === "piece") {
      // (piece "Name" Owner) or (piece "Name" Each)
      const pArgs = parseArgs1to1(child.items);
      const nameNode = pArgs.positional[0];
      const ownerNode = pArgs.positional[1];
      if (!nameNode || !isString(nameNode)) continue;
      const pieceName = nameNode.value;

      if (ownerNode && isIdent(ownerNode)) {
        const ownerStr = ownerNode.name;
        if (ownerStr === "Each") {
          // One piece per player
          for (let p = 1; p <= numPlayers; p++) {
            pieces.push(new Piece(pieceName, p));
          }
        } else if (ownerStr.startsWith("P") && !isNaN(parseInt(ownerStr.slice(1), 10))) {
          const p = parseInt(ownerStr.slice(1), 10);
          pieces.push(new Piece(pieceName, p));
        } else if (ownerStr === "Neutral") {
          pieces.push(new Piece(pieceName, 0));
        }
        // else: unknown owner, skip
      }
    }
    // hand, regions, etc. — not needed for TTT, skip
  }

  if (!board) throw new Error("compiler1to1: (equipment ...) missing (board ...)");

  return new Equipment1to1(board, pieces);
}

function compileBoard1to1(node: LudList): Board1to1 {
  // (board (square N)) or (board (rectangle H W))
  const { positional } = parseArgs1to1(node.items);
  const shapeNode = positional[0];
  if (!shapeNode || !isList(shapeNode)) {
    throw new Error("compiler1to1: (board ...) missing shape");
  }
  const sh = headOf(shapeNode)!;

  if (sh === "square") {
    const sArgs = parseArgs1to1(shapeNode.items);
    const sizeNode = sArgs.positional[0];
    if (!sizeNode || !isNumber(sizeNode)) {
      throw new Error("compiler1to1: (square N) — N must be a number");
    }
    const size = sizeNode.value;
    return new Board1to1(size, size);
  }

  if (sh === "rectangle") {
    const rArgs = parseArgs1to1(shapeNode.items);
    const hNode = rArgs.positional[0];
    const wNode = rArgs.positional[1];
    if (!hNode || !isNumber(hNode) || !wNode || !isNumber(wNode)) {
      throw new Error("compiler1to1: (rectangle H W) — H, W must be numbers");
    }
    // Java convention: first arg is rows (height), second is columns (width)
    return new Board1to1(wNode.value, hNode.value);
  }

  throw new Error(`compiler1to1: unsupported board shape "${sh}"`);
}

// ---------------------------------------------------------------------------
// Top-level: compileNode1to1 — the main entry point
// ---------------------------------------------------------------------------

/**
 * Walk the expanded `(game ...)` AST and produce a `Game1to1`.
 *
 * @param gameNode  The `(game "Name" ...)` LudList (already define-expanded)
 * @returns         A fully constructed `Game1to1`
 */
export function compileNode1to1(gameNode: LudList): Game1to1 {
  const h = listHead(gameNode);
  if (h !== "game") throw new Error(`compiler1to1: expected (game ...), got "${h}"`);

  // Extract direct children by head name
  function child(head: string): LudList | undefined {
    for (const item of gameNode.items) {
      if (isList(item) && listHead(item)?.toLowerCase() === head) return item;
    }
    return undefined;
  }

  // (game "Name" ...)
  let gameName = "Game";
  const nameItem = gameNode.items[1];
  if (nameItem && isString(nameItem)) gameName = nameItem.value;

  // (players N)
  let numPlayers = 2;
  const playersNode = child("players");
  if (playersNode) {
    const { positional } = parseArgs1to1(playersNode.items);
    const nNode = positional[0];
    if (nNode && isNumber(nNode)) numPlayers = nNode.value;
  }

  // (equipment { ... })
  const equipNode = child("equipment");
  if (!equipNode) throw new Error("compiler1to1: game missing (equipment ...)");
  const equipment = compileEquipment1to1(equipNode, numPlayers);

  // (rules (play ...) (end ...))
  const rulesNode = child("rules");
  if (!rulesNode) throw new Error("compiler1to1: game missing (rules ...)");

  let play: Play1to1 | undefined;
  let end: End | undefined;

  for (const child2 of rulesNode.items) {
    if (!isList(child2)) continue;
    const ch = headOf(child2)!;
    if (ch === "play") {
      play = compilePlay1to1(child2);
    } else if (ch === "end") {
      end = compileEnd1to1(child2, numPlayers);
    }
    // (start ...) — no-op for TTT; skip
  }

  if (!play) throw new Error("compiler1to1: (rules ...) missing (play ...)");
  if (!end) throw new Error("compiler1to1: (rules ...) missing (end ...)");

  const rules = new Rules1to1(play, end);
  return new Game1to1(gameName, numPlayers, equipment, rules);
}
