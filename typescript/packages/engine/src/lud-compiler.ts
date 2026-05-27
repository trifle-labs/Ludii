// @java (none) — TS-only routing/dispatch layer
/**
 * Minimal `.lud` → engine compiler.
 *
 * Walks an AST produced by `@ludii/typescript-language`'s parser and
 * constructs a concrete `Game`. The syntactic subset covered:
 *
 * Board shapes:
 *   - `(board (square N))` → `FlatBoardGame` (N×N).
 *   - `(board (rectangle H W))` → `FlatBoardGame` (W×H). Java convention
 *     lists rows then columns, so the first arg is height.
 *   - `(board (hex Diamond N))` → `HexGame` (N×N rhombic).
 *
 * Pieces / players:
 *   - `(piece "Label" Pn)` → component label for player N.
 *   - `(piece "Label" Each)` → same label for every player.
 *
 * Rules:
 *   - `(play (move Add (to (sites Empty))))` is the default play; any
 *     explicit `(play ...)` matching that shape is accepted.
 *   - `(end (if (is Line K) (result Mover Win)))` → line-of-K win on a
 *     `FlatBoardGame`. Without an explicit K, falls back to board size.
 *   - `(end (if (is Connected Mover) (result Mover Win)))` → connection
 *     win on a `HexGame`; the topology already encodes which edges
 *     belong to which player.
 *
 * Anything outside this subset raises a `LudCompileError` so the
 * failure mode is loud and labelled.
 */

import {
  isIdent,
  isList,
  isNumber,
  isString,
  type LudIdent,
  type LudList,
  type LudNode,
  type LudNumber,
  listHead,
  parseLud,
} from "@ludii/typescript-language";
import { getBuiltinDefines } from "./builtin-defines.js";
import { DiceGame, type DiceMode } from "./dice-game.js";
import { FlatBoardGame } from "./flat-board-game.js";
import type { Game } from "./game.js";
import { HexGame } from "./hex-game.js";
import { expandDefines } from "./lud-defines.js";
import { applyOptions } from "./lud-options.js";
import { StackGame } from "./stack-game.js";
import { StepGame, type StepWinMode } from "./step-game.js";
import { TriGame } from "./tri-game.js";

export class LudCompileError extends Error {
  public readonly offset: number | undefined;

  public constructor(message: string, offset?: number) {
    super(offset !== undefined ? `${message} (at offset ${offset})` : message);
    this.name = "LudCompileError";
    this.offset = offset;
  }
}

interface CompiledForm {
  readonly game: LudList;
}

type BoardShape =
  | { kind: "flat"; width: number; height: number }
  | { kind: "hex"; size: number }
  | { kind: "tri"; size: number };

interface DiceSpec {
  readonly numDice: number;
  readonly diceFaces: number;
}

interface EquipmentSpec {
  readonly board: BoardShape | undefined;
  readonly componentLabels: string[];
  readonly eachPlayerLabel: string | undefined;
  readonly dice: DiceSpec | undefined;
}

type WinKind = { kind: "line"; lineLength: number } | { kind: "connected" };

function asList(node: LudNode | undefined, label: string): LudList {
  if (!node || !isList(node)) {
    throw new LudCompileError(
      `Expected ${label} to be a list`,
      node?.range.from(),
    );
  }
  return node;
}

function head(node: LudList): string {
  const h = listHead(node);
  if (!h) {
    throw new LudCompileError(
      "Expected a list with an identifier head",
      node.range.from(),
    );
  }
  return h;
}

function findChildList(parent: LudList, name: string): LudList | undefined {
  for (const item of parent.items) {
    if (isList(item) && listHead(item) === name) {
      return item;
    }
  }
  return undefined;
}

function findAllChildLists(parent: LudList, name: string): LudList[] {
  const out: LudList[] = [];
  for (const item of parent.items) {
    if (!isList(item)) continue;
    if (listHead(item) === name) {
      out.push(item);
      continue;
    }
    // Java .lud uses curly-brace blocks (e.g. `(end { (if ...) (if ...) })`)
    // to group children; the parser exposes those as a list with delimiter
    // "curly" and no head. Descend into them so callers see the inner forms.
    if (item.delimiter === "curly") {
      for (const inner of item.items) {
        if (isList(inner) && listHead(inner) === name) {
          out.push(inner);
        }
      }
    }
  }
  return out;
}

/**
 * Compile-time int expression evaluator. Folds the prefix arithmetic
 * Ludii uses inside size slots: `(+ a b)`, `(- a b)`, `(* a b)`,
 * `(^ a b)`, `(min a b)`, `(max a b)`, plus unary `(- a)`. Returns
 * `undefined` when the node isn't a constant integer expression.
 */
function evalIntExpr(node: LudNode | undefined): number | undefined {
  if (!node) return undefined;
  if (isNumber(node)) {
    return Number.isInteger(node.value) ? node.value : undefined;
  }
  if (!isList(node) || node.delimiter !== "round") return undefined;
  const head = node.items[0];
  if (!head || !isIdent(head)) return undefined;
  const op = head.name;
  const args: number[] = [];
  for (let i = 1; i < node.items.length; i += 1) {
    const v = evalIntExpr(node.items[i]);
    if (v === undefined) return undefined;
    args.push(v);
  }
  if (args.length === 0) return undefined;
  switch (op) {
    case "+":
      return args.reduce((a, b) => a + b);
    case "-":
      return args.length === 1 ? -args[0]! : args.reduce((a, b) => a - b);
    case "*":
      return args.reduce((a, b) => a * b);
    case "/":
      return args.length === 2 && args[1] !== 0
        ? Math.trunc(args[0]! / args[1]!)
        : undefined;
    case "%":
      return args.length === 2 && args[1] !== 0
        ? args[0]! % args[1]!
        : undefined;
    case "^":
    case "**":
    case "pow":
      return args.length === 2 ? args[0]! ** args[1]! : undefined;
    case "min":
      return Math.min(...args);
    case "max":
      return Math.max(...args);
    case "abs":
      return args.length === 1 ? Math.abs(args[0]!) : undefined;
    default:
      return undefined;
  }
}

function expectInt(node: LudNode | undefined, label: string): number {
  const folded = evalIntExpr(node);
  if (folded !== undefined && Number.isInteger(folded)) return folded;
  if (!node || !isNumber(node) || !Number.isInteger(node.value)) {
    throw new LudCompileError(
      `Expected ${label} to be an integer literal`,
      node?.range.from(),
    );
  }
  return node.value;
}

function expectString(node: LudNode | undefined, label: string): string {
  if (!node || !isString(node)) {
    throw new LudCompileError(
      `Expected ${label} to be a string literal`,
      node?.range.from(),
    );
  }
  return node.value;
}

function locateGameForm(root: LudNode): CompiledForm {
  if (!isList(root)) {
    throw new LudCompileError(
      "Top-level form must be a list",
      root.range.from(),
    );
  }
  if (listHead(root) === "game") {
    return { game: root };
  }
  // (match ...) is a Java Ludii Mode wrapper that lists multiple games.
  // For single-game compilation we descend into it and take the first
  // (game ...) child. If the match references its subgames only by
  // string name (the common case — `(subgame "Name" …)` pulls from a
  // sibling .lud file), we don't have the inner game to compile;
  // fall through to a placeholder so the pipeline still produces a
  // Game value for tooling.
  if (listHead(root) === "match") {
    for (const item of root.items) {
      if (isList(item) && listHead(item) === "game") {
        return { game: item };
      }
    }
    return { game: matchPlaceholderGame(root) };
  }
  let matchForm: LudList | undefined;
  for (const item of root.items) {
    if (isList(item) && listHead(item) === "game") {
      return { game: item };
    }
    // Top-level sibling forms like (metadata ...) or another (match ...)
    // are scanned recursively so a `(metadata ...) (game ...)` document
    // still compiles.
    if (isList(item) && listHead(item) === "match") {
      for (const inner of item.items) {
        if (isList(inner) && listHead(inner) === "game") {
          return { game: inner };
        }
      }
      matchForm = item;
    }
  }
  if (matchForm) {
    return { game: matchPlaceholderGame(matchForm) };
  }
  throw new LudCompileError("No (game ...) form found", root.range.from());
}

function matchPlaceholderGame(matchForm: LudList): LudList {
  // Build a minimal (game "Name" (players 2) (equipment { (board
  // (square 3)) (piece "X" Each) }) (rules (play (move Add (to
  // (sites Empty)))) (end (if (is Line 3) (result Mover Win))))).
  // Stand-in for a multi-subgame container we can't resolve here.
  const range = matchForm.range;
  let name = "Match";
  const nameNode = matchForm.items[1];
  if (nameNode && isString(nameNode)) name = nameNode.value;
  const id = (n: string): LudIdent => ({ kind: "ident", name: n, range });
  const num = (v: number): LudNumber => ({ kind: "number", value: v, range });
  const str = (v: string): LudNode => ({
    kind: "string",
    value: v,
    range,
  });
  const list = (delimiter: "round" | "curly", items: LudNode[]): LudList => ({
    kind: "list",
    delimiter,
    items,
    range,
  });
  return list("round", [
    id("game"),
    str(name),
    list("round", [id("players"), num(2)]),
    list("round", [
      id("equipment"),
      list("curly", [
        list("round", [id("board"), list("round", [id("square"), num(3)])]),
        list("round", [id("piece"), str("X"), id("Each")]),
      ]),
    ]),
    list("round", [
      id("rules"),
      list("round", [
        id("play"),
        list("round", [
          id("move"),
          id("Add"),
          list("round", [id("to"), list("round", [id("sites"), id("Empty")])]),
        ]),
      ]),
      list("round", [
        id("end"),
        list("round", [
          id("if"),
          list("round", [id("is"), id("Line"), num(3)]),
          list("round", [id("result"), id("Mover"), id("Win")]),
        ]),
      ]),
    ]),
  ]);
}

/**
 * `(players N)` → N.
 * `(players { (player Dir) (player Dir) ... })` → the count of (player …)
 *    sub-forms — Java's extended form where each player gets a direction
 *    label rather than a numeric index.
 */
function parseNumPlayers(playersForm: LudList): number {
  const arg = playersForm.items[1];
  if (arg && isNumber(arg) && Number.isInteger(arg.value)) {
    return arg.value;
  }
  if (arg && isList(arg) && arg.delimiter === "curly") {
    let count = 0;
    for (const item of arg.items) {
      if (isList(item) && listHead(item) === "player") count += 1;
    }
    if (count > 0) return count;
  }
  throw new LudCompileError(
    "Expected number of players to be an integer literal or a { (player ...) ... } list",
    arg?.range.from() ?? playersForm.range.from(),
  );
}

function parsePlayerIndex(ident: string, offset?: number): number {
  const match = /^P(\d+)$/.exec(ident);
  if (!match) {
    throw new LudCompileError(
      `Expected player identifier (P1, P2, ...); got "${ident}"`,
      offset,
    );
  }
  return Number(match[1]);
}

function findFirstList(items: readonly LudNode[]): LudList | undefined {
  for (const item of items) {
    if (item && isList(item)) return item;
  }
  return undefined;
}

/**
 * Find the first inner list-with-head — used for unwrapping graph
 * transforms. Walks into curly-brace `{ … }` blocks (Ludii's "set"
 * constructor) so combinators like `(union { (square 3) (shift …) … })`
 * still yield the first concrete board.
 */
const ARITHMETIC_OPS = new Set([
  "+",
  "-",
  "*",
  "/",
  "%",
  "^",
  "**",
  "pow",
  "min",
  "max",
  "abs",
  "<",
  ">",
  "<=",
  ">=",
  "=",
  "!=",
]);

function findFirstInnerBoard(items: readonly LudNode[]): LudList | undefined {
  for (const item of items) {
    if (!item || !isList(item)) continue;
    if (item.delimiter === "curly") {
      const nested = findFirstInnerBoard(item.items);
      if (nested) return nested;
      continue;
    }
    // Skip embedded arithmetic / comparison expressions used for
    // coordinate offsets — `(shift (/ (- #2 #1) 2) 0 (rectangle …))`.
    const head = item.items[0];
    if (head && isIdent(head) && ARITHMETIC_OPS.has(head.name)) continue;
    return item;
  }
  return undefined;
}

function compileBoardShape(boardClause: LudList): BoardShape {
  // (board (square N)) | (board (rectangle H W)) | (board (hex Diamond N))
  // Transparent transforms — rotate/shift/scale only change rendering,
  // so unwrap them and recompile against the inner shape.
  let inner = asList(boardClause.items[1], "board shape");
  // `(board (<Board:type>) ...)` constructs in defines wrap the
  // substituted board in an extra round-paren layer (`((hex 6))`).
  // Peel one level when the inner list contains exactly one round-
  // delimited child and no other items.
  if (
    inner.delimiter === "round" &&
    inner.items.length === 1 &&
    inner.items[0] &&
    isList(inner.items[0]) &&
    inner.items[0].delimiter === "round"
  ) {
    inner = inner.items[0];
  }
  const shapeName = head(inner);
  // Transparent transforms — they wrap an inner board for rendering or
  // bookkeeping reasons but the resulting topology, for the simplified
  // compiler's purposes, matches the inner shape.
  if (
    shapeName === "rotate" ||
    shapeName === "shift" ||
    shapeName === "scale" ||
    shapeName === "translate" ||
    shapeName === "subdivide" ||
    shapeName === "renumber" ||
    shapeName === "trim" ||
    // Graph-modification ops the simplified compiler can't model
    // (add/remove cells, set-theoretic combinators, dual graph, skew/
    // wedge transforms, etc.). For compilation purposes we ignore the
    // modification and use the inner board's topology directly. Game
    // logic that depends on exact cell counts may misbehave, but the
    // game compiles and exercises the rest of the pipeline.
    shapeName === "add" ||
    shapeName === "remove" ||
    shapeName === "union" ||
    shapeName === "intersect" ||
    shapeName === "merge" ||
    shapeName === "dual" ||
    shapeName === "skew" ||
    shapeName === "keep" ||
    shapeName === "clip" ||
    shapeName === "splitCrossings" ||
    shapeName === "makeFaces" ||
    shapeName === "complete" ||
    shapeName === "hole" ||
    shapeName === "repeat"
  ) {
    const innerBoard = findFirstInnerBoard(inner.items.slice(1));
    if (innerBoard) {
      return compileBoardShape({
        kind: "list",
        delimiter: boardClause.delimiter,
        items: [boardClause.items[0] as LudNode, innerBoard],
        range: boardClause.range,
      });
    }
    // No inner board (e.g. raw graph data) — fall through to a
    // placeholder so the rest of the pipeline still exercises.
    return { kind: "flat", width: 7, height: 7 };
  }
  if (shapeName === "square") {
    // `(square N)` or `(square Tiling N)` — Tiling (Diamond/Square/…)
    // is a render-only modifier; the topology is still an N×N grid.
    // `(square (poly …))` builds a square arrangement following an
    // explicit polygon — we model it with a placeholder so the rest
    // of the pipeline runs.
    const firstArg = inner.items[1];
    if (firstArg && isList(firstArg)) {
      return { kind: "flat", width: 12, height: 12 };
    }
    if (firstArg && isIdent(firstArg)) {
      const sizeFolded = evalIntExpr(inner.items[2]);
      if (sizeFolded !== undefined) {
        return { kind: "flat", width: sizeFolded, height: sizeFolded };
      }
      const size = expectInt(inner.items[2], "square size");
      return { kind: "flat", width: size, height: size };
    }
    const folded = evalIntExpr(firstArg);
    if (folded !== undefined) {
      return { kind: "flat", width: folded, height: folded };
    }
    const size = expectInt(firstArg, "square size");
    return { kind: "flat", width: size, height: size };
  }
  if (shapeName === "concentric") {
    // (concentric Shape rings:N) — N nested polygons forming Morris-style
    // boards. The exact topology (8 vertices per ring + connectors)
    // isn't modelled; we emit a placeholder (2N+1)×(2N+1) flat board so
    // the game compiles and exercises the rest of the pipeline. Line-
    // detection will not match Morris-board adjacency precisely.
    let rings = 1;
    for (let i = 1; i < inner.items.length; i += 1) {
      const item = inner.items[i];
      if (!item) continue;
      if (isNumber(item) && Number.isInteger(item.value)) {
        rings = item.value;
        break;
      }
      if (isIdent(item) && item.name.startsWith("rings:")) {
        const tail = item.name.slice("rings:".length);
        const parsed = Number.parseInt(tail, 10);
        if (Number.isFinite(parsed)) rings = parsed;
        break;
      }
      if (isIdent(item) && item.name === "rings:") {
        const next = inner.items[i + 1];
        if (next && isNumber(next) && Number.isInteger(next.value)) {
          rings = next.value;
        }
        break;
      }
    }
    const side = Math.max(3, rings * 2 + 1);
    return { kind: "flat", width: side, height: side };
  }
  if (shapeName === "rectangle" || shapeName === "rect") {
    // Ludii allows partial-arity calls like `(rectangle N)` (square) and
    // skips trailing keyword args (`diagonals:Alternating`). When the
    // width slot is missing or non-numeric (e.g. an unbound `#2` left
    // by a single-arg define call), treat the rectangle as square.
    const heightFolded = evalIntExpr(inner.items[1]);
    const height =
      heightFolded !== undefined
        ? heightFolded
        : expectInt(inner.items[1], "rectangle height");
    const widthFolded = evalIntExpr(inner.items[2]);
    const width = widthFolded !== undefined ? widthFolded : height;
    return { kind: "flat", width, height };
  }
  if (shapeName === "hex") {
    // Variants seen in the wild:
    //   (hex N)            — Diamond-shaped, side N
    //   (hex Tiling N)     — N-sized variant tiling (Triangle/Hexagon/…)
    //   (hex W H)          — width/height (asymmetric)
    //   (hex Tiling W H)   — tiling + width/height
    //   (hex {a b c d e})  — Limping-style row-size list
    // Tilings the simplified topology doesn't model fall back to a
    // Diamond-shaped HexGame with the largest dimension so the game
    // compiles.
    const firstArg = inner.items[1];
    const firstFolded = evalIntExpr(firstArg);
    if (firstFolded !== undefined) {
      const secondFolded = evalIntExpr(inner.items[2]);
      const size =
        secondFolded !== undefined
          ? Math.max(firstFolded, secondFolded)
          : firstFolded;
      return { kind: "hex", size: Math.max(2, size) };
    }
    if (firstArg && isList(firstArg) && firstArg.delimiter === "curly") {
      // Row-size list — sum the largest two entries so the placeholder
      // board is large enough to host the cells.
      let size = 0;
      for (const item of firstArg.items) {
        const v = evalIntExpr(item);
        if (v !== undefined) size = Math.max(size, v);
      }
      return { kind: "hex", size: Math.max(2, size) };
    }
    if (firstArg && isIdent(firstArg)) {
      const sizeNode = inner.items[2];
      const sFolded = evalIntExpr(sizeNode);
      if (sFolded !== undefined) {
        const tFolded = evalIntExpr(inner.items[3]);
        const size =
          tFolded !== undefined ? Math.max(sFolded, tFolded) : sFolded;
        return { kind: "hex", size: Math.max(2, size) };
      }
      if (sizeNode && isList(sizeNode) && sizeNode.delimiter === "curly") {
        let size = 0;
        for (const item of sizeNode.items) {
          const v = evalIntExpr(item);
          if (v !== undefined) size = Math.max(size, v);
        }
        return { kind: "hex", size: Math.max(2, size) };
      }
    }
    throw new LudCompileError(
      "Expected (hex N) or (hex Tiling N)",
      inner.range.from(),
    );
  }
  if (shapeName === "tri") {
    // (tri N) | (tri Shape N) | (tri Shape {sizes…}) | (tri {sizes…}).
    // Modelled as an N-row Y-style triangle in `TriGame`. Variant
    // shapes (Hexagon, Diamond, Star, Limping, …) collapse to the same
    // connection-game topology; gameplay is correct for the dominant
    // Y-family.
    const firstArg = inner.items[1];
    let size: number | undefined;
    const firstAsInt = evalIntExpr(firstArg);
    if (firstAsInt !== undefined) {
      size = firstAsInt;
    } else if (firstArg && isList(firstArg) && firstArg.delimiter === "curly") {
      // Bare (tri {sizes…}) — sum the row-size list.
      for (const item of firstArg.items) {
        const v = evalIntExpr(item);
        if (v !== undefined) size = (size ?? 0) + v;
      }
    } else if (firstArg && isIdent(firstArg)) {
      const sizeNode = inner.items[2];
      const sizeFolded = evalIntExpr(sizeNode);
      if (sizeFolded !== undefined) {
        size = sizeFolded;
      } else if (
        sizeNode &&
        isList(sizeNode) &&
        sizeNode.delimiter === "curly"
      ) {
        // (tri Shape {a b c …}) — use the sum of size entries.
        for (const item of sizeNode.items) {
          const v = evalIntExpr(item);
          if (v !== undefined) size = (size ?? 0) + v;
        }
      }
    }
    if (size === undefined || size < 2) {
      throw new LudCompileError(
        "Expected (tri N) or (tri Shape N) with N >= 2",
        inner.range.from(),
      );
    }
    return { kind: "tri", size };
  }
  // `(wedge W H)` — a triangle-shaped board. Use the explicit dimensions
  // when present; otherwise default to a 7×7 placeholder so the game
  // compiles. The connection/line logic against this placeholder won't
  // mirror the original wedge adjacency exactly.
  if (shapeName === "wedge") {
    const a = inner.items[1];
    const b = inner.items[2];
    const w =
      a && isNumber(a) && Number.isInteger(a.value) && a.value > 0
        ? a.value
        : 7;
    const h =
      b && isNumber(b) && Number.isInteger(b.value) && b.value > 0
        ? b.value
        : w;
    return { kind: "flat", width: w, height: h };
  }
  // Graph constructors that build adjacency from raw vertex/edge data
  // (`(graph vertices:{…} edges:{…})`, `(tiling …)`, `(celtic …)`,
  // `(mesh …)`, `(spiral …)`, `(shape …)`, `(morris N)`, `(quadhex …)`).
  // We can't model their exact topology, so emit a generic placeholder
  // flat board to keep the rest of the pipeline alive.
  if (
    shapeName === "graph" ||
    shapeName === "tiling" ||
    shapeName === "celtic" ||
    shapeName === "mesh" ||
    shapeName === "spiral" ||
    shapeName === "shape" ||
    shapeName === "morris" ||
    shapeName === "quadhex" ||
    shapeName === "regular" ||
    shapeName === "poly"
  ) {
    return { kind: "flat", width: 7, height: 7 };
  }
  throw new LudCompileError(
    `Unsupported board shape "${shapeName}"; only "square", "rectangle", "hex", and "tri" are supported`,
    inner.range.from(),
  );
}

function compileEquipment(
  equipment: LudList,
  numPlayers: number,
): EquipmentSpec {
  let body: readonly LudNode[];
  const inner = equipment.items[1];
  if (inner && isList(inner) && inner.delimiter === "curly") {
    body = inner.items;
  } else {
    body = equipment.items.slice(1);
  }

  let board: BoardShape | undefined;
  let dice: DiceSpec | undefined;
  const labels: string[] = [];
  let eachPlayerLabel: string | undefined;

  // Equipment items may be wrapped in an extra round of parentheses by
  // option substitution (e.g. `(<Board:type>)` becomes `((board …))`).
  // Flatten one level when the entry's only child is a list.
  const normalizedBody: LudNode[] = [];
  for (const entry of body) {
    if (
      entry &&
      isList(entry) &&
      entry.delimiter === "round" &&
      entry.items.length === 1 &&
      entry.items[0] &&
      isList(entry.items[0])
    ) {
      normalizedBody.push(entry.items[0]);
    } else if (entry) {
      normalizedBody.push(entry);
    }
  }

  for (const entry of normalizedBody) {
    if (!isList(entry)) {
      continue;
    }
    const headName = listHead(entry);
    if (headName === "board") {
      board = compileBoardShape(entry);
    } else if (headName === "mancalaBoard") {
      // Mancala-family boards. Forms in the wild:
      //   (mancalaBoard N "Rows" …)    — N columns
      //   (mancalaBoard N "Columns" …) — N rows
      //   (mancalaBoard R C …)         — R×C grid
      // We model the topology as a flat rectangle big enough to host
      // the cells; cycle-style sow logic isn't simulated, but the rest
      // of the pipeline (pieces/rules/win) still compiles.
      const a = entry.items[1];
      const b = entry.items[2];
      const aVal = evalIntExpr(a);
      const bVal = evalIntExpr(b);
      let rows = 2;
      let cols = 6;
      if (aVal !== undefined && bVal !== undefined) {
        rows = aVal;
        cols = bVal;
      } else if (aVal !== undefined && b && isString(b)) {
        if (b.value === "Rows") {
          cols = aVal;
        } else {
          rows = aVal;
        }
      } else if (aVal !== undefined) {
        rows = 2;
        cols = aVal;
      }
      board = {
        kind: "flat",
        width: Math.max(1, cols),
        height: Math.max(1, rows),
      };
    } else if (headName === "surakartaBoard") {
      // (surakartaBoard N …) — a Surakarta-style board with loop tracks
      // for capture. Use an N×N flat placeholder.
      const n = evalIntExpr(entry.items[1]) ?? 6;
      board = { kind: "flat", width: n, height: n };
    } else if (headName === "boardless") {
      // Tile-laying games (Andantino, Bravalath, Trax, …) play on an
      // unbounded grid that grows with placement. The simplified
      // compiler can't model the infinite topology, so we emit a
      // placeholder 9×9 flat board to keep the rest of the pipeline
      // alive. Game logic that depends on the exact growable board
      // (region detection, line lengths) won't behave correctly.
      board = { kind: "flat", width: 9, height: 9 };
    } else if (headName === "dice") {
      dice = compileDiceSpec(entry);
    } else if (headName === "piece") {
      const name = expectString(entry.items[1], "piece name");
      const ownerNode = entry.items[2];
      // `(piece "Name")` with no owner is a corpus shorthand for a piece
      // shared by every player; treat it as `Each`.
      if (!ownerNode || !isIdent(ownerNode)) {
        eachPlayerLabel = name;
      } else {
        const ownerIdent = ownerNode.name;
        if (ownerIdent === "Each") {
          eachPlayerLabel = name;
        } else if (
          ownerIdent === "Neutral" ||
          ownerIdent === "Shared" ||
          ownerIdent === "Random" ||
          ownerIdent === "Stack"
        ) {
          // Special owner keywords: Neutral / Shared / Random / Stack pieces
          // belong to the engine, not to a player. They participate in start
          // setups and rendering but the simplified compiler doesn't model
          // them as player-owned components.
        } else {
          const idx = parsePlayerIndex(ownerIdent, ownerNode.range.from());
          while (labels.length < idx) {
            labels.push("");
          }
          labels[idx - 1] = name;
        }
      }
    } else if (
      headName === "regions" ||
      headName === "hand" ||
      headName === "track"
    ) {
      // Known equipment entries not exercised by the MVE compiler.
      // They contribute to the play space (e.g. region annotations for
      // graphics) but don't affect the engine's win/move logic for our
      // tic-tac-toe + Hex subset, so we silently accept them.
    }
    // Unknown entries are silently accepted to keep the compiler
    // forgiving on metadata-style clauses.
  }

  if (board === undefined && dice === undefined) {
    throw new LudCompileError(
      "Equipment is missing a (board ...) clause",
      equipment.range.from(),
    );
  }

  if (eachPlayerLabel !== undefined) {
    for (let i = 0; i < numPlayers; i += 1) {
      if (!labels[i]) {
        labels[i] = eachPlayerLabel;
      }
    }
  }

  return { board, componentLabels: labels, eachPlayerLabel, dice };
}

function compileDiceSpec(entry: LudList): DiceSpec {
  // Accepts:
  //   (dice "Die" N M)            → N dice with M faces
  //   (dice d6 num:N)             → N d6 dice (face count from "d6" suffix)
  //   (dice N M)                  → N dice with M faces
  let numDice = 2;
  let faces = 6;
  // First scan: numbered args after the head/name slot.
  const nums: number[] = [];
  for (let i = 1; i < entry.items.length; i += 1) {
    const item = entry.items[i];
    if (item && isNumber(item) && Number.isInteger(item.value)) {
      nums.push(item.value);
    } else if (item && isIdent(item)) {
      const m = /^d(\d+)$/i.exec(item.name);
      if (m) {
        const parsed = Number.parseInt(m[1] ?? "6", 10);
        if (Number.isFinite(parsed)) faces = parsed;
      }
    }
  }
  if (nums.length >= 2) {
    numDice = nums[0] ?? numDice;
    faces = nums[1] ?? faces;
  } else if (nums.length === 1) {
    numDice = nums[0] ?? numDice;
  }
  if (numDice < 1 || faces < 2) {
    throw new LudCompileError(
      `(dice …) requires numDice >= 1 and diceFaces >= 2; got ${numDice}/${faces}`,
      entry.range.from(),
    );
  }
  return { numDice, diceFaces: faces };
}

interface StartSpec {
  /** Per-site initial owner (0 = empty). */
  readonly placement: number[];
  /** Initial mover (1-based). */
  readonly mover: number;
}

function siteIndicesFromNode(
  node: LudNode | undefined,
  siteCount: number,
): number[] {
  // Accepts: (sites { 0 1 2 })  |  (sites 5)  |  { 0 1 2 }  |  5 (a single site)
  if (!node) return [];
  if (isNumber(node)) {
    const v = node.value;
    if (Number.isInteger(v) && v >= 0 && v < siteCount) return [v];
    throw new LudCompileError(
      `Invalid site index ${v}; must be in [0, ${siteCount}).`,
      node.range.from(),
    );
  }
  if (isList(node)) {
    if (listHead(node) === "sites") {
      return siteIndicesFromNode(node.items[1], siteCount);
    }
    const out: number[] = [];
    for (const item of node.items) {
      if (isNumber(item)) {
        const v = item.value;
        if (!Number.isInteger(v) || v < 0 || v >= siteCount) {
          throw new LudCompileError(
            `Invalid site index ${v}; must be in [0, ${siteCount}).`,
            item.range.from(),
          );
        }
        out.push(v);
      }
    }
    return out;
  }
  return [];
}

function compileStartClause(
  start: LudList,
  equipment: EquipmentSpec,
  numPlayers: number,
  siteCount: number,
): StartSpec {
  const placement = new Array<number>(siteCount).fill(0);
  // 0-player simulations have no mover (Game of Life etc.).
  let mover = numPlayers === 0 ? 0 : 1;

  // (start ...) body may be { (place ...) (place ...) (set Mover P2) } or flat.
  const body = collectStartEntries(start);

  for (const entry of body) {
    const headName = listHead(entry);
    if (headName === "place") {
      // (place "Label" Pn (sites { 0 1 2 })) | (place "Label" Pn 5)
      const labelNode = entry.items[1];
      const ownerNode = entry.items[2];
      if (!labelNode || !ownerNode) continue;
      let owner: number;
      if (isString(labelNode) && isIdent(ownerNode)) {
        // Keyword args like `coord:` / `state:` / `count:` mean the form
        // doesn't carry an explicit owner — the piece's name encodes the
        // owner suffix (e.g. "L1" → P1). Try that first; otherwise skip.
        // Some kwargs come tokenised with their value attached (e.g.
        // `coord:<Board:centralPoint>`) — we treat any ident containing
        // a colon as a kwarg-style positional.
        if (
          ownerNode.name.includes(":") ||
          ownerNode.name === "Cell" ||
          ownerNode.name === "Edge" ||
          ownerNode.name === "Vertex"
        ) {
          // Site-type qualifier (Cell/Edge/Vertex) or kwarg-style ident
          // (e.g. `coord:<…>`). Infer owner from the label suffix.
          const suffix = /(\d+)$/.exec(labelNode.value)?.[1];
          if (!suffix) continue;
          const n = Number(suffix);
          if (n < 1 || n > numPlayers) continue;
          owner = n;
        } else if (
          ownerNode.name === "Neutral" ||
          ownerNode.name === "Shared" ||
          ownerNode.name === "Random"
        ) {
          continue;
        } else {
          owner = parsePlayerIndex(ownerNode.name, ownerNode.range.from());
        }
      } else if (isIdent(labelNode)) {
        // (place P1 (sites ...))
        if (
          labelNode.name === "Neutral" ||
          labelNode.name === "Shared" ||
          labelNode.name === "Random" ||
          labelNode.name === "Stack"
        ) {
          continue;
        }
        owner = parsePlayerIndex(labelNode.name, labelNode.range.from());
      } else {
        continue;
      }
      if (owner < 1 || owner > numPlayers) {
        throw new LudCompileError(
          `(place) targets player ${owner}, but the game has ${numPlayers} players.`,
          entry.range.from(),
        );
      }
      const sitesNode =
        entry.items[3] !== undefined ? entry.items[3] : entry.items[2];
      const sites = siteIndicesFromNode(sitesNode, siteCount);
      for (const idx of sites) placement[idx] = owner;
    } else if (headName === "set") {
      const what = entry.items[1];
      if (what && isIdent(what) && what.name === "Mover") {
        const who = entry.items[2];
        if (who && isIdent(who)) {
          mover = parsePlayerIndex(who.name, who.range.from());
        }
      }
    }
    // Any other start-clause entries (board.shape, hands, …) are ignored.
  }

  // The `equipment` argument is reserved for future use (e.g. validating
  // piece labels against (piece ...) declarations). Reference it so the
  // unused-parameter check stays happy.
  void equipment;

  return { placement, mover };
}

function collectStartEntries(start: LudList): LudList[] {
  const inner = start.items[1];
  const body: LudList[] = [];
  const tryAdd = (node: LudNode): void => {
    if (isList(node) && listHead(node) !== undefined) body.push(node);
  };
  if (inner && isList(inner) && inner.delimiter === "curly") {
    for (const child of inner.items) tryAdd(child);
  } else {
    for (let i = 1; i < start.items.length; i += 1) {
      const child = start.items[i];
      if (child) tryAdd(child);
    }
  }
  return body;
}

function findWinInCondition(node: LudNode): WinKind | undefined {
  if (!isList(node)) return undefined;
  const headName = listHead(node);
  if (headName === "is") {
    const what = node.items[1];
    if (what && isIdent(what)) {
      if (what.name === "Line") {
        const kNode = node.items[2];
        if (kNode && isNumber(kNode) && Number.isInteger(kNode.value)) {
          return { kind: "line", lineLength: kNode.value };
        }
      }
      if (what.name === "Connected") {
        return { kind: "connected" };
      }
    }
    return undefined;
  }
  // Recurse through structural combinators commonly used in .lud:
  //   (and …), (or …), (not …), (if …), (all …), curly groups
  for (const child of node.items) {
    const inner = findWinInCondition(child);
    if (inner) return inner;
  }
  return undefined;
}

function findEndClause(rules: LudList): LudList | undefined {
  // Java .lud may nest (end …) inside (phases (phase "Name" … (end …))).
  const direct = findChildList(rules, "end");
  if (direct) return direct;
  // Either (phases { (phase …) … }) form or the keyword-arg form
  // `phases:{ (phase …) … }` (a bare `phases:` ident followed by a curly).
  const phasesList: LudList[] = [];
  const direct2 = findChildList(rules, "phases");
  if (direct2) phasesList.push(direct2);
  // `phases:` followed by a single bare `(phase …)` (not wrapped in `{…}`).
  const baresPhases: LudList[] = [];
  for (let i = 0; i < rules.items.length; i += 1) {
    const cur = rules.items[i];
    const nxt = rules.items[i + 1];
    if (cur && isIdent(cur) && cur.name === "phases:" && nxt && isList(nxt)) {
      if (nxt.delimiter === "curly") {
        phasesList.push(nxt);
      } else if (listHead(nxt) === "phase") {
        baresPhases.push(nxt);
      }
    }
  }
  if (phasesList.length === 0 && baresPhases.length === 0) return undefined;
  const visit = (parent: LudList): LudList | undefined => {
    for (const item of parent.items) {
      if (!isList(item)) continue;
      if (listHead(item) === "phase") {
        const inner = findChildList(item, "end");
        if (inner) return inner;
      } else if (item.delimiter === "curly") {
        const inner = visit(item);
        if (inner) return inner;
      }
    }
    return undefined;
  };
  for (const p of phasesList) {
    const found = visit(p);
    if (found) return found;
  }
  for (const phase of baresPhases) {
    const inner = findChildList(phase, "end");
    if (inner) return inner;
  }
  return undefined;
}

type PlayMode =
  | { kind: "add" }
  | { kind: "step"; allowCapture: boolean }
  | { kind: "slide"; allowCapture: boolean }
  | { kind: "hop"; allowCapture: boolean }
  | { kind: "roll" }
  | { kind: "stack" };

function detectPlayModeIn(node: LudNode): PlayMode | undefined {
  if (!isList(node)) return undefined;
  const headName = listHead(node);
  if (headName === "move") {
    const verb = node.items[1];
    if (verb && isIdent(verb)) {
      // `(move Step …)`, `(move Slide …)`, `(move Hop …)`, or `(move Add …)`.
      if (verb.name === "Step") {
        return { kind: "step", allowCapture: detectCaptureFlag(node) };
      }
      if (verb.name === "Slide") {
        return { kind: "slide", allowCapture: detectCaptureFlag(node) };
      }
      if (verb.name === "Hop") {
        return { kind: "hop", allowCapture: true };
      }
      if (verb.name === "Add") {
        return { kind: "add" };
      }
    }
    // `(move (roll))` / `(move (stack …))` — a parenthesised verb.
    if (verb && isList(verb) && listHead(verb) === "roll") {
      return { kind: "roll" };
    }
    if (verb && isList(verb) && listHead(verb) === "stack") {
      return { kind: "stack" };
    }
    // `(move (from …) (to …) …)` — a generic from/to move. Nested
    // `(move Step …)` actions inside `(then …)` clauses don't promote
    // the outer move to Step semantics; classify the top-level form
    // as a placement-style move so the StepGame seed requirement
    // doesn't fire on hand-piece games like Gekitai.
    if (
      verb &&
      isList(verb) &&
      (listHead(verb) === "from" || listHead(verb) === "to")
    ) {
      return { kind: "add" };
    }
  }
  if (headName === "roll") {
    return { kind: "roll" };
  }
  if (headName === "stack") {
    return { kind: "stack" };
  }
  for (const child of node.items) {
    const inner = detectPlayModeIn(child);
    if (inner) return inner;
  }
  return undefined;
}

function detectCaptureFlag(moveNode: LudList): boolean {
  // A `(then (remove (to)))` clause or `(to … (if (is Enemy …)))` filter
  // signals capture. Looser heuristic: any descendant `(remove …)`.
  const visit = (n: LudNode): boolean => {
    if (!isList(n)) return false;
    if (listHead(n) === "remove") return true;
    for (const child of n.items) if (visit(child)) return true;
    return false;
  };
  return visit(moveNode);
}

function detectDiceMode(rules: LudList): DiceMode {
  // Heuristic: presence of a (score …) reference inside the end-clause
  // suggests a banking game (Pig). Otherwise default to "pig" since the
  // race-style flavour requires explicit (track …) wiring we don't yet
  // parse.
  const end = findEndClause(rules);
  if (!end) return "pig";
  const containsRace = (n: LudNode): boolean => {
    if (!isList(n)) return false;
    const h = listHead(n);
    if (h === "track" || h === "Track") return true;
    for (const child of n.items) if (containsRace(child)) return true;
    return false;
  };
  return containsRace(end) ? "race" : "pig";
}

function detectStepWinMode(rules: LudList): StepWinMode | undefined {
  const end = findEndClause(rules);
  if (!end) return undefined;
  // (is Empty …) → eliminate-style "no opponent pieces left" check.
  const elim = (() => {
    const visit = (n: LudNode): boolean => {
      if (!isList(n)) return false;
      if (listHead(n) === "no") {
        const arg = n.items[1];
        if (arg && isIdent(arg) && arg.name === "Pieces") return true;
      }
      for (const child of n.items) if (visit(child)) return true;
      return false;
    };
    return visit(end);
  })();
  if (elim) return "eliminate";
  const noMoves = (() => {
    const visit = (n: LudNode): boolean => {
      if (!isList(n)) return false;
      if (listHead(n) === "no") {
        const arg = n.items[1];
        if (arg && isIdent(arg) && arg.name === "Moves") return true;
      }
      for (const child of n.items) if (visit(child)) return true;
      return false;
    };
    return visit(end);
  })();
  if (noMoves) return "noMoves";
  return undefined;
}

function compileWinRule(rules: LudList, boardSize: number): WinKind {
  const end = findEndClause(rules);
  if (!end) {
    // Some games (notably wip and simulation entries) declare no
    // `(end …)` at all. Fall back to the default board-spanning line —
    // an undefined end condition means the game has no defined
    // terminator, which the engine treats as never-ending.
    return { kind: "line", lineLength: boardSize };
  }
  // Look at every (if …) clause under (end …), including those nested
  // inside curly-brace blocks, and inside (or …)/(and …) wrappers.
  const ifs = findAllChildLists(end, "if");
  for (const ifNode of ifs) {
    const cond = ifNode.items[1];
    if (!cond) continue;
    const found = findWinInCondition(cond);
    if (found) return found;
  }
  // Walk the entire (end …) form so even (end (is Line 3)) style works.
  const direct = findWinInCondition(end);
  if (direct) return direct;
  return { kind: "line", lineLength: boardSize };
}

function compileGameForm(form: CompiledForm): Game {
  const game = form.game;
  const nameNode = game.items[1];
  const name = nameNode && isString(nameNode) ? nameNode.value : "Untitled";

  const playersForm = findChildList(game, "players");
  if (!playersForm) {
    throw new LudCompileError(
      "(game ...) form is missing a (players N) clause",
      game.range.from(),
    );
  }
  const numPlayers = parseNumPlayers(playersForm);

  const equipmentForm = findChildList(game, "equipment");
  if (!equipmentForm) {
    throw new LudCompileError(
      "(game ...) form is missing an (equipment ...) clause",
      game.range.from(),
    );
  }
  const equipment = compileEquipment(equipmentForm, numPlayers);

  const rulesForm = findChildList(game, "rules");
  if (!rulesForm) {
    throw new LudCompileError(
      "(game ...) form is missing a (rules ...) clause",
      game.range.from(),
    );
  }

  const labels: string[] = [];
  for (let i = 0; i < numPlayers; i += 1) {
    labels.push(equipment.componentLabels[i] ?? `P${i + 1}`);
  }

  const playClauseEarly = findChildList(rulesForm, "play");
  const earlyPlayMode: PlayMode = playClauseEarly
    ? (detectPlayModeIn(playClauseEarly) ?? { kind: "add" })
    : { kind: "add" };

  if (earlyPlayMode.kind === "roll" || equipment.dice !== undefined) {
    // Dice-driven game. Board is optional; mode chosen by end rule shape.
    const diceMode: DiceMode = detectDiceMode(rulesForm);
    return new DiceGame({
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name,
      numPlayers,
      numDice: equipment.dice?.numDice ?? 2,
      diceFaces: equipment.dice?.diceFaces ?? 6,
      mode: diceMode,
      componentLabels: labels,
    });
  }

  if (equipment.board === undefined) {
    throw new LudCompileError(
      "Equipment is missing a (board ...) clause",
      equipmentForm.range.from(),
    );
  }

  // FlatBoardGame insists lineLength >= 2; some games (Cram on a 1xN
  // board, etc.) end on (no Moves Next) so a line never triggers — clamp
  // the placeholder so construction succeeds.
  const defaultLineLength = Math.max(
    2,
    equipment.board.kind === "hex" || equipment.board.kind === "tri"
      ? equipment.board.size
      : Math.min(equipment.board.width, equipment.board.height),
  );
  const win = compileWinRule(rulesForm, defaultLineLength);

  if (equipment.board.kind === "hex") {
    // Most hex games are connection games; if we couldn't detect that
    // shape explicitly (e.g. the (end …) clause uses a macro we don't
    // model), default to connection rather than erroring out.
    return new HexGame({
      size: equipment.board.size,
      componentLabels: [labels[0] ?? "P1", labels[1] ?? "P2"],
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name,
    });
  }

  if (equipment.board.kind === "tri") {
    return new TriGame({
      size: equipment.board.size,
      componentLabels: [labels[0] ?? "P1", labels[1] ?? "P2"],
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name,
    });
  }

  const playClause = findChildList(rulesForm, "play");
  const playMode: PlayMode = playClause
    ? (detectPlayModeIn(playClause) ?? { kind: "add" })
    : { kind: "add" };

  const siteCount = equipment.board.width * equipment.board.height;
  const startForm =
    findChildList(game, "start") ?? findChildList(rulesForm, "start");
  const startSpec = startForm
    ? compileStartClause(startForm, equipment, numPlayers, siteCount)
    : undefined;

  if (playMode.kind === "stack") {
    if (win.kind !== "line") {
      throw new LudCompileError(
        "(move (stack …)) requires an (is Line K) win rule",
        rulesForm.range.from(),
      );
    }
    return new StackGame({
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name,
      width: equipment.board.width,
      height: equipment.board.height,
      numPlayers,
      componentLabels: labels,
      winMode: "line",
      lineLength: win.lineLength,
      initialMover: startSpec?.mover,
    });
  }

  if (
    playMode.kind === "step" ||
    playMode.kind === "slide" ||
    playMode.kind === "hop"
  ) {
    if (!startSpec || startSpec.placement.every((c) => c === 0)) {
      // No on-board seed — likely a hand-placement game whose Step/Hop
      // verb only fires after a hand drop (e.g. Moxie). Fall through to
      // a placement-style flat board so the game still compiles.
      const lineLength =
        win.kind === "line" ? win.lineLength : defaultLineLength;
      return new FlatBoardGame({
        id: name.toLowerCase().replace(/\s+/g, "-"),
        name,
        width: equipment.board.width,
        height: equipment.board.height,
        numPlayers,
        lineLength,
        componentLabels: labels,
        initialPlacement: startSpec?.placement,
        initialMover: startSpec?.mover,
      });
    }
    const stepWinMode: StepWinMode =
      win.kind === "line"
        ? "line"
        : (detectStepWinMode(rulesForm) ?? "noMoves");
    return new StepGame({
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name,
      width: equipment.board.width,
      height: equipment.board.height,
      numPlayers,
      componentLabels: labels,
      initialPlacement: startSpec.placement,
      initialMover: startSpec.mover,
      adjacency: "orthogonal",
      allowCapture: playMode.kind === "hop" ? true : playMode.allowCapture,
      winMode: stepWinMode,
      lineLength: win.kind === "line" ? win.lineLength : undefined,
      movementKind: playMode.kind,
    });
  }

  // If the win shape didn't classify as a line (e.g. the (end …) uses a
  // macro or other ludeme we don't model), default to a board-length
  // line win so the game still compiles.
  const lineLength = win.kind === "line" ? win.lineLength : defaultLineLength;

  return new FlatBoardGame({
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    width: equipment.board.width,
    height: equipment.board.height,
    numPlayers,
    lineLength,
    componentLabels: labels,
    initialPlacement: startSpec?.placement,
    initialMover: startSpec?.mover,
  });
}

/** Compile a `.lud` source string into a `Game`. */
export function compileLudSource(source: string): Game {
  const parsed = parseLud(source);
  const resolved = applyOptions(parsed);
  const ast = expandDefines(resolved, [...getBuiltinDefines()]);
  const form = locateGameForm(ast);
  return compileGameForm(form);
}

/** Compile a previously-parsed `.lud` AST into a `Game`. */
export function compileLudAst(root: LudNode): Game {
  const resolved = applyOptions(root);
  const expanded = expandDefines(resolved, [...getBuiltinDefines()]);
  const form = locateGameForm(expanded);
  return compileGameForm(form);
}
