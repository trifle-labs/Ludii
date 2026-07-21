// @java Core/src/game/rules/play/moves/nonDecision/effect/requirement/While.java

/**
 * Applies a move repeatedly until a condition becomes false.
 *
 * @java game/rules/play/moves/nonDecision/effect/requirement/While.java
 *
 * Java parity (While.eval):
 *   Creates a TempContext copy, then loops:
 *     while (condition.eval(newContext)) {
 *       for each move in moves.eval(newContext): apply and collect
 *     }
 *   Throws if the loop exceeds MAX_NUM_ITERATION (= 1000).
 *
 * NOTE: coverage-only transliteration; not registered in the 1:1 moves registry.
 */

import { Context } from "../../../../../../../../context.js";
import { applyMoveWithThens } from "../Then.js";
import type { Move } from "../../../../../../../../move.js";
import type { BooleanFunction, MovesFunction } from "../../../../../../../base.js";

/** Java constant: main.Constants.MAX_NUM_ITERATION */
const MAX_NUM_ITERATION = 1000;

/**
 * @java game/rules/play/moves/nonDecision/effect/requirement/While.java
 *
 * Applies the given moves generator repeatedly while the given condition
 * evaluates to true in a temporary copy of the context.
 *
 * Java parity:
 *   public final class While extends Effect
 *   eval(Context): loop calling moves.eval and applying each move to a copy
 */
export class While implements MovesFunction {
  /** The moves to apply until the condition is false. */
  private readonly moves: MovesFunction;

  /** The condition to check before each iteration. */
  private readonly condition: BooleanFunction;

  /** Optional subsequent moves (the `then` clause). */
  private readonly thenMoves: MovesFunction | null;

  /**
   * @java While(BooleanFunction condition, Moves moves, Then then)
   *
   * @param condition  Condition evaluated each iteration; loop stops when false.
   * @param moves      Moves to apply each iteration.
   * @param thenMoves  Optional subsequent moves applied after the loop.
   */
  public constructor(
    condition: BooleanFunction,
    moves: MovesFunction,
    thenMoves: MovesFunction | null = null,
  ) {
    this.condition = condition;
    this.moves = moves;
    this.thenMoves = thenMoves;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/requirement/While.java — eval(Context)
   *
   * Java parity (While.eval lines 60-88):
   *   1. Create a TempContext (shallow copy of the context state).
   *   2. While condition is true on the copy: generate & apply each move.
   *   3. Throw if iteration exceeds MAX_NUM_ITERATION.
   *   4. Append thenMoves to every collected move.
   */
  public eval(ctx: Context): Move[] {
    const result: Move[] = [];

    // Java parity: new TempContext(context) — track the "live" context
    // as we apply each generated move so the condition sees updated state.
    let liveCtx = ctx;
    let numIteration = 0;

    while (this.condition.eval(liveCtx)) {
      const generated = this.moves.eval(liveCtx);
      for (const m of generated) {
        // Apply the move to the live copy of the context so the condition
        // can detect when to stop.
        // @java Move.apply — simulated application includes then() consequences
        // @java While.java:71 — m.apply(newContext, false): internal loop
        // iterations are store=false, so lastMove() stays pinned to the
        // outer decision move throughout then-resolution (Move.java:514-522).
        const nextState = applyMoveWithThens(liveCtx, m, undefined, false);
        liveCtx = new Context(ctx.game, nextState, ctx.trial, ctx.rng);
        // Carry the board topology scratch to the fresh context (same fix as
        // Do.ts): without it the SECOND iteration's conditions evaluate with
        // no _trajectories — Stargazers' unmark cascade saw empty
        // line-of-sight and stopped one round early, leaving live pieces
        // marked dead and the by-over end never firing.
        {
          const src = ctx as Context & { _radials?: unknown; _trajectories?: unknown };
          const aug = liveCtx as Context & { _radials?: unknown; _trajectories?: unknown };
          aug._radials = src._radials;
          aug._trajectories = src._trajectories;
        }
        result.push(m);
      }
      numIteration++;
      if (numIteration > MAX_NUM_ITERATION) {
        throw new Error(
          "Infinite While(), the condition can not be reached.",
        );
      }
    }

    return result;
  }

  /** @java While.isStatic() → false */
  public isStatic(): boolean {
    return false;
  }

  /** @java While.toEnglish() */
  public toEnglish(): string {
    return "while condition apply moves";
  }
}
