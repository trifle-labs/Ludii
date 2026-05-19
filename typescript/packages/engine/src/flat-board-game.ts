/**
 * Java parity:
 * - Conceptually a hand-rolled subset of `Core/src/game/Game.java`
 *   instantiated for the "place on empty until N-in-a-row" rule shape.
 *
 * Designed for the MVE: any rectangular grid, any number of players,
 * any in-a-row length K. Players take alternating turns. The game ends
 * either with the active mover winning (their move completed a line) or
 * with a draw when every cell is filled.
 */

import { ConceptSet } from "./concept.js";
import { Context } from "./context.js";
import type { Game } from "./game.js";
import { Move } from "./move.js";
import { State } from "./state.js";
import { Trial } from "./trial.js";

export interface FlatBoardGameOptions {
  readonly id: string;
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly numPlayers: number;
  readonly lineLength: number;
  readonly componentLabels?: readonly string[];
}

const DEFAULT_COMPONENT_LABELS = ["X", "O", "△", "□", "◇", "★", "●", "■"];

function siteIndex(width: number, x: number, y: number): number {
  return y * width + x;
}

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
  if (owner === 0) {
    return false;
  }
  const lx = lastSite % width;
  const ly = Math.floor(lastSite / width);
  const directions: readonly [number, number][] = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ];
  for (const [dx, dy] of directions) {
    let count = 1;
    for (let s = 1; s < lineLength; s += 1) {
      const x = lx + dx * s;
      const y = ly + dy * s;
      if (x < 0 || x >= width || y < 0 || y >= height) {
        break;
      }
      if (cells[siteIndex(width, x, y)] !== owner) {
        break;
      }
      count += 1;
    }
    for (let s = 1; s < lineLength; s += 1) {
      const x = lx - dx * s;
      const y = ly - dy * s;
      if (x < 0 || x >= width || y < 0 || y >= height) {
        break;
      }
      if (cells[siteIndex(width, x, y)] !== owner) {
        break;
      }
      count += 1;
    }
    if (count >= lineLength) {
      return true;
    }
  }
  return false;
}

export class FlatBoardGame implements Game {
  public readonly id: string;
  public readonly name: string;
  public readonly numPlayers: number;
  public readonly width: number;
  public readonly height: number;
  public readonly lineLength: number;
  public readonly componentLabels: readonly string[];

  public get numSites(): number {
    return this.width * this.height;
  }

  public constructor(options: FlatBoardGameOptions) {
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
    if (!Number.isInteger(options.lineLength) || options.lineLength < 2) {
      throw new Error(
        `lineLength must be an integer >= 2; got ${options.lineLength}.`,
      );
    }
    this.id = options.id;
    this.name = options.name;
    this.width = options.width;
    this.height = options.height;
    this.numPlayers = options.numPlayers;
    this.lineLength = options.lineLength;
    const labels =
      options.componentLabels ??
      DEFAULT_COMPONENT_LABELS.slice(0, options.numPlayers);
    if (labels.length < options.numPlayers) {
      throw new Error(
        `componentLabels must include one label per player (need ${options.numPlayers}, got ${labels.length}).`,
      );
    }
    this.componentLabels = Object.freeze([...labels]);
  }

  public get siteCount(): number {
    return this.width * this.height;
  }

  public start(): Context {
    const cells = new Array<number>(this.siteCount).fill(0);
    const state = new State(1, cells, this.componentLabels);
    const trial = new Trial([], false, -1).saveState(state);
    return new Context(this, state, trial);
  }

  public moves(context: Context): readonly Move[] {
    if (context.over) {
      return [];
    }
    const out: Move[] = [];
    const mover = context.state.mover;
    const label = this.componentLabels[mover - 1] ?? `P${mover}`;
    for (let i = 0; i < this.siteCount; i += 1) {
      if (context.state.cells[i] === 0) {
        const x = i % this.width;
        const y = Math.floor(i / this.width);
        out.push(
          new Move({
            id: `m${context.trial.numMoves}:${i}:${mover}`,
            label: `Play ${label} at (${x + 1}, ${y + 1})`,
            siteIndices: [i],
            mover,
            placedOwner: mover,
          }),
        );
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
    const site = move.siteIndices[0];
    if (site === undefined) {
      throw new Error("Move missing target site.");
    }
    if (context.state.cells[site] !== 0) {
      throw new Error(`Site ${site} is already occupied.`);
    }
    const placed = move.applyTo(context.state);
    const winner = hasLine(
      placed.cells,
      this.width,
      this.height,
      this.lineLength,
      move.placedOwner,
      site,
    )
      ? move.placedOwner
      : -1;
    const filled = placed.cells.every((c) => c !== 0);
    const over = winner !== -1 || filled;
    const finalWinner = winner === -1 && over ? 0 : winner;
    const advanced = over
      ? placed
      : placed.withMover(nextMover(placed.mover, this.numPlayers));
    const trial = context.trial
      .withMove(move, over, finalWinner)
      .saveState(advanced);
    return new Context(this, advanced, trial);
  }

  public over(context: Context): boolean {
    return context.over;
  }

  /**
   * Java parity: `Game.concepts()`. Structural concepts for the
   * "place to make a line" family are constant; plus the concepts
   * implied by every legal move.
   */
  public concepts(context?: Context): ConceptSet {
    let set = ConceptSet.of(
      "Add",
      "AlternatingTurns",
      "LineWin",
      "DrawByFill",
      "PieceOwnership",
      "DeterministicPlayout",
    );
    if (context) {
      for (const move of this.moves(context)) {
        set = set.union(move.concepts());
      }
    }
    return set;
  }
}

export function ticTacToeGame(): FlatBoardGame {
  return new FlatBoardGame({
    id: "tic-tac-toe",
    name: "Tic-Tac-Toe",
    width: 3,
    height: 3,
    numPlayers: 2,
    lineLength: 3,
    componentLabels: ["X", "O"],
  });
}
