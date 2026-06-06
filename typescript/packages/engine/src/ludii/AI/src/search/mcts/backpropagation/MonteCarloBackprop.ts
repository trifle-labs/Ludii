// @java AI/src/search/mcts/backpropagation/MonteCarloBackprop.java

/**
 * Standard backpropagation implementation for MCTS, performing Monte-Carlo
 * backups of playout outcomes.
 *
 * @java search.mcts.backpropagation.MonteCarloBackprop
 * @author Dennis Soemers
 */

import { BackpropagationStrategy } from "./BackpropagationStrategy.js";
import { BaseNode } from "../nodes/BaseNode.js";

// ---------------------------------------------------------------------------
// Escape-hatch types

/** @java other.context.Context */
type Context = Parameters<BackpropagationStrategy["computeUtilities"]>[2];

/** @java search.mcts.MCTS */
type MCTS = Parameters<BackpropagationStrategy["computeUtilities"]>[0];

// ---------------------------------------------------------------------------

/**
 * Standard Monte-Carlo backpropagation for MCTS.
 *
 * @java search.mcts.backpropagation.MonteCarloBackprop
 */
export class MonteCarloBackprop extends BackpropagationStrategy {

  // -------------------------------------------------------------------------

  /** @java MonteCarloBackprop.computeUtilities(MCTS, BaseNode, Context, double[], int) */
  public override computeUtilities(
    _mcts: MCTS,
    _startNode: BaseNode,
    _context: Context,
    _utilities: number[],
    _numPlayoutMoves: number,
  ): void {
    // Do nothing
  }

  /** @java MonteCarloBackprop.backpropagationFlags() */
  public override backpropagationFlags(): number {
    return 0;
  }

  // -------------------------------------------------------------------------
}
