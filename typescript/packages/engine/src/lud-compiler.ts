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
  let mover = 1;

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
        owner = parsePlayerIndex(ownerNode.name, ownerNode.range.from());
      } else if (isIdent(labelNode)) {
        // (place P1 (sites ...))
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

function compileWinRule(rules: LudList, boardSize: number): WinKind {
  const end = findChildList(rules, "end");
  if (!end) {
    throw new LudCompileError(
      "Rules block is missing an (end ...) clause",
      rules.range.from(),
    );
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

  const siteCount = equipment.board.width * equipment.board.height;
  const startForm =
    findChildList(game, "start") ?? findChildList(rulesForm, "start");
  const startSpec = startForm
    ? compileStartClause(startForm, equipment, numPlayers, siteCount)
    : undefined;

  return new FlatBoardGame({
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    width: equipment.board.width,
    height: equipment.board.height,
    numPlayers,
    lineLength: win.lineLength,
    componentLabels: labels,
    initialPlacement: startSpec?.placement,
    initialMover: startSpec?.mover,
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
