// @java AI/src/search/mcts/selection/UCB1Tuned.java

import type { MCTS, BaseNode, SelectionStrategy } from "./SelectionStrategy.js";

//-------------------------------------------------------------------------

/**
 * UCB1-Tuned Selection strategy. The original paper by Auer et al. used 1/4 as the
 * upper bound on the variance of a Bernoulli random variable. We expect values
 * in the [-1, 1] range, rather than the [0, 1] range in our MCTS, so
 * we use 1 as an upper bound on the variance of this random variable.
 *
 * @java search.mcts.selection.UCB1Tuned
 * @author Dennis Soemers
 */
export class UCB1Tuned implements SelectionStrategy {

  //-------------------------------------------------------------------------

  /** Upper bound on variance of random variable in [-1, 1] range */
  protected static readonly VARIANCE_UPPER_BOUND: number = 1.0;

  /** Exploration constant */
  protected explorationConstant: number;

  //-------------------------------------------------------------------------

  /**
   * Constructor with default value sqrt(2.0) for exploration constant
   * @java UCB1Tuned()
   */
  constructor();

  /**
   * Constructor with parameter for exploration constant
   * @param explorationConstant
   * @java UCB1Tuned(double)
   */
  constructor(explorationConstant: number);

  constructor(explorationConstant?: number) {
    this.explorationConstant = explorationConstant !== undefined
      ? explorationConstant
      : Math.sqrt(2.0);
  }

  //-------------------------------------------------------------------------

  /**
   * @java UCB1Tuned.select(MCTS, BaseNode)
   */
  select(mcts: MCTS, current: BaseNode): number {
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
      let exploit: number;
      let sampleVariance: number;
      let visitsFraction: number;

      if (child === null) {
        exploit = unvisitedValueEstimate;
        sampleVariance = UCB1Tuned.VARIANCE_UPPER_BOUND;
        visitsFraction = parentLog;
      } else {
        exploit = child.exploitationScore(moverAgent);
        const numChildVisits = Math.max(child.numVisits() + child.numVirtualVisits(), 1);
        sampleVariance = Math.max(
          child.sumSquaredScores(moverAgent) / numChildVisits - exploit * exploit,
          0.0
        );
        visitsFraction = parentLog / numChildVisits;
      }

      const ucb1TunedValue = exploit +
        Math.sqrt(
          visitsFraction * Math.min(
            UCB1Tuned.VARIANCE_UPPER_BOUND,
            sampleVariance + this.explorationConstant * Math.sqrt(visitsFraction)
          )
        );

      if (ucb1TunedValue > bestValue) {
        bestValue = ucb1TunedValue;
        bestIdx = i;
        numBestFound = 1;
      } else if (
        ucb1TunedValue === bestValue &&
        Math.trunc(Math.random() * 2147483647) % ++numBestFound === 0
      ) {
        bestIdx = i;
      }
    }

    return bestIdx;
  }

  //-------------------------------------------------------------------------

  /**
   * @java UCB1Tuned.backpropFlags()
   */
  backpropFlags(): number {
    return 0;
  }

  /**
   * @java UCB1Tuned.expansionFlags()
   */
  expansionFlags(): number {
    return 0;
  }

  /**
   * @java UCB1Tuned.customise(String[])
   */
  customise(inputs: string[]): void {
    if (inputs.length > 1) {
      // We have more inputs than just the name of the strategy
      for (let i = 1; i < inputs.length; ++i) {
        const input = inputs[i]!;

        if (input.startsWith("explorationconstant=")) {
          this.explorationConstant = parseFloat(
            input.substring("explorationconstant=".length)
          );
        } else {
          console.error("UCB1Tuned ignores unknown customisation: " + input);
        }
      }
    }
  }

  //-------------------------------------------------------------------------
}
