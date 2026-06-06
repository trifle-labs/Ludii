// @java AI/src/search/mcts/selection/UCB1.java

import type { MCTS, BaseNode, SelectionStrategy } from "./SelectionStrategy.js";

//-------------------------------------------------------------------------

/**
 * UCB1 Selection Strategy, as commonly used in UCT.
 *
 * @java search.mcts.selection.UCB1
 * @author Dennis Soemers
 */
export class UCB1 implements SelectionStrategy {

  //-------------------------------------------------------------------------

  /** Exploration constant */
  protected explorationConstant: number;

  //-------------------------------------------------------------------------

  /**
   * Constructor with default value sqrt(2.0) for exploration constant
   * @java UCB1()
   */
  constructor();

  /**
   * Constructor with parameter for exploration constant
   * @param explorationConstant
   * @java UCB1(double)
   */
  constructor(explorationConstant: number);

  constructor(explorationConstant?: number) {
    this.explorationConstant = explorationConstant !== undefined
      ? explorationConstant
      : Math.sqrt(2.0);
  }

  //-------------------------------------------------------------------------

  /**
   * @java UCB1.select(MCTS, BaseNode)
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
      let explore: number;

      if (child === null) {
        exploit = unvisitedValueEstimate;
        explore = Math.sqrt(parentLog);
      } else {
        exploit = child.exploitationScore(moverAgent);
        const numVisits = Math.max(child.numVisits() + child.numVirtualVisits(), 1);
        explore = Math.sqrt(parentLog / numVisits);
      }

      const ucb1Value = exploit + this.explorationConstant * explore;

      if (ucb1Value > bestValue) {
        bestValue = ucb1Value;
        bestIdx = i;
        numBestFound = 1;
      } else if (
        ucb1Value === bestValue &&
        Math.trunc(Math.random() * 2147483647) % ++numBestFound === 0
      ) {
        bestIdx = i;
      }
    }

    return bestIdx;
  }

  //-------------------------------------------------------------------------

  /**
   * @java UCB1.backpropFlags()
   */
  backpropFlags(): number {
    return 0;
  }

  /**
   * @java UCB1.expansionFlags()
   */
  expansionFlags(): number {
    return 0;
  }

  /**
   * @java UCB1.customise(String[])
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
          console.error("UCB1 ignores unknown customisation: " + input);
        }
      }
    }
  }

  //-------------------------------------------------------------------------
}
