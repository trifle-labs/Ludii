// @java AI/src/search/mcts/selection/ExItSelection.java

import type { MCTS, BaseNode, FVector, SelectionStrategy } from "./SelectionStrategy.js";

//-------------------------------------------------------------------------

/**
 * Selection strategy used by Anthony, Tian, and Barber (2017) for
 * Expert Iteration
 *
 * @java search.mcts.selection.ExItSelection
 * @author Dennis Soemers
 */
export class ExItSelection implements SelectionStrategy {

  //-------------------------------------------------------------------------

  /** The standard exploration constant of UCB1 */
  protected explorationConstant: number;

  /**
   * Weight parameter for the prior policy term (w_a in the ExIt paper)
   *
   * Note: paper mentions a good value for this hyperparameter may be
   * close to the average number of simulations per action at the root...
   * which is going to wildly vary per game and per time-control setting.
   */
  protected priorPolicyWeight: number;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @param priorPolicyWeight
   * @java ExItSelection(double)
   */
  constructor(priorPolicyWeight: number);

  /**
   * Constructor
   * @param explorationConstant
   * @param priorPolicyWeight
   * @java ExItSelection(double, double)
   */
  constructor(explorationConstant: number, priorPolicyWeight: number);

  constructor(explorationConstantOrPriorPolicyWeight: number, priorPolicyWeight?: number) {
    if (priorPolicyWeight !== undefined) {
      this.explorationConstant = explorationConstantOrPriorPolicyWeight;
      this.priorPolicyWeight = priorPolicyWeight;
    } else {
      this.explorationConstant = Math.sqrt(2.0);
      this.priorPolicyWeight = explorationConstantOrPriorPolicyWeight;
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @java ExItSelection.select(MCTS, BaseNode)
   */
  select(mcts: MCTS, current: BaseNode): number {
    let bestIdx = 0;
    let bestValue = -Infinity;
    let numBestFound = 0;

    const distribution: FVector = current.learnedSelectionPolicy();
    const parentLog = Math.log(Math.max(1, current.sumLegalChildVisits()));

    const numChildren = current.numLegalMoves();
    const state = current.contextRef().state();
    const moverAgent = state.playerToAgent(state.mover());
    const unvisitedValueEstimate = current.valueEstimateUnvisitedChildren(moverAgent);

    for (let i = 0; i < numChildren; ++i) {
      const child = current.childForNthLegalMove(i);
      let exploit: number;
      let explore: number;
      let numVisits: number;

      if (child === null) {
        exploit = unvisitedValueEstimate;
        numVisits = 0;
        explore = Math.sqrt(parentLog);
      } else {
        exploit = child.exploitationScore(moverAgent);
        numVisits = Math.max(child.numVisits() + child.numVirtualVisits(), 1);
        explore = Math.sqrt(parentLog / numVisits);
      }

      const priorProb = distribution.get(i);
      const priorTerm = priorProb / (numVisits + 1);

      const ucb1pValue =
        exploit +
        this.explorationConstant * explore +
        this.priorPolicyWeight * priorTerm;

      if (ucb1pValue > bestValue) {
        bestValue = ucb1pValue;
        bestIdx = i;
        numBestFound = 1;
      } else if (
        ucb1pValue === bestValue &&
        Math.trunc(Math.random() * 2147483647) % ++numBestFound === 0
      ) {
        bestIdx = i;
      }
    }

    return bestIdx;
  }

  //-------------------------------------------------------------------------

  /**
   * @java ExItSelection.backpropFlags()
   */
  backpropFlags(): number {
    return 0;
  }

  /**
   * @java ExItSelection.expansionFlags()
   */
  expansionFlags(): number {
    return 0;
  }

  /**
   * @java ExItSelection.customise(String[])
   */
  customise(inputs: string[]): void {
    if (inputs.length > 1) {
      // we have more inputs than just the name of the strategy
      for (let i = 1; i < inputs.length; ++i) {
        const input = inputs[i]!;

        if (input.startsWith("explorationconstant=")) {
          this.explorationConstant = parseFloat(
            input.substring("explorationconstant=".length)
          );
        } else {
          console.error("ExItSelection ignores unknown customisation: " + input);
        }
      }
    }
  }

  //-------------------------------------------------------------------------
}
