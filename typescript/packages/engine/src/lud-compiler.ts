/**
 * Minimal `.lud` → engine compiler.
 *
 * Walks an AST produced by `@ludii/typescript-language`'s parser and
 * constructs a concrete `FlatBoardGame`. Only the syntactic subset
 * needed by the tic-tac-toe-shaped `.lud` files in
 * `Common/res/lud/test/` is supported. Anything outside that subset
 * raises a `LudCompileError` so the failure mode is loud.
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
    if (isList(item) && listHead(item) === name) {
      out.push(item);
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
  // The top-level can be either a single (game ...) form or a wrapper
  // list produced by parseLud when there are multiple top-level forms
  // (e.g. game + metadata).
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

function compileEquipment(equipment: LudList): {
  width: number;
  height: number;
  componentLabels: string[];
} {
  // (equipment { (board (square N)) (piece "X" P1) ... })
  // The Java parser accepts either a parens list or a curly list of
  // entries. We accept both: skip the head, then iterate either nested
  // curly children or successive paren children.
  let body: readonly LudNode[];
  const inner = equipment.items[1];
  if (inner && isList(inner) && inner.delimiter === "curly") {
    body = inner.items;
  } else {
    body = equipment.items.slice(1);
  }

  let width = 0;
  let height = 0;
  const labels: string[] = [];

  for (const entry of body) {
    if (!isList(entry)) {
      continue;
    }
    const headName = listHead(entry);
    if (headName === "board") {
      // (board (square N))
      const inner2 = asList(entry.items[1], "board shape");
      const shapeName = head(inner2);
      if (shapeName !== "square") {
        throw new LudCompileError(
          `Unsupported board shape "${shapeName}"; only "square" is supported`,
          inner2.range.from(),
        );
      }
      const size = expectInt(inner2.items[1], "square size");
      width = size;
      height = size;
    } else if (headName === "piece") {
      // (piece "Disc" P1)
      const name = expectString(entry.items[1], "piece name");
      const playerIdent = expectIdent(entry.items[2], "piece owner");
      const idx = parsePlayerIndex(playerIdent, entry.items[2]?.range.from());
      while (labels.length < idx) {
        labels.push("");
      }
      labels[idx - 1] = name;
    } else {
      // Unsupported equipment entry — silently ignore for now so that
      // metadata-style entries don't trip the compiler. Could be made
      // stricter later.
    }
  }

  if (width === 0 || height === 0) {
    throw new LudCompileError(
      "Equipment is missing a (board (square N)) clause",
      equipment.range.from(),
    );
  }

  return { width, height, componentLabels: labels };
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

function compileRules(rules: LudList, boardSize: number): number {
  // Look for (end (if (is Line K) (result Mover Win))) and extract K.
  const end = findChildList(rules, "end");
  if (!end) {
    throw new LudCompileError(
      "Rules block is missing an (end ...) clause",
      rules.range.from(),
    );
  }
  const ifs = findAllChildLists(end, "if");
  for (const ifNode of ifs) {
    const cond = ifNode.items[1];
    if (cond && isList(cond) && listHead(cond) === "is") {
      const what = expectIdent(cond.items[1], "is condition kind");
      if (what !== "Line") {
        continue;
      }
      const k = expectInt(cond.items[2], "line length K");
      return k;
    }
  }
  // Default to the full board size if no explicit line length found,
  // matching the rule "you win by lining the whole row".
  return boardSize;
}

function compileGameForm(form: CompiledForm): FlatBoardGame {
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
  const equipment = compileEquipment(equipmentForm);

  const rulesForm = findChildList(game, "rules");
  if (!rulesForm) {
    throw new LudCompileError(
      "(game ...) form is missing a (rules ...) clause",
      game.range.from(),
    );
  }
  const lineLength = compileRules(rulesForm, equipment.width);

  const labels: string[] = [];
  for (let i = 0; i < numPlayers; i += 1) {
    labels.push(equipment.componentLabels[i] ?? `P${i + 1}`);
  }

  return new FlatBoardGame({
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    width: equipment.width,
    height: equipment.height,
    numPlayers,
    lineLength,
    componentLabels: labels,
  });
}

/** Compile a `.lud` source string into a `FlatBoardGame`. */
export function compileLudSource(source: string): FlatBoardGame {
  const ast = parseLud(source);
  const form = locateGameForm(ast);
  return compileGameForm(form);
}

/** Compile a previously-parsed `.lud` AST into a `FlatBoardGame`. */
export function compileLudAst(root: LudNode): FlatBoardGame {
  const form = locateGameForm(root);
  return compileGameForm(form);
}
