// @java AI/src/search/mcts/selection/ProgressiveHistory.java

/**
 * Progressive History, as described by Nijssen and Winands (2011).
 *
 * @java search.mcts.selection.ProgressiveHistory
 * @author Dennis Soemers
 */

import type { MCTS, BaseNode, SelectionStrategy } from "./SelectionStrategy.js";

// ---------------------------------------------------------------------------
// Additional MCTS surface needed by ProgressiveHistory

/** @java search.mcts.MCTS.ActionStatistics */
interface ActionStatistics {
  visitCount: number;
  accumulatedScore: number;
}

/** @java search.mcts.MCTS.MoveKey (opaque key object) */
type MoveKey = object;

/** @java search.mcts.MCTS (augmented for ProgressiveHistory) */
interface MCTSWithActionStats extends MCTS {
  getOrCreateActionStatsEntry(key: MoveKey): ActionStatistics;
}

// Backprop flag constant from BackpropagationStrategy
const GLOBAL_ACTION_STATS = (0x1 << 1);

// ---------------------------------------------------------------------------

/**
 * Progressive History selection strategy.
 *
 * @java search.mcts.selection.ProgressiveHistory
 */
export class ProgressiveHistory implements SelectionStrategy {

  // -------------------------------------------------------------------------

  /** @java ProgressiveHistory.progressiveBiasInfluence */
  protected readonly progressiveBiasInfluence: number;

  /** @java ProgressiveHistory.explorationConstant */
  protected explorationConstant: number;

  // -------------------------------------------------------------------------

  /**
   * Constructor with default value of W = 3.0.
   * @java ProgressiveHistory()
   */
  constructor();

  /**
   * Constructor.
   * @java ProgressiveHistory(double, double)
   */
  constructor(progressiveBiasInfluence: number, explorationConstant: number);

  constructor(progressiveBiasInfluence?: number, explorationConstant?: number) {
    this.progressiveBiasInfluence = progressiveBiasInfluence !== undefined ? progressiveBiasInfluence : 3.0;
    this.explorationConstant = explorationConstant !== undefined ? explorationConstant : Math.sqrt(2.0);
  }

  // -------------------------------------------------------------------------

  /**
   * @java ProgressiveHistory.select(MCTS, BaseNode)
   */
  select(mcts: MCTS, current: BaseNode): number {
    const mctsAug = mcts as unknown as MCTSWithActionStats;

    let bestIdx = 0;
    let bestValue = -Infinity;
    let numBestFound = 0;

    const parentLog = Math.log(Math.max(1, current.sumLegalChildVisits()));
    const numChildren = current.numLegalMoves();
    const state = current.contextRef().state();
    const moverAgent = state.playerToAgent(state.mover());
    const unvisitedValueEstimate = current.valueEstimateUnvisitedChildren(moverAgent);

    for (let i = 0; i < numChildren; ++i) {
      const child = current.childForNthLegalMove(i);
      let explore: number;
      let meanScore: number;
      const childNumVisits = child === null ? 1 : Math.max(child.numVisits() + child.numVirtualVisits(), 1);

      const move = current.nthLegalMove(i);
      const moveKey = { __moveKey: true, move, numMoves: current.contextRef().trial().numMoves() } as unknown as MoveKey;
      const actionStats = mctsAug.getOrCreateActionStatsEntry(moveKey);
      let meanGlobalActionScore: number;
      if (actionStats.visitCount === 0) {
        meanGlobalActionScore = unvisitedValueEstimate;
      } else {
        meanGlobalActionScore = actionStats.accumulatedScore / actionStats.visitCount;
      }

      if (child === null) {
        meanScore = unvisitedValueEstimate;
        explore = Math.sqrt(parentLog);
      } else {
        meanScore = child.exploitationScore(moverAgent);
        explore = Math.sqrt(parentLog / childNumVisits);
      }

      const ucb1PhValue = meanScore + this.explorationConstant * explore
        + meanGlobalActionScore * (this.progressiveBiasInfluence / ((1.0 - meanScore) * childNumVisits + 1));

      if (ucb1PhValue > bestValue) {
        bestValue = ucb1PhValue;
        bestIdx = i;
        numBestFound = 1;
      } else if (
        ucb1PhValue === bestValue &&
        Math.trunc(Math.random() * 2147483647) % ++numBestFound === 0
      ) {
        bestIdx = i;
      }
    }

    return bestIdx;
  }

  // -------------------------------------------------------------------------

  /**
   * @java ProgressiveHistory.backpropFlags()
   */
  backpropFlags(): number {
    return GLOBAL_ACTION_STATS;
  }

  /**
   * @java ProgressiveHistory.expansionFlags()
   */
  expansionFlags(): number {
    return 0;
  }

  /**
   * @java ProgressiveHistory.customise(String[])
   */
  customise(inputs: string[]): void {
    if (inputs.length > 1) {
      // We have more inputs than just the name of the strategy
      for (let i = 1; i < inputs.length; ++i) {
        const input = inputs[i]!;

        if (input.startsWith("explorationconstant=")) {
          this.explorationConstant = parseFloat(input.substring("explorationconstant=".length));
        } else {
          console.error("ProgressiveHistory ignores unknown customisation: " + input);
        }
      }
    }
  }

  // -------------------------------------------------------------------------
}
