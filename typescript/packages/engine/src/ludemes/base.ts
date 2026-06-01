/**
 * Base ludeme interfaces for the 1:1 Java→TS port.
 *
 * @java game/functions/booleans/BooleanFunction.java
 * @java game/functions/ints/IntFunction.java
 * @java game/functions/region/RegionFunction.java
 * @java game/rules/play/moves/Moves.java
 *
 * These mirror the Java abstract-class hierarchy root contracts.
 * Every concrete ludeme class implements one of these.
 */

import type { Context } from "../context.js";
import type { Move } from "../move.js";

// ---------------------------------------------------------------------------
// Evaluation scratch on Context
// ---------------------------------------------------------------------------

/**
 * Java parity: Context has mutable eval-scratch fields `from()`, `to()`,
 * `value()` that ludeme `eval()` methods read during a single evaluation pass
 * (e.g. IsLine reads the pivot site via `context.to()`). We attach these as
 * plain mutable properties on the Context instance; they are never serialised
 * and never affect the immutable State/Trial.
 *
 * @java other/context/Context.java — setTo/setFrom/setValue, to()/from()/value()
 */
export interface EvalScratch {
  /** Java parity: Context.to() / Context.setTo(int). Default -1 (Constants.OFF). */
  _evalTo: number;
  /** Java parity: Context.from() / Context.setFrom(int). Default -1 (Constants.OFF). */
  _evalFrom: number;
  /** Java parity: Context.value() / Context.setValue(int). Default 0. */
  _evalValue: number;
  /**
   * Java parity: Context.site() / Context.setSite(int).
   * Used by forEach region iteration (ForEachSiteInRegion) to pass the current
   * site to the condition evaluator. Default -1 (Constants.OFF).
   * @java other/context/Context.java — site()/setSite(int)
   */
  _evalSite?: number;
  /**
   * Java parity: Context.player() / Context.setPlayer(int).
   * Set by (forEach Player ...) end rules to pass the current player being
   * evaluated to predicates like (is Blocked Player).
   * @java other/context/Context.java — player()/setPlayer(int)
   */
  _evalPlayer?: number;
}

// ---------------------------------------------------------------------------
// Base interfaces (mirror Java abstract classes)
// ---------------------------------------------------------------------------

/**
 * A boolean-valued ludeme.
 * @java game.functions.booleans.BooleanFunction
 */
export interface BooleanFunction {
  eval(ctx: Context & EvalScratch): boolean;
}

/**
 * An integer-valued ludeme.
 * @java game.functions.ints.IntFunction
 */
export interface IntFunction {
  eval(ctx: Context & EvalScratch): number;
}

/**
 * A region (set of site indices) ludeme.
 * @java game.functions.region.RegionFunction
 */
export interface RegionFunction {
  eval(ctx: Context & EvalScratch): number[];
}

/**
 * A move-generating ludeme. eval() returns the full list of legal moves.
 * @java game.rules.play.moves.Moves
 */
export interface MovesFunction {
  eval(ctx: Context & EvalScratch): Move[];
}

/**
 * An end-rule ludeme. eval() returns an EndResult or null.
 * @java game.rules.end.EndRule
 */
export interface EndRuleFunction {
  eval(ctx: Context & EvalScratch): EndResult | null;
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export type RoleType = "Mover" | "Next" | "P1" | "P2" | "All";
export type ResultType = "Win" | "Loss" | "Draw";

export interface EndResult {
  /** 1-based player who triggered the result, or 0 for draw/tie. */
  readonly winner: number;
  /** Whether the game is over. */
  readonly over: boolean;
  /** Java-parity: final ranking array (index 1..N, 1.0 = winner). */
  readonly ranking?: readonly number[];
}

// ---------------------------------------------------------------------------
// Topology radials for 1:1 path
// ---------------------------------------------------------------------------

/**
 * Per-cell radial precomputation for the 1:1 topology.
 * Each cell has per-direction "rays": ordered arrays of site indices starting
 * from the cell itself. Used by IsLine to walk the board.
 *
 * Direction names match Java's AbsoluteDirection enum:
 *   "N","S","E","W"      — cardinal (orthogonal)
 *   "NE","NW","SE","SW"  — diagonal
 *   "Orthogonal"         — N+S+E+W
 *   "Diagonal"           — NE+NW+SE+SW
 *   "Adjacent"           — all 8
 *
 * Each entry is { ray: siteIds[], opposite: siteIds[] } where `ray` goes in
 * the named direction and `opposite` goes the other way (for bidirectional
 * IsLine counting).
 */
export interface Radial {
  readonly ray: readonly number[];
  /** The complementary ray in the opposite direction (for bidirectional walk). */
  readonly opposite: readonly number[];
}

export interface CellRadials {
  readonly [dirName: string]: readonly Radial[];
}
