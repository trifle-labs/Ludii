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
 * Flat rectangular board view the interpreter evaluates against. Wraps
 * `FlatTopology` and adds the x/y ⇄ site conversions ludeme functions need
 * for direction stepping.
 */
export class InterpBoard {
  public readonly topo: FlatTopology;
  public readonly width: number;
  public readonly height: number;

  public constructor(width: number, height: number) {
    this.topo = new FlatTopology(width, height);
    this.width = width;
    this.height = height;
  }

  public get numSites(): number {
    return this.width * this.height;
  }

  public xOf(site: number): number {
    return site % this.width;
  }

  public yOf(site: number): number {
    return Math.floor(site / this.width);
  }

  /** Site index at (x, y), or OFF if the coordinate lies off the board. */
  public siteAt(x: number, y: number): number {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return OFF;
    }
    return y * this.width + x;
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
