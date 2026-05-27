// @java Core/src/game/Game.java Game (TS template subset)
/**
 * Concrete `Game` for Y-style connection games played on a triangular
 * board of hexagonal cells — Y by Schensted & Titus (1953), and its
 * variants (Master Y, Y (Hex), …).
 *
 * Topology: an N-row triangle with row r containing r+1 cells (r in
 * [0, N)). Total cells = N(N+1)/2. Adjacency follows the standard
 * hex-axial neighbour pattern intersected with the triangular mask.
 *
 * Winning condition: one player connects all THREE sides of the
 * triangle through a single chain of their own pieces. The three
 * sides are:
 *   - Top: the single cell at row 0.
 *   - Left: column 0 of every row.
 *   - Right: the diagonal cell (r, r) of every row.
 *
 * For .lud parity the corners belong to BOTH adjacent sides; first
 * player to touch all three regions wins. Draws are impossible on a
 * filled Y board (a classic Y theorem).
 *
 * `(tri Hexagon N)` (used by "Y (Hex)") is a hexagonal-outline triangle
 * tiling. The simplified topology here collapses both `(tri N)` and
 * `(tri Hexagon N)` to the same N-row triangular model; the Hexagon
 * variant's outer hexagonal symmetry isn't honoured exactly, but the
 * connection game still plays correctly with three sides.
 */

import { ConceptSet } from "./concept.js";
import { Context } from "./context.js";
import type { Game } from "./game.js";
import { Move } from "./move.js";
import { State } from "./state.js";
import { Trial } from "./trial.js";

const TRI_LABELS = ["●", "○"];

/** Six hex-axial neighbours; identical to HexGame's offsets. */
const TRI_NEIGHBOURS: readonly [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, -1],
  [-1, 1],
];

function triCellCount(size: number): number {
  return (size * (size + 1)) / 2;
}

/**
 * Map (row, col) for a row-major lower-triangular layout to a flat
 * index. row in [0, size); col in [0, row+1).
 */
function triIndex(row: number, col: number): number {
  return (row * (row + 1)) / 2 + col;
}

function triCoords(idx: number): [number, number] {
  // Inverse of triIndex: solve idx = r(r+1)/2 + c for the largest r
  // with r(r+1)/2 <= idx. Use the closed-form quadratic root and
  // adjust for floating-point slack at the boundary.
  let r = Math.floor((-1 + Math.sqrt(1 + 8 * idx)) / 2);
  while ((r + 1) * (r + 2) <= 2 * idx) r += 1;
  while (r > 0 && r * (r + 1) > 2 * idx) r -= 1;
  const c = idx - (r * (r + 1)) / 2;
  return [r, c];
}

function inTri(size: number, row: number, col: number): boolean {
  return row >= 0 && row < size && col >= 0 && col <= row;
}

/**
 * Y connection check: a player wins when their stones form a single
 * connected region (using hex adjacency) that touches all three sides.
 * We BFS from any of the player's stones that touches a side, then
 * verify that the reached set touches all three sides.
 */
function connectsAllSides(
  cells: readonly number[],
  size: number,
  player: number,
): boolean {
  if (size < 1) return false;
  const visited = new Uint8Array(cells.length);
  for (let start = 0; start < cells.length; start += 1) {
    if (cells[start] !== player || visited[start] !== 0) continue;
    let touchTop = false;
    let touchLeft = false;
    let touchRight = false;
    const stack: number[] = [start];
    visited[start] = 1;
    while (stack.length > 0) {
      const cur = stack.pop() ?? 0;
      const [r, c] = triCoords(cur);
      if (r === 0) touchTop = true;
      if (c === 0) touchLeft = true;
      if (c === r) touchRight = true;
      for (const [dr, dc] of TRI_NEIGHBOURS) {
        const nr = r + dr;
        const nc = c + dc;
        if (!inTri(size, nr, nc)) continue;
        const ni = triIndex(nr, nc);
        if (visited[ni] !== 0) continue;
        if (cells[ni] !== player) continue;
        visited[ni] = 1;
        stack.push(ni);
      }
    }
    if (touchTop && touchLeft && touchRight) return true;
  }
  return false;
}

export interface TriGameOptions {
  readonly size?: number;
  readonly componentLabels?: readonly [string, string];
  readonly id?: string;
  readonly name?: string;
}

export class TriGame implements Game {
  public readonly id: string;
  public readonly name: string;
  public readonly numPlayers = 2;
  public readonly size: number;
  public readonly componentLabels: readonly string[];

  public constructor(options: TriGameOptions = {}) {
    const size = options.size ?? 7;
    if (!Number.isInteger(size) || size < 2) {
      throw new Error(`size must be an integer >= 2; got ${size}.`);
    }
    this.size = size;
    this.id = options.id ?? `tri-${size}`;
    this.name = options.name ?? `Y (tri ${size})`;
    this.componentLabels = Object.freeze([
      ...(options.componentLabels ?? TRI_LABELS),
    ]);
  }

  public get width(): number {
    return this.size;
  }

  public get height(): number {
    return this.size;
  }

  public get siteCount(): number {
    return triCellCount(this.size);
  }

  public get numSites(): number {
    return triCellCount(this.size);
  }

  public start(): Context {
    const cells = new Array<number>(this.siteCount).fill(0);
    const state = new State(1, cells, this.componentLabels);
    const trial = new Trial([], false, -1).saveState(state);
    return new Context(this, state, trial);
  }

  public moves(context: Context): readonly Move[] {
    if (context.over) return [];
    const out: Move[] = [];
    const mover = context.state.mover;
    const label = this.componentLabels[mover - 1] ?? `P${mover}`;
    for (let i = 0; i < this.siteCount; i += 1) {
      if (context.state.cells[i] === 0) {
        const [r, c] = triCoords(i);
        out.push(
          new Move({
            id: `m${context.trial.numMoves}:${i}:${mover}`,
            label: `Place ${label} at (${r + 1}, ${c + 1})`,
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
    if (site === undefined) throw new Error("Move missing target site.");
    if (context.state.cells[site] !== 0) {
      throw new Error(`Site ${site} is already occupied.`);
    }
    const placed = move.applyTo(context.state);
    const win = connectsAllSides(placed.cells, this.size, move.placedOwner);
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

export function triGame(size = 7): TriGame {
  return new TriGame({ size });
}
