// @java Core/src/game/Game.java Game (TS template subset)
/**
 * Concrete `Game` for the classic Hex connection game on a rhombic
 * NxN board (Piet Hein, 1942; rediscovered by John Nash). Open rules
 * — no commercial branding; this is the unbranded game of pure
 * connection.
 *
 * Rules implemented:
 * - Two players place stones one at a time on empty cells.
 * - Player 1 connects the top and bottom edges; Player 2 connects the
 *   left and right edges.
 * - First player to form an unbroken chain of own-coloured stones from
 *   their pair of edges wins. No draws are possible on a filled hex
 *   board.
 *
 * Phase 2 of `BROWSER_PLAYER_ROADMAP.md`: this confirms the
 * `BrowserGameSession` contract holds for a non-square-topology game
 * without modification.
 */

import { ConceptSet } from "./concept.js";
import { Context } from "./context.js";
import type { Game } from "./game.js";
import { Move } from "./move.js";
import { State } from "./state.js";
import { Trial } from "./trial.js";

const HEX_LABELS = ["●", "○"];

/** Six rhombic-grid neighbours for axial coordinates (col, row). */
const HEX_NEIGHBOURS: readonly [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, -1],
  [-1, 1],
];

function siteIndex(width: number, x: number, y: number): number {
  return y * width + x;
}

function connectsForPlayer(
  cells: readonly number[],
  size: number,
  player: number,
): boolean {
  // Player 1: connect top row (y=0) to bottom row (y=size-1).
  // Player 2: connect left column (x=0) to right column (x=size-1).
  const visited = new Uint8Array(cells.length);
  const stack: number[] = [];
  if (player === 1) {
    for (let x = 0; x < size; x += 1) {
      const idx = siteIndex(size, x, 0);
      if (cells[idx] === 1) {
        stack.push(idx);
        visited[idx] = 1;
      }
    }
  } else {
    for (let y = 0; y < size; y += 1) {
      const idx = siteIndex(size, 0, y);
      if (cells[idx] === 2) {
        stack.push(idx);
        visited[idx] = 1;
      }
    }
  }
  while (stack.length > 0) {
    const cur = stack.pop() ?? 0;
    const cx = cur % size;
    const cy = Math.floor(cur / size);
    if (player === 1 && cy === size - 1) {
      return true;
    }
    if (player === 2 && cx === size - 1) {
      return true;
    }
    for (const [dx, dy] of HEX_NEIGHBOURS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || nx >= size || ny < 0 || ny >= size) {
        continue;
      }
      const ni = siteIndex(size, nx, ny);
      if (visited[ni] !== 0) {
        continue;
      }
      if (cells[ni] !== player) {
        continue;
      }
      visited[ni] = 1;
      stack.push(ni);
    }
  }
  return false;
}

export interface HexGameOptions {
  readonly size?: number;
  readonly componentLabels?: readonly [string, string];
  /** Override the game id. Defaults to `hex-${size}`. */
  readonly id?: string;
  /** Override the game name. Defaults to `Hex (size×size)`. */
  readonly name?: string;
}

export class HexGame implements Game {
  public readonly id: string;
  public readonly name: string;
  public readonly numPlayers = 2;
  public readonly size: number;
  public readonly componentLabels: readonly string[];

  public constructor(options: HexGameOptions = {}) {
    const size = options.size ?? 7;
    if (!Number.isInteger(size) || size < 2) {
      throw new Error(`size must be an integer >= 2; got ${size}.`);
    }
    this.size = size;
    this.id = options.id ?? `hex-${size}`;
    this.name = options.name ?? `Hex (${size}×${size})`;
    this.componentLabels = Object.freeze([
      ...(options.componentLabels ?? HEX_LABELS),
    ]);
  }

  public get width(): number {
    return this.size;
  }

  public get height(): number {
    return this.size;
  }

  public get siteCount(): number {
    return this.size * this.size;
  }

  public get numSites(): number {
    return this.size * this.size;
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
        const x = i % this.size;
        const y = Math.floor(i / this.size);
        out.push(
          new Move({
            id: `m${context.trial.numMoves}:${i}:${mover}`,
            label: `Place ${label} at (${x + 1}, ${y + 1})`,
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
    const win = connectsForPlayer(placed.cells, this.size, move.placedOwner);
    const over = win;
    const winner = win ? move.placedOwner : -1;
    const advanced = over ? placed : placed.withMover(move.mover === 1 ? 2 : 1);
    const trial = context.trial
      .withMove(move, over, winner)
      .saveState(advanced);
    return new Context(this, advanced, trial);
  }

  public over(context: Context): boolean {
    return context.over;
  }

  /** Java parity: `Game.concepts()` for the connection family. */
  public concepts(context?: Context): ConceptSet {
    let set = ConceptSet.of(
      "Add",
      "AlternatingTurns",
      "ConnectionWin",
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

export function hexGame(size = 7): HexGame {
  return new HexGame({ size });
}
