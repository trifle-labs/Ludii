// @java AI/src/search/mcts/selection/McBRAVE.java

import type { MCTS, BaseNode, MoveKey, NodeStatistics, SelectionStrategy } from "./SelectionStrategy.js";

/** BackpropagationStrategy.GRAVE_STATS = 0x1 */
const GRAVE_STATS = 0x1;

//-------------------------------------------------------------------------

/**
 * McBRAVE selection strategy (Monte-Carlo BRAVE).
 *
 * @java search.mcts.selection.McBRAVE
 * @author Dennis Soemers
 */
export class McBRAVE implements SelectionStrategy {

  //-------------------------------------------------------------------------

  /** Hyperparameter used in computation of weight for AMAF term */
  protected readonly bias: number;

  //-------------------------------------------------------------------------

  /**
   * Constructor with default value of bias = 10^(-6),
   * loosely based on hyperparameter tuning in GRAVE paper.
   * @java McBRAVE()
   */
  constructor();

  /**
   * Constructor
   * @param bias
   * @java McBRAVE(double)
   */
  constructor(bias: number);

  constructor(bias?: number) {
    this.bias = bias !== undefined ? bias : 10.0e-6;
  }

  //-------------------------------------------------------------------------

  /**
   * @java McBRAVE.select(MCTS, BaseNode)
   */
  select(mcts: MCTS, current: BaseNode): number {
    let bestIdx = 0;
    let bestValue = -Infinity;
    let numBestFound = 0;

    const numChildren = current.numLegalMoves();
    const state = current.contextRef().state();
    const moverAgent = state.playerToAgent(state.mover());
    const unvisitedValueEstimate = current.valueEstimateUnvisitedChildren(moverAgent);

    for (let i = 0; i < numChildren; ++i) {
      const child = current.childForNthLegalMove(i);
      let meanScore: number;
      let meanAMAF: number;
      let beta: number;

      if (child === null) {
        meanScore = unvisitedValueEstimate;
        meanAMAF = 0.0;
        beta = 0.0;
      } else {
        meanScore = child.exploitationScore(moverAgent);
        const move = child.parentMove();

        let accumVisits = 0;
        let accumScore = 0.0;
        const moveKey = { __moveKey: true, move, numMoves: current.contextRef().trial().numMoves() } as unknown as MoveKey;

        let raveNode: BaseNode | null = current;
        while (raveNode !== null) {
          const graveStats: NodeStatistics | null = raveNode.graveStats(moveKey);

          if (graveStats !== null) {
            accumScore += graveStats.accumulatedScore;
            accumVisits += graveStats.visitCount;
          }

          raveNode = raveNode.parent();
        }

        if (accumVisits === 0) {
          meanAMAF = 0.0;
          beta = 0.0;
        } else {
          const childVisits = child.numVisits() + child.numVirtualVisits();
          meanAMAF = accumScore / accumVisits;
          beta = accumVisits / (accumVisits + childVisits + this.bias * accumVisits * childVisits);
        }
      }

      const graveValue = (1.0 - beta) * meanScore + beta * meanAMAF;

      if (graveValue > bestValue) {
        bestValue = graveValue;
        bestIdx = i;
        numBestFound = 1;
      } else if (
        graveValue === bestValue &&
        Math.trunc(Math.random() * 2147483647) % ++numBestFound === 0
      ) {
        bestIdx = i;
      }
    }

    return bestIdx;
  }

  //-------------------------------------------------------------------------

  /**
   * @java McBRAVE.backpropFlags()
   */
  backpropFlags(): number {
    return GRAVE_STATS;
  }

  /**
   * @java McBRAVE.expansionFlags()
   */
  expansionFlags(): number {
    return 0;
  }

  /**
   * @java McBRAVE.customise(String[])
   */
  customise(inputs: string[]): void {
    // TODO
  }

  //-------------------------------------------------------------------------
}
