/**
 * Java parity: a focused TS port of the stacking-piece family — equivalent
 * to a Java Ludii game configured with
 *
 *   (equipment { (board (square N)) (piece "X" Each) })
 *   (rules
 *     (play (move (stack (to (sites Empty)))))
 *     (end (if (is Line K) (result Mover Win)))
 *
 * but generalised. A StackGame plays like a stacking placement game:
 * each turn the mover pushes a fresh piece of their colour onto a chosen
 * cell. The cell's stack grows by one; the visible "top" updates to
 * reflect the new owner.
 *
 * Two end-modes:
 *   - "line"      — first to a K-in-a-row of top-of-stack owners wins.
 *   - "stackHeight" — first to push a stack to `targetStackHeight` wins.
 *
 * The stacking mechanic exercises `State.stacks` + `ActionAdd({onStack})`.
 */

import { ActionAdd } from "./action/index.js";
import { ConceptSet } from "./concept.js";
import { Context } from "./context.js";
import type { Game } from "./game.js";
import { Move } from "./move.js";
import { State } from "./state.js";
import { Trial } from "./trial.js";

export type StackWinMode = "line" | "stackHeight";

export interface StackGameOptions {
  readonly id: string;
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly numPlayers: number;
  readonly componentLabels?: readonly string[];
  readonly winMode?: StackWinMode;
  /** For "line" mode. Defaults to min(width, height). */
  readonly lineLength?: number;
  /** For "stackHeight" mode. Defaults to 3. */
  readonly targetStackHeight?: number;
  /**
   * Optional cap on stack height. Once a stack reaches this many pieces
   * it is full and no further pushes onto it are legal. Defaults to
   * `Infinity` (no cap).
   */
  readonly maxStackHeight?: number;
  readonly initialMover?: number;
}

const DEFAULT_LABELS = ["X", "O", "△", "□", "◇", "★", "●", "■"];

function nextMover(mover: number, numPlayers: number): number {
  return (mover % numPlayers) + 1;
}

function hasTopLine(
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

export class StackGame implements Game {
  public readonly id: string;
  public readonly name: string;
  public readonly numPlayers: number;
  public readonly width: number;
  public readonly height: number;
  public readonly componentLabels: readonly string[];
  public readonly winMode: StackWinMode;
  public readonly lineLength: number;
  public readonly targetStackHeight: number;
  public readonly maxStackHeight: number;
  private readonly initialMover: number;

  public get siteCount(): number {
    return this.width * this.height;
  }
  public get numSites(): number {
    return this.width * this.height;
  }

  public constructor(options: StackGameOptions) {
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
    if (!Number.isInteger(options.numPlayers) || options.numPlayers < 2) {
      throw new Error(
        `numPlayers must be an integer >= 2; got ${options.numPlayers}.`,
      );
    }
    this.id = options.id;
    this.name = options.name;
    this.width = options.width;
    this.height = options.height;
    this.numPlayers = options.numPlayers;
    this.winMode = options.winMode ?? "line";
    this.lineLength =
      options.lineLength ?? Math.min(options.width, options.height);
    this.targetStackHeight = options.targetStackHeight ?? 3;
    this.maxStackHeight = options.maxStackHeight ?? Number.POSITIVE_INFINITY;
    const labels =
      options.componentLabels ?? DEFAULT_LABELS.slice(0, options.numPlayers);
    if (labels.length < options.numPlayers) {
      throw new Error(
        `componentLabels needs ${options.numPlayers} entries; got ${labels.length}.`,
      );
    }
    this.componentLabels = Object.freeze([...labels]);
    const mover = options.initialMover ?? 1;
    if (!Number.isInteger(mover) || mover < 1 || mover > this.numPlayers) {
      throw new Error(
        `initialMover must be 1..${this.numPlayers}; got ${mover}.`,
      );
    }
    this.initialMover = mover;
  }

  public start(): Context {
    const cells = new Array<number>(this.width * this.height).fill(0);
    const state = new State(this.initialMover, cells, this.componentLabels);
    const trial = new Trial([], false, -1).saveState(state);
    return new Context(this, state, trial);
  }

  public moves(context: Context): readonly Move[] {
    if (context.over) return [];
    const out: Move[] = [];
    const mover = context.state.mover;
    const label = this.componentLabels[mover - 1] ?? `P${mover}`;
    for (let site = 0; site < this.siteCount; site += 1) {
      const h = context.state.stackSize(site);
      if (h >= this.maxStackHeight) continue;
      out.push(
        new Move({
          id: `m${context.trial.numMoves}:push@${site}:${mover}`,
          label: `Push ${label} → ${site}`,
          siteIndices: [site],
          mover,
          placedOwner: mover,
          actions: [new ActionAdd({ to: site, what: mover, onStack: true })],
        }),
      );
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
    const to = move.siteIndices[0] ?? -1;

    let winner = -1;
    let over = false;
    if (this.winMode === "line") {
      if (
        to >= 0 &&
        hasTopLine(
          placed.cells,
          this.width,
          this.height,
          this.lineLength,
          move.placedOwner,
          to,
        )
      ) {
        winner = move.placedOwner;
        over = true;
      }
    } else {
      // stackHeight: the mover wins when their newest stack contains
      // `targetStackHeight` pieces of their colour at the top.
      if (to >= 0) {
        const stack = placed.stacks[to] ?? [];
        let topRun = 0;
        for (let i = stack.length - 1; i >= 0; i -= 1) {
          if (stack[i] === move.placedOwner) topRun += 1;
          else break;
        }
        if (topRun >= this.targetStackHeight) {
          winner = move.placedOwner;
          over = true;
        }
      }
    }

    const tentativeMover = nextMover(placed.mover, this.numPlayers);
    const advanced = placed.withMover(tentativeMover);
    if (!over) {
      // Stalemate: every stack is full ⇒ draw.
      const moversCanPlay = placed.cells.some(
        (_c, i) => placed.stackSize(i) < this.maxStackHeight,
      );
      if (!moversCanPlay) {
        over = true;
        winner = 0;
      }
    }

    const finalState = over ? placed : advanced;
    const trial = context.trial
      .withMove(move, over, winner)
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
      "Stacking",
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
