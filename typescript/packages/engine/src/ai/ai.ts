/**
 * Java parity: Core/src/other/AI.java — base type for AI players.
 *
 * The Java AI surface is large (initAI, selectAction, generateAnalysisReport,
 * features, …). The TS engine only needs `selectAction(context, options)` —
 * the rest is left as no-op hooks subclasses can override.
 */

import type { Context } from "../context.js";
import type { Move } from "../move.js";

export interface SelectActionOptions {
  /** Maximum thinking time. -1 / undefined ⇒ no time limit. */
  readonly maxSeconds?: number;
  /** Maximum number of iterations (search nodes/playouts). -1 ⇒ unlimited. */
  readonly maxIterations?: number;
  /** Maximum search depth. -1 ⇒ unlimited. */
  readonly maxDepth?: number;
}

export abstract class AI {
  /** Java parity: `AI.friendlyName`. */
  public friendlyName = "AI";

  /** Index of the player this AI plays for; -1 = unassigned. */
  protected player = -1;

  /** Java parity: `AI.initAI(game, playerID)`. */
  public initAI(playerID: number): void {
    this.player = playerID;
  }

  /** Java parity: `AI.closeAI()` — release resources. */
  public closeAI(): void {
    // default: nothing to release
  }

  /**
   * Pick a move from the legal moves at `context`. Sub-classes implement
   * the strategy. Returning `undefined` is only valid if no legal move
   * exists.
   */
  public abstract selectAction(
    context: Context,
    options?: SelectActionOptions,
  ): Move | undefined;
}
