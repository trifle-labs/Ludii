// @java AI/src/search/mcts/backpropagation/QualitativeBonus.java

/**
 * Implements a Qualitative bonus (based on heuristic value function estimates),
 * as described in "Quality-based Rewards for Monte-Carlo Tree Search Simulations".
 *
 * @java search.mcts.backpropagation.QualitativeBonus
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

/** @java main.math.statistics.IncrementalStats */
type IncrementalStats = {
  getMean(): number;
  getStd(): number;
  observe(v: number): void;
};

/**
 * Extended MCTS interface used internally in QualitativeBonus.
 * Java's MCTS class has heuristics() and heuristicStats() on the same object.
 */
interface MCTSQualitative extends MCTS {
  heuristics(): Heuristics | null;
  heuristicStats(): IncrementalStats[] | null;
}

/** @java utils.AIUtils (static escape hatch) */
const AIUtils = null as unknown as {
  heuristicValueBonusEstimates(context: Context, heuristics: Heuristics): number[];
};

// ---------------------------------------------------------------------------

/**
 * Qualitative bonus backpropagation strategy.
 *
 * @java search.mcts.backpropagation.QualitativeBonus
 */
export class QualitativeBonus extends BackpropagationStrategy {

  // -------------------------------------------------------------------------

  /** @java QualitativeBonus.k — constant used in sigmoid squashing of bonus */
  private readonly k: number = 1.4;

  /** @java QualitativeBonus.a — weight assigned to bonuses */
  private readonly a: number = 0.25;

  // -------------------------------------------------------------------------

  /** @java QualitativeBonus.computeUtilities(MCTS, BaseNode, Context, double[], int) */
  public override computeUtilities(
    mcts: MCTS,
    _startNode: BaseNode,
    context: Context,
    utilities: number[],
    _numPlayoutMoves: number,
  ): void {
    // assert mcts.heuristics() != null
    // Java's MCTS has heuristics() and heuristicStats() — cast to extended interface
    const mctsExt = mcts as unknown as MCTSQualitative;
    const heuristics = mctsExt.heuristics() as Heuristics;
    const heuristicValues = AIUtils.heuristicValueBonusEstimates(context, heuristics);
    const heuristicStats = mctsExt.heuristicStats()!;

    for (let p = 1; p < heuristicValues.length; ++p) {
      const stats = heuristicStats[p]!;
      const q = heuristicValues[p]!;
      const std = stats.getStd();

      if (std > 0.0) {
        // Apply bonus
        const lambda = (q - stats.getMean()) / std;
        const bonus = -1.0 + (2.0 / (1.0 + Math.exp(-this.k * lambda)));
        utilities[p]! += this.a * bonus;
      }

      // Update incremental stats tracker
      stats.observe(q);
    }
  }

  /** @java QualitativeBonus.backpropagationFlags() */
  public override backpropagationFlags(): number {
    return BackpropagationStrategy.GLOBAL_HEURISTIC_STATS;
  }

  // -------------------------------------------------------------------------
}
