// @java AI/src/search/mcts/backpropagation/HeuristicBackprop.java

/**
 * Implementation of backpropagation that uses heuristic value estimates
 * for any player that is still active at the end of a playout, instead
 * of defaulting to 0.0.
 *
 * @java search.mcts.backpropagation.HeuristicBackprop
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

/** @java metadata.ai.heuristics.Heuristics */
type Heuristics = object;

/**
 * Extended MCTS interface used internally in HeuristicBackprop.
 * Java's MCTS class exposes heuristics() on the same object.
 */
interface MCTSHeuristic extends MCTS {
  heuristics(): Heuristics | null;
}

/** @java utils.AIUtils (static escape hatch) */
const AIUtils = null as unknown as {
  heuristicValueEstimates(context: Context, heuristics: Heuristics): number[];
};

// ---------------------------------------------------------------------------

/**
 * Heuristic-based backpropagation for MCTS.
 *
 * @java search.mcts.backpropagation.HeuristicBackprop
 */
export class HeuristicBackprop extends BackpropagationStrategy {

  // -------------------------------------------------------------------------

  /** @java HeuristicBackprop.computeUtilities(MCTS, BaseNode, Context, double[], int) */
  public override computeUtilities(
    mcts: MCTS,
    _startNode: BaseNode,
    context: Context,
    utilities: number[],
    _numPlayoutMoves: number,
  ): void {
    // assert mcts.heuristics() != null
    // Java's MCTS has heuristics() — cast to extended interface
    const mctsExt = mcts as unknown as MCTSHeuristic;
    if (context.active()) {
      // Playout did not terminate — run heuristics at end of playout
      const heuristics = mctsExt.heuristics() as Heuristics;
      const playoutHeuristicValues = AIUtils.heuristicValueEstimates(context, heuristics);
      for (let p = 1; p < utilities.length; ++p) {
        utilities[p] = playoutHeuristicValues[p]!;
      }
    }
  }

  /** @java HeuristicBackprop.backpropagationFlags() */
  public override backpropagationFlags(): number {
    return 0;
  }

  // -------------------------------------------------------------------------
}
