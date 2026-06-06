// @java AI/src/search/mcts/backpropagation/AlphaGoBackprop.java

/**
 * An AlphaGo-style backpropagation, that returns a convex combination
 * of a heuristic value function evaluated at the expanded node and
 * a heuristic value function evaluated at the end of a playout.
 *
 * Can also be used for Alpha(Go) Zero style backpropagations by simply using
 * a weight of 0.0 for playout value, and 1.0 for the expanded node's value
 * (plus, for efficiency, using 0-length playouts).
 *
 * @java search.mcts.backpropagation.AlphaGoBackprop
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
 * Extended MCTS interface used internally in AlphaGoBackprop.
 * Java's MCTS class has heuristics() and playoutValueWeight() on the same object.
 */
interface MCTSAlphaGo extends MCTS {
  heuristics(): Heuristics | null;
  playoutValueWeight(): number;
}

/** @java utils.AIUtils (static escape hatch) */
const AIUtils = null as unknown as {
  heuristicValueEstimates(context: Context, heuristics: Heuristics): number[];
};

// ---------------------------------------------------------------------------

/**
 * AlphaGo-style backpropagation.
 *
 * @java search.mcts.backpropagation.AlphaGoBackprop
 */
export class AlphaGoBackprop extends BackpropagationStrategy {

  // -------------------------------------------------------------------------

  /** @java AlphaGoBackprop.computeUtilities(MCTS, BaseNode, Context, double[], int) */
  public override computeUtilities(
    mcts: MCTS,
    startNode: BaseNode,
    context: Context,
    utilities: number[],
    _numPlayoutMoves: number,
  ): void {
    // assert mcts.heuristics() != null
    // Java's MCTS has heuristics() and playoutValueWeight() — cast to extended interface
    const mctsExt = mcts as unknown as MCTSAlphaGo;
    const playoutValueWeight = mctsExt.playoutValueWeight();

    let nodeHeuristicValues: number[];

    if (playoutValueWeight < 1.0) {
      // Mix value function of expanded node with playout outcome (like AlphaGo)
      nodeHeuristicValues = startNode.heuristicValueEstimatesArray() ?? new Array<number>(utilities.length).fill(0.0);
    } else {
      // Array is irrelevant in this branch
      nodeHeuristicValues = new Array<number>(utilities.length).fill(0.0);
    }

    if (context.active() && playoutValueWeight > 0.0) {
      // Playout did not terminate — run heuristics at end of playout
      const heuristics = mctsExt.heuristics() as Heuristics;
      const playoutHeuristicValues = AIUtils.heuristicValueEstimates(context, heuristics);
      for (let p = 1; p < utilities.length; ++p) {
        utilities[p] = playoutHeuristicValues[p]!;
      }
    }

    for (let p = 1; p < utilities.length; ++p) {
      // Mix node and playout values
      utilities[p] = playoutValueWeight * utilities[p]! + (1.0 - playoutValueWeight) * nodeHeuristicValues[p]!;
    }
  }

  /** @java AlphaGoBackprop.backpropagationFlags() */
  public override backpropagationFlags(): number {
    return 0;
  }

  // -------------------------------------------------------------------------
}
