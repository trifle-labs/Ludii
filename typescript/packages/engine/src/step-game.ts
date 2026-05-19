/**
 * Java parity: a focused TS port of the "place pieces, then move them
 * around the board" family of games — equivalent to the Java Game class
 * configured with `(move Step (from Mover) (to (sites Empty)))` and an
 * initial `(start (place ...))` setup.
 *
 * StepGame supports two adjacency modes (orthogonal vs all-8) and two
 * end conditions in addition to the line-in-K win:
 *   - "noMoves" — the mover with no legal step loses
 *   - "eliminate" — capture all enemy pieces wins (when allowCapture)
 *
 * When `allowCapture` is true, stepping onto an enemy cell removes the
 * enemy piece (no chain capture — that's HopGame's job).
 */

import { ActionMove, ActionRemove } from "./action/index.js";
import { ConceptSet } from "./concept.js";
import { Context } from "./context.js";
import type { Game } from "./game.js";
import { Move } from "./move.js";
import { State } from "./state.js";
import { Trial } from "./trial.js";

export type StepAdjacency = "orthogonal" | "all8";

export type StepWinMode = "line" | "noMoves" | "eliminate";

/**
 * - "step" — one cell in an adjacency direction.
 * - "slide" — any positive distance along a direction, blocked by the
 *   first occupied cell (which becomes the target if `allowCapture` is
 *   on and that cell holds an enemy).
 * - "hop" — jump over an adjacent enemy onto the empty cell two away,
 *   removing the jumped piece. `allowCapture` is forced true.
 */
export type MovementKind = "step" | "slide" | "hop";

export interface StepGameOptions {
  readonly id: string;
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly numPlayers: number;
  /** Required initial placement; per-site owner (0 = empty). */
  readonly initialPlacement: readonly number[];
  readonly initialMover?: number;
  readonly componentLabels?: readonly string[];
  readonly adjacency?: StepAdjacency;
  readonly allowCapture?: boolean;
  readonly winMode?: StepWinMode;
  /** Line length for "line" win mode. Defaults to min(width, height). */
  readonly lineLength?: number;
  readonly movementKind?: MovementKind;
}

const DEFAULT_COMPONENT_LABELS = ["X", "O", "△", "□", "◇", "★", "●", "■"];

const ORTHOGONAL: readonly [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

const ALL8: readonly [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

function nextMover(mover: number, numPlayers: number): number {
  return (mover % numPlayers) + 1;
}

function hasLine(
  cells: readonly number[],
  width: number,
  height: number,
  lineLength: number,
  owner: number,
  lastSite: number,
): boolean {
  if (owner === 0) return false;
  const lx = lastSite % width;
  const ly = Math.floor(lastSite / width);
  const dirs: readonly [number, number][] = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ];
  for (const [dx, dy] of dirs) {
    let count = 1;
    for (let s = 1; s < lineLength; s += 1) {
      const x = lx + dx * s;
      const y = ly + dy * s;
      if (x < 0 || x >= width || y < 0 || y >= height) break;
      if ((cells[y * width + x] ?? 0) !== owner) break;
      count += 1;
    }
    for (let s = 1; s < lineLength; s += 1) {
      const x = lx - dx * s;
      const y = ly - dy * s;
      if (x < 0 || x >= width || y < 0 || y >= height) break;
      if ((cells[y * width + x] ?? 0) !== owner) break;
      count += 1;
    }
    if (count >= lineLength) return true;
  }
  return false;
}

export class StepGame implements Game {
  public readonly id: string;
  public readonly name: string;
  public readonly numPlayers: number;
  public readonly width: number;
  public readonly height: number;
  public readonly componentLabels: readonly string[];
  public readonly adjacency: StepAdjacency;
  public readonly allowCapture: boolean;
  public readonly winMode: StepWinMode;
  public readonly lineLength: number;
  public readonly movementKind: MovementKind;
  private readonly initialPlacement: readonly number[];
  private readonly initialMover: number;

  public get numSites(): number {
    return this.width * this.height;
  }
  public get siteCount(): number {
    return this.width * this.height;
  }

  public constructor(options: StepGameOptions) {
    if (!Number.isInteger(options.width) || options.width <= 0) {
      throw new Error(
        `width must be a positive integer; got ${options.width}.`,
      );
    }
    if (!Number.isInteger(options.height) || options.height <= 0) {
      throw new Error(
        `height must be a positive integer; got ${options.height}.`,
      );
    }
    if (!Number.isInteger(options.numPlayers) || options.numPlayers < 1) {
      throw new Error(
        `numPlayers must be a positive integer; got ${options.numPlayers}.`,
      );
    }
    const siteCount = options.width * options.height;
    if (options.initialPlacement.length !== siteCount) {
      throw new Error(
        `initialPlacement must have ${siteCount} entries; got ${options.initialPlacement.length}.`,
      );
    }
    this.id = options.id;
    this.name = options.name;
    this.width = options.width;
    this.height = options.height;
    this.numPlayers = options.numPlayers;
    this.adjacency = options.adjacency ?? "orthogonal";
    this.allowCapture = options.allowCapture ?? false;
    this.winMode = options.winMode ?? "noMoves";
    this.movementKind = options.movementKind ?? "step";
    this.lineLength =
      options.lineLength ?? Math.min(options.width, options.height);
    const labels =
      options.componentLabels ??
      DEFAULT_COMPONENT_LABELS.slice(0, options.numPlayers);
    if (labels.length < options.numPlayers) {
      throw new Error(
        `componentLabels needs ${options.numPlayers} entries; got ${labels.length}.`,
      );
    }
    this.componentLabels = Object.freeze([...labels]);
    this.initialPlacement = Object.freeze([...options.initialPlacement]);
    const mover = options.initialMover ?? 1;
    if (!Number.isInteger(mover) || mover < 1 || mover > this.numPlayers) {
      throw new Error(
        `initialMover must be 1..${this.numPlayers}; got ${mover}.`,
      );
    }
    this.initialMover = mover;
  }

  public start(): Context {
    const cells = [...this.initialPlacement];
    const state = new State(this.initialMover, cells, this.componentLabels);
    const trial = new Trial([], false, -1).saveState(state);
    return new Context(this, state, trial);
  }

  public moves(context: Context): readonly Move[] {
    if (context.over) return [];
    const out: Move[] = [];
    const mover = context.state.mover;
    const label = this.componentLabels[mover - 1] ?? `P${mover}`;
    const offsets = this.adjacency === "all8" ? ALL8 : ORTHOGONAL;
    for (let from = 0; from < this.siteCount; from += 1) {
      if (context.state.cells[from] !== mover) continue;
      const fx = from % this.width;
      const fy = Math.floor(from / this.width);
      if (this.movementKind === "hop") {
        for (const [dx, dy] of offsets) {
          const mx = fx + dx;
          const my = fy + dy;
          if (mx < 0 || mx >= this.width || my < 0 || my >= this.height)
            continue;
          const mid = my * this.width + mx;
          const midOwner = context.state.cells[mid] ?? 0;
          if (midOwner === 0 || midOwner === mover) continue;
          const tx = fx + 2 * dx;
          const ty = fy + 2 * dy;
          if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height)
            continue;
          const to = ty * this.width + tx;
          if ((context.state.cells[to] ?? 0) !== 0) continue;
          out.push(
            new Move({
              id: `m${context.trial.numMoves}:${from}=>${to}:${mover}`,
              label: `Hop ${label} ${from}⇒${to} (capture ${mid})`,
              siteIndices: [from, to],
              mover,
              placedOwner: mover,
              actions: [
                new ActionRemove({ to: mid }),
                new ActionMove({ from, to }),
              ],
            }),
          );
        }
        continue;
      }
      for (const [dx, dy] of offsets) {
        let tx = fx + dx;
        let ty = fy + dy;
        while (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
          const to = ty * this.width + tx;
          const occ = context.state.cells[to] ?? 0;
          if (occ === mover) break;
          if (occ === 0 || this.allowCapture) {
            out.push(
              new Move({
                id: `m${context.trial.numMoves}:${from}->${to}:${mover}`,
                label: `${this.movementKind === "slide" ? "Slide" : "Step"} ${label} ${from}→${to}`,
                siteIndices: [from, to],
                mover,
                placedOwner: mover,
                actions: [new ActionMove({ from, to })],
              }),
            );
            // A capture stops the slide.
            if (occ !== 0) break;
          } else {
            break;
          }
          if (this.movementKind === "step") break;
          tx += dx;
          ty += dy;
        }
      }
    }
    return out;
  }

  public apply(context: Context, move: Move): Context {
    if (context.over) {
      throw new Error("Cannot apply a move to a terminal trial.");
    }
    if (move.mover !== context.state.mover) {
      throw new Error(
        `Move mover (${move.mover}) does not match state mover (${context.state.mover}).`,
      );
    }
    const placed = move.applyTo(context.state);
    const to = move.siteIndices[1] ?? move.siteIndices[0] ?? -1;

    let winner = -1;
    if (this.winMode === "line") {
      if (
        to >= 0 &&
        hasLine(
          placed.cells,
          this.width,
          this.height,
          this.lineLength,
          move.placedOwner,
          to,
        )
      ) {
        winner = move.placedOwner;
      }
    } else if (this.winMode === "eliminate") {
      const opponentsLeft = placed.cells.some(
        (c) => c !== 0 && c !== move.placedOwner,
      );
      if (!opponentsLeft) winner = move.placedOwner;
    }

    // Switch mover, then test "noMoves" loss.
    const tentativeMover = nextMover(placed.mover, this.numPlayers);
    const advanced = placed.withMover(tentativeMover);
    let finalWinner = winner;
    let over = winner !== -1;
    if (!over && this.winMode === "noMoves") {
      const probeCtx = new Context(this, advanced, context.trial);
      if (this.moves(probeCtx).length === 0) {
        // Next mover has no moves → previous mover wins.
        finalWinner = move.placedOwner;
        over = true;
      }
    }
    if (!over && this.winMode === "line") {
      const allFilled = advanced.cells.every((c) => c !== 0);
      if (allFilled) {
        const probeCtx = new Context(this, advanced, context.trial);
        if (this.moves(probeCtx).length === 0) {
          over = true;
          finalWinner = 0;
        }
      }
    }

    const finalState = over ? placed : advanced;
    const trial = context.trial
      .withMove(move, over, finalWinner)
      .saveState(finalState);
    return new Context(this, finalState, trial);
  }

  public over(context: Context): boolean {
    return context.over;
  }

  public concepts(context?: Context): ConceptSet {
    let set = ConceptSet.of(
      "AlternatingTurns",
      "PieceOwnership",
      "DeterministicPlayout",
    );
    if (this.winMode === "line") set = set.union(ConceptSet.of("LineWin"));
    if (context) {
      for (const move of this.moves(context)) {
        set = set.union(move.concepts());
      }
    }
    return set;
  }
}
