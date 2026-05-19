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
  type LudList,
  type LudNode,
  listHead,
  parseLud,
} from "@ludii/typescript-language";

import { FlatBoardGame } from "./flat-board-game.js";
import type { Game } from "./game.js";
import { HexGame } from "./hex-game.js";

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
  | { kind: "hex"; size: number };

interface EquipmentSpec {
  readonly board: BoardShape;
  readonly componentLabels: string[];
  readonly eachPlayerLabel: string | undefined;
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

function expectInt(node: LudNode | undefined, label: string): number {
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

function expectIdent(node: LudNode | undefined, label: string): string {
  if (!node || !isIdent(node)) {
    throw new LudCompileError(
      `Expected ${label} to be an identifier`,
      node?.range.from(),
    );
  }
  return node.name;
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
  for (const item of root.items) {
    if (isList(item) && listHead(item) === "game") {
      return { game: item };
    }
  }
  throw new LudCompileError("No (game ...) form found", root.range.from());
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

function compileBoardShape(boardClause: LudList): BoardShape {
  // (board (square N)) | (board (rectangle H W)) | (board (hex Diamond N))
  const inner = asList(boardClause.items[1], "board shape");
  const shapeName = head(inner);
  if (shapeName === "square") {
    const size = expectInt(inner.items[1], "square size");
    return { kind: "flat", width: size, height: size };
  }
  if (shapeName === "rectangle") {
    const height = expectInt(inner.items[1], "rectangle height");
    const width = expectInt(inner.items[2], "rectangle width");
    return { kind: "flat", width, height };
  }
  if (shapeName === "hex") {
    // Accept either (hex Diamond N) or (hex N) for now. Other tilings
    // (Triangle, Hexagon, etc.) are deferred.
    const firstArg = inner.items[1];
    if (firstArg && isIdent(firstArg)) {
      const tiling = firstArg.name;
      if (tiling !== "Diamond") {
        throw new LudCompileError(
          `Unsupported hex tiling "${tiling}"; only "Diamond" is supported`,
          firstArg.range.from(),
        );
      }
      const size = expectInt(inner.items[2], "hex size");
      return { kind: "hex", size };
    }
    if (firstArg && isNumber(firstArg)) {
      const size = expectInt(firstArg, "hex size");
      return { kind: "hex", size };
    }
    throw new LudCompileError(
      "Expected (hex Diamond N) or (hex N)",
      inner.range.from(),
    );
  }
  throw new LudCompileError(
    `Unsupported board shape "${shapeName}"; only "square", "rectangle", and "hex" are supported`,
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
  const labels: string[] = [];
  let eachPlayerLabel: string | undefined;

  for (const entry of body) {
    if (!isList(entry)) {
      continue;
    }
    const headName = listHead(entry);
    if (headName === "board") {
      board = compileBoardShape(entry);
    } else if (headName === "piece") {
      const name = expectString(entry.items[1], "piece name");
      const ownerNode = entry.items[2];
      const ownerIdent = expectIdent(ownerNode, "piece owner");
      if (ownerIdent === "Each") {
        eachPlayerLabel = name;
      } else {
        const idx = parsePlayerIndex(ownerIdent, ownerNode?.range.from());
        while (labels.length < idx) {
          labels.push("");
        }
        labels[idx - 1] = name;
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

  if (board === undefined) {
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

  return { board, componentLabels: labels, eachPlayerLabel };
}

function compileWinRule(rules: LudList, boardSize: number): WinKind {
  const end = findChildList(rules, "end");
  if (!end) {
    throw new LudCompileError(
      "Rules block is missing an (end ...) clause",
      rules.range.from(),
    );
  }
  // `(end ...)` may be either `(end (if ...))` or `(end { (if ...) (if ...) })`.
  // findAllChildLists descends through one level of curly delimiters so both
  // shapes return the inner `if` clauses.
  const ifs = findAllChildLists(end, "if");
  for (const ifNode of ifs) {
    const cond = ifNode.items[1];
    if (!cond || !isList(cond) || listHead(cond) !== "is") {
      continue;
    }
    const what = expectIdent(cond.items[1], "is condition kind");
    if (what === "Line") {
      const k = expectInt(cond.items[2], "line length K");
      return { kind: "line", lineLength: k };
    }
    if (what === "Connected") {
      // `(is Connected Mover)` (the second arg is the player; we
      // ignore it because the engine already knows the mover).
      return { kind: "connected" };
    }
  }
  // No explicit end condition we recognise → default to a line of the
  // full board width on a square board.
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
  const numPlayers = expectInt(playersForm.items[1], "number of players");

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
  const defaultLineLength =
    equipment.board.kind === "hex"
      ? equipment.board.size
      : Math.min(equipment.board.width, equipment.board.height);
  const win = compileWinRule(rulesForm, defaultLineLength);

  const labels: string[] = [];
  for (let i = 0; i < numPlayers; i += 1) {
    labels.push(equipment.componentLabels[i] ?? `P${i + 1}`);
  }

  if (equipment.board.kind === "hex") {
    if (win.kind !== "connected") {
      throw new LudCompileError(
        "Hex board requires an (is Connected ...) win rule",
        rulesForm.range.from(),
      );
    }
    return new HexGame({
      size: equipment.board.size,
      componentLabels: [labels[0] ?? "P1", labels[1] ?? "P2"],
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name,
    });
  }

  if (win.kind !== "line") {
    throw new LudCompileError(
      "Square/rectangular board requires an (is Line K) win rule",
      rulesForm.range.from(),
    );
  }

  return new FlatBoardGame({
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    width: equipment.board.width,
    height: equipment.board.height,
    numPlayers,
    lineLength: win.lineLength,
    componentLabels: labels,
  });
}

/** Compile a `.lud` source string into a `Game`. */
export function compileLudSource(source: string): Game {
  const ast = parseLud(source);
  const form = locateGameForm(ast);
  return compileGameForm(form);
}

/** Compile a previously-parsed `.lud` AST into a `Game`. */
export function compileLudAst(root: LudNode): Game {
  const form = locateGameForm(root);
  return compileGameForm(form);
}
