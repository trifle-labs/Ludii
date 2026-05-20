/**
 * LudemeGame — a `Game` that plays a `.lud` definition by *interpreting*
 * its ludeme tree, rather than pattern-matching it onto a hand-rolled
 * template (FlatBoardGame etc.).
 *
 * Java parity:
 * - Core/src/game/Game.java — the real engine instantiates a tree of
 *   ludeme objects and calls `start`/`moves`/`apply`/`over`. This is the
 *   TS analogue: the `(play …)` clause compiles to a move generator and
 *   the `(end …)` clause to a set of ending rules, both evaluated against
 *   the live state via `EvalContext`.
 *
 * The constructor takes a *define-expanded, option-applied* `(game …)`
 * AST node — i.e. the output of `parseLud → applyOptions → expandDefines`.
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
import { getBuiltinDefines } from "../builtin-defines.js";
import { Context } from "../context.js";
import type { Game } from "../game.js";
import { expandDefines } from "../lud-defines.js";
import { applyOptions } from "../lud-options.js";
import type { Move } from "../move.js";
import { State } from "../state.js";
import { Trial } from "../trial.js";
import { type CompileEnv, compileEnd, compileMoves } from "./compile.js";
import {
  type EndRule,
  EvalContext,
  InterpBoard,
  type MovesFn,
} from "./eval-context.js";

function child(node: LudList, head: string): LudList | undefined {
  for (const item of node.items) {
    if (isList(item) && listHead(item) === head) return item;
  }
  return undefined;
}

/** Find a child list by head, descending through curly groups. */
function childDeep(node: LudList, head: string): LudList | undefined {
  for (const item of node.items) {
    if (!isList(item)) continue;
    if (listHead(item) === head) return item;
    if (item.delimiter === "curly") {
      const inner = childDeep(item, head);
      if (inner) return inner;
    }
  }
  return undefined;
}

interface ParsedGame {
  readonly name: string;
  readonly numPlayers: number;
  readonly board: InterpBoard;
  readonly componentLabels: readonly string[];
  readonly pieceOwner: ReadonlyMap<string, number>;
}

function parseBoardDims(equipment: LudList): { width: number; height: number } {
  const board = childDeep(equipment, "board");
  if (!board) throw new Error("LudemeGame: equipment has no (board …).");
  const shape = board.items[1];
  if (!shape || !isList(shape)) {
    throw new Error("LudemeGame: unsupported board shape.");
  }
  const head = listHead(shape);
  const a = shape.items[1];
  const b = shape.items[2];
  const n1 = a && isNumber(a) ? a.value : Number.NaN;
  if (head === "square") {
    return { width: n1, height: n1 };
  }
  if (head === "rectangle") {
    // Java: (rectangle rows columns) — rows = height, columns = width.
    const n2 = b && isNumber(b) ? b.value : n1;
    return { width: n2, height: n1 };
  }
  throw new Error(`LudemeGame: unsupported board tiling "${head}".`);
}

function parsePieces(
  equipment: LudList,
  numPlayers: number,
): { labels: string[]; owner: Map<string, number> } {
  const owner = new Map<string, number>();
  const byPlayer = new Map<number, string>();
  for (const item of equipment.items) {
    let pieceNode: LudList | undefined;
    if (isList(item) && listHead(item) === "piece") pieceNode = item;
    else if (isList(item) && item.delimiter === "curly") {
      // equipment wrapped in a curly list of entries
      for (const inner of item.items) {
        if (isList(inner) && listHead(inner) === "piece") {
          collectPiece(inner, owner, byPlayer, numPlayers);
        }
      }
      continue;
    }
    if (pieceNode) collectPiece(pieceNode, owner, byPlayer, numPlayers);
  }
  const labels: string[] = [];
  for (let p = 1; p <= numPlayers; p += 1) {
    labels.push(byPlayer.get(p) ?? `P${p}`);
  }
  return { labels, owner };
}

function collectPiece(
  pieceNode: LudList,
  owner: Map<string, number>,
  byPlayer: Map<number, string>,
  numPlayers: number,
): void {
  const labelNode = pieceNode.items[1];
  if (!labelNode || !isString(labelNode)) return;
  const label = labelNode.value;
  const roleNode = pieceNode.items[2];
  if (roleNode && isIdent(roleNode)) {
    const role = roleNode.name;
    if (role === "Each") {
      for (let p = 1; p <= numPlayers; p += 1) {
        owner.set(`${label}${p}`, p);
        if (!byPlayer.has(p)) byPlayer.set(p, label);
      }
      return;
    }
    const m = /^P(\d+)$/.exec(role);
    if (m?.[1]) {
      const p = Number(m[1]);
      owner.set(label, p);
      if (!byPlayer.has(p)) byPlayer.set(p, label);
    }
  }
}

function parseGame(gameNode: LudList): ParsedGame {
  if (listHead(gameNode) !== "game") {
    throw new Error("LudemeGame: root node must be (game …).");
  }
  const playersNode = child(gameNode, "players");
  let numPlayers = 2;
  if (playersNode) {
    const arg = playersNode.items[1];
    if (arg && isNumber(arg)) numPlayers = arg.value;
  }
  const equipment = child(gameNode, "equipment");
  if (!equipment) throw new Error("LudemeGame: game has no (equipment …).");
  const dims = parseBoardDims(equipment);
  const board = new InterpBoard(dims.width, dims.height);
  const { labels, owner } = parsePieces(equipment, numPlayers);
  const nameNode = gameNode.items[1];
  const name = nameNode && isString(nameNode) ? nameNode.value : "Game";
  return {
    name,
    numPlayers,
    board,
    componentLabels: labels,
    pieceOwner: owner,
  };
}

export class LudemeGame implements Game {
  public readonly id: string;
  public readonly name: string;
  public readonly numPlayers: number;
  public readonly width: number;
  public readonly height: number;
  public readonly componentLabels: readonly string[];

  private readonly board: InterpBoard;
  private readonly playMoves: MovesFn;
  private readonly endRules: readonly EndRule[];

  public constructor(gameNode: LudList, id?: string) {
    const parsed = parseGame(gameNode);
    this.name = parsed.name;
    this.id = id ?? parsed.name;
    this.numPlayers = parsed.numPlayers;
    this.board = parsed.board;
    this.width = parsed.board.width;
    this.height = parsed.board.height;
    this.componentLabels = parsed.componentLabels;

    const env: CompileEnv = {
      board: parsed.board,
      numPlayers: parsed.numPlayers,
      pieceOwner: parsed.pieceOwner,
    };

    const rules = child(gameNode, "rules");
    if (!rules) throw new Error("LudemeGame: game has no (rules …).");
    const play = child(rules, "play");
    if (!play?.items[1]) {
      throw new Error("LudemeGame: rules has no (play …).");
    }
    this.playMoves = compileMoves(play.items[1] as LudNode, env);
    const end = child(rules, "end");
    this.endRules = end ? compileEnd(end, env) : [];
  }

  public get numSites(): number {
    return this.board.numSites;
  }

  public start(): Context {
    const cells = new Array<number>(this.board.numSites).fill(0);
    const state = new State(1, cells, this.componentLabels, {
      numPlayers: this.numPlayers,
    });
    const trial = new Trial([], false, -1).saveState(state);
    return new Context(this, state, trial);
  }

  public moves(context: Context): readonly Move[] {
    if (context.over) return [];
    const evalCtx = new EvalContext(context, this.board);
    return this.playMoves.generate(evalCtx);
  }

  public apply(context: Context, move: Move): Context {
    if (context.over) {
      throw new Error("Cannot apply a move to a terminal trial.");
    }
    const placed = move.applyTo(context.state);

    // Evaluate the end rules against the state *after* this move, with the
    // move recorded in a throwaway trial so `(last To)` etc. resolve.
    const evalTrial = context.trial.withMove(move, false, -1);
    const evalContext = new Context(this, placed, evalTrial, context.rng);
    const evalCtx = new EvalContext(evalContext, this.board);

    let over = false;
    let winner = 0;
    for (const rule of this.endRules) {
      const outcome = rule.eval(evalCtx);
      if (outcome) {
        over = true;
        winner = outcome.winner;
        break;
      }
    }

    let advanced = placed;
    if (!over) {
      const nextMover = (placed.mover % this.numPlayers) + 1;
      advanced = placed.withMover(nextMover);
      // No legal move for the next player → game ends as a draw (the
      // implicit Ludii terminator, e.g. a full Tic-Tac-Toe board).
      const nextCtx = new EvalContext(
        new Context(this, advanced, evalTrial, context.rng),
        this.board,
      );
      if (this.playMoves.generate(nextCtx).length === 0) {
        over = true;
        winner = 0;
        advanced = placed;
      }
    }

    const finalWinner = over ? winner : -1;
    const trial = context.trial
      .withMove(move, over, finalWinner)
      .saveState(advanced);
    return new Context(this, advanced, trial, context.rng);
  }

  public over(context: Context): boolean {
    return context.over;
  }
}

/** Locate the first `(game …)` form anywhere in a top-level AST. */
function findGameNode(root: LudNode): LudList {
  if (isList(root)) {
    if (listHead(root) === "game") return root;
    for (const item of root.items) {
      if (isList(item)) {
        if (listHead(item) === "game") return item;
        const nested = findGameNodeShallow(item);
        if (nested) return nested;
      }
    }
  }
  throw new Error("LudemeGame: no (game …) form found.");
}

function findGameNodeShallow(node: LudList): LudList | undefined {
  if (listHead(node) === "game") return node;
  for (const item of node.items) {
    if (isList(item)) {
      const found = findGameNodeShallow(item);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * Run the full pipeline (parse → applyOptions → expandDefines with the
 * builtin defines) and build a `LudemeGame` from the resulting `(game …)`.
 */
export function compileLudemeSource(source: string, id?: string): LudemeGame {
  const parsed = parseLud(source);
  const resolved = applyOptions(parsed);
  const ast = expandDefines(resolved, [...getBuiltinDefines()]);
  return new LudemeGame(findGameNode(ast), id);
}

/** Build a `LudemeGame` from an already-parsed top-level AST. */
export function compileLudemeAst(root: LudNode, id?: string): LudemeGame {
  const resolved = applyOptions(root);
  const ast = expandDefines(resolved, [...getBuiltinDefines()]);
  return new LudemeGame(findGameNode(ast), id);
}
