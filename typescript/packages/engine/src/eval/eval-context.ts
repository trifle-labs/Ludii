/**
 * Ludeme interpreter — evaluation foundation.
 *
 * Java parity:
 * - Core/src/other/context/Context.java + EvalContext.java — the rolling
 *   evaluation frame (`to`/`from`/`between`/`site`/`value`/`player`) that
 *   ludeme functions read while a move is being generated or a condition
 *   tested.
 *
 * Unlike the template games (FlatBoardGame etc.) that pattern-match an AST
 * onto a hand-rolled rule, the interpreter *evaluates* the ludeme tree.
 * Every `.lud` function compiles to one of the small evaluable interfaces
 * below; a function reads board + state through `EvalContext` and the
 * current `EvalFrame`.
 */

import type { Context } from "../context.js";
import type { Move } from "../move.js";
import type { State } from "../state.js";
import { FlatTopology } from "../topology.js";
import type { Trajectories } from "./graph/trajectories.js";
import { type Tiling, SQUARE_TILING } from "./tilings.js";

/** Sentinel for "no site" (Java: Constants.OFF = -1). */
export const OFF = -1;

/**
 * The rolling evaluation frame. Each field is the site/value/player the
 * surrounding ludeme has bound for its children to read — e.g. a move's
 * `if:(is Empty (to))` reads `frame.to`, a `(forEach Site … )` binds
 * `frame.site`, and `(forEach Player … )` binds `frame.player`.
 */
export interface EvalFrame {
  /** Candidate destination site (Java: `to()`). */
  readonly to?: number;
  /** Origin site of the move under construction (Java: `from()`). */
  readonly from?: number;
  /** Site hopped over (Java: `between()`). */
  readonly between?: number;
  /** Stack level (Java: `level()`). */
  readonly level?: number;
  /** Generic iteration site (Java: `site()`), bound by `(forEach Site …)`. */
  readonly site?: number;
  /** Iteration value (Java: `value()`), bound by `(forEach Value …)`. */
  readonly value?: number;
  /** Iterated player (Java: `player()`), bound by `(forEach Player …)`. */
  readonly player?: number;
  /** Piece type currently being moved (Java: `piece()`). */
  readonly piece?: number;
}

/**
 * A mancala sowing track: an ordered ring (or line) of site indices that
 * `(sow)` walks and `(sites Track)` / `(trackSite)` read. `owner` is the
 * player the track belongs to (0 = shared / unowned).
 */
export interface MancalaTrack {
  readonly name: string;
  readonly sites: readonly number[];
  readonly loop: boolean;
  readonly owner: number;
}

/**
 * Flat rectangular board view the interpreter evaluates against. Wraps
 * `FlatTopology` and adds the x/y ⇄ site conversions ludeme functions need
 * for direction stepping.
 */
export class InterpBoard {
  public readonly topo: FlatTopology;
  public readonly width: number;
  public readonly height: number;
  /** Tiling (square / hex) — supplies the direction offset tables. */
  public readonly tiling: Tiling;
  /**
   * On-board mask for non-rectangular shapes (e.g. a hexagonal outline laid
   * on a square bounding box). `width*height` flags; undefined ⇒ every cell
   * in the bounding box is on-board.
   */
  public readonly onBoard?: readonly boolean[];
  /** Global cell index where player p's hand begins (1-based; [0] unused). */
  public readonly handStart: readonly number[];
  /** Number of sites in player p's hand (1-based; [0] unused). */
  public readonly handSizes: readonly number[];
  /** Mancala sowing tracks declared on the board (empty for non-sow games). */
  public readonly tracks: readonly MancalaTrack[];
  /**
   * Global cell indices of a mancala board's store cells (the captured-seed
   * holes), in declaration order. `FirstSite` / `LastSite` and a player-store
   * `(map …)` resolve through these. Empty for `store:None` and non-sow games.
   */
  public readonly stores: readonly number[];
  /**
   * When the board was built from the graph algebra (merge / dual / concentric
   * / …), this carries the geometric adjacency. Site geometry and direction
   * stepping delegate here instead of to the rectangular lattice.
   */
  public readonly traj?: Trajectories;

  public constructor(
    width: number,
    height: number,
    handStart: readonly number[] = [],
    handSizes: readonly number[] = [],
    tiling: Tiling = SQUARE_TILING,
    onBoard?: readonly boolean[],
    tracks: readonly MancalaTrack[] = [],
    stores: readonly number[] = [],
    traj?: Trajectories,
  ) {
    this.topo = new FlatTopology(width, height);
    this.width = width;
    this.height = height;
    this.tiling = tiling;
    this.onBoard = onBoard;
    this.handStart = handStart;
    this.handSizes = handSizes;
    this.tracks = tracks;
    this.stores = stores;
    this.traj = traj;
  }

  /** Board sites only (used for topology queries). Hand sites are appended
   * to `State.cells` beyond this index. Holes in the bounding box are still
   * counted here (state stays rectangular); use `isOnBoard` to skip them. */
  public get numSites(): number {
    return this.traj ? this.traj.numSites : this.width * this.height;
  }

  /** True if `site` is a real board cell (false for bounding-box holes). */
  public isOnBoard(site: number): boolean {
    if (site < 0 || site >= this.numSites) return false;
    if (this.traj) return true;
    return this.onBoard ? this.onBoard[site] === true : true;
  }

  /** Single step in a named compass direction (graph boards only). */
  public stepDir(site: number, dir: string): number {
    return this.traj ? this.traj.step(site, dir) : OFF;
  }

  /** Ray of sites in a named compass direction (graph boards only). */
  public rayDir(site: number, dir: string): number[] {
    return this.traj ? this.traj.ray(site, dir) : [];
  }

  /** Global cell index for player p's hand slot k, or OFF if absent. */
  public handSite(player: number, idx: number): number {
    const start = this.handStart[player];
    if (start === undefined) return OFF;
    const size = this.handSizes[player] ?? 0;
    if (idx < 0 || idx >= size) return OFF;
    return start + idx;
  }

  /** All global cell indices in player p's hand. */
  public handSites(player: number): number[] {
    const start = this.handStart[player];
    if (start === undefined) return [];
    const size = this.handSizes[player] ?? 0;
    const out: number[] = [];
    for (let i = 0; i < size; i += 1) out.push(start + i);
    return out;
  }

  public xOf(site: number): number {
    return this.traj ? this.traj.xOf(site) : site % this.width;
  }

  public yOf(site: number): number {
    return this.traj ? this.traj.yOf(site) : Math.floor(site / this.width);
  }

  /** Site index at (x, y), or OFF if off the bounding box or a masked hole.
   * For graph boards this returns the nearest site within half a unit. */
  public siteAt(x: number, y: number): number {
    if (this.traj) {
      let best = OFF;
      let bestD = 0.25; // within half a unit
      for (let s = 0; s < this.traj.numSites; s += 1) {
        const dx = this.traj.xOf(s) - x;
        const dy = this.traj.yOf(s) - y;
        const d = dx * dx + dy * dy;
        if (d < bestD) {
          bestD = d;
          best = s;
        }
      }
      return best;
    }
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return OFF;
    }
    const idx = y * this.width + x;
    if (this.onBoard && this.onBoard[idx] !== true) return OFF;
    return idx;
  }
}

/**
 * The interpreter's evaluation context: a game `Context` (state + trial)
 * plus the board and the current rolling frame. Immutable — `withFrame`
 * returns a child sharing the same context/board with a patched frame.
 */
export class EvalContext {
  public readonly context: Context;
  public readonly board: InterpBoard;
  public readonly frame: EvalFrame;

  public constructor(
    context: Context,
    board: InterpBoard,
    frame: EvalFrame = {},
  ) {
    this.context = context;
    this.board = board;
    this.frame = frame;
  }

  public get state(): State {
    return this.context.state;
  }

  /** The side to move (Java: `Context.state().mover()`). */
  public get mover(): number {
    return this.context.state.mover;
  }

  /** The player the surrounding ludeme is iterating, else the mover. */
  public get player(): number {
    return this.frame.player ?? this.context.state.mover;
  }

  public withFrame(patch: EvalFrame): EvalContext {
    return new EvalContext(this.context, this.board, {
      ...this.frame,
      ...patch,
    });
  }

  public withContext(context: Context): EvalContext {
    return new EvalContext(context, this.board, this.frame);
  }

  /**
   * The evaluation context that would result from applying `move` to the
   * current state, *without* advancing the mover. The move is recorded in a
   * throwaway trial so `(last …)` resolves. Used by `(do … ifAfterwards:)`
   * and `(satisfy …)` to test a board predicate on the post-move position.
   */
  public applyHypothetical(move: Move): EvalContext {
    const state = move.applyTo(this.context.state);
    const trial = this.context.trial.withMove(move, false, -1);
    return new EvalContext(
      this.context.withState(state).withTrial(trial),
      this.board,
      this.frame,
    );
  }
}

// ---- Evaluable interfaces -------------------------------------------------

/** A boolean-valued ludeme (Java: `game.functions.booleans.BooleanFunction`). */
export interface BoolFn {
  eval(ctx: EvalContext): boolean;
}

/** An integer-valued ludeme (Java: `game.functions.ints.IntFunction`). */
export interface IntFn {
  eval(ctx: EvalContext): number;
}

/** A region-valued ludeme — a set of sites (Java: `RegionFunction`). */
export interface RegionFn {
  eval(ctx: EvalContext): readonly number[];
}

/** A move generator (Java: `game.rules.play.moves.Moves`). */
export interface MovesFn {
  generate(ctx: EvalContext): Move[];
}

/** A single board direction as an (x, y) step offset. */
export interface Dir {
  readonly dx: number;
  readonly dy: number;
}

/** A direction-set ludeme (Java: `game.functions.directions.Directions`). */
export interface DirectionsFn {
  eval(ctx: EvalContext): readonly Dir[];
}

/** The resolved outcome of an end condition. `winner === 0` is a draw. */
export interface EndOutcome {
  readonly winner: number;
}

/** An ending rule (Java: `game.rules.end.End` clause). */
export interface EndRule {
  eval(ctx: EvalContext): EndOutcome | undefined;
}
