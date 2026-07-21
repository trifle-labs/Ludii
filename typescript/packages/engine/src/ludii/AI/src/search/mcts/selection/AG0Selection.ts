// @java AI/src/search/mcts/selection/AG0Selection.java

/**
 * Selection strategy used by AlphaGo Zero (described there as a variant of
 * PUCB1 proposed by Rosin (2011), but it's a variant, not exactly the same).
 *
 * @java search.mcts.selection.AG0Selection
 * @author Dennis Soemers
 */

import type { MCTS, BaseNode, SelectionStrategy } from "./SelectionStrategy.js";

// ---------------------------------------------------------------------------

/**
 * AG0 (AlphaGo Zero) selection strategy.
 *
 * @java search.mcts.selection.AG0Selection
 */
export class AG0Selection implements SelectionStrategy {

  // -------------------------------------------------------------------------

  /** @java AG0Selection.explorationConstant */
  protected explorationConstant: number;

  // -------------------------------------------------------------------------

  /**
   * Constructor with default exploration constant of 2.5.
   * @java AG0Selection()
   */
  constructor();

  /**
   * Constructor with custom exploration constant.
   * @java AG0Selection(double)
   */
  constructor(explorationConstant: number);

  constructor(explorationConstant?: number) {
    this.explorationConstant = explorationConstant !== undefined ? explorationConstant : 2.5;
  }

  // -------------------------------------------------------------------------

  /**
   * @java AG0Selection.select(MCTS, BaseNode)
   */
  select(_mcts: MCTS, current: BaseNode): number {
    let bestIdx = 0;
    let bestValue = -Infinity;
    let numBestFound = 0;

    const distribution = current.learnedSelectionPolicy();
    const parentSqrt = Math.sqrt(current.sumLegalChildVisits());

    const numChildren = current.numLegalMoves();
    const state = current.contextRef().state();
    const moverAgent = state.playerToAgent(state.mover());
    const unvisitedValueEstimate = current.valueEstimateUnvisitedChildren(moverAgent);

    for (let i = 0; i < numChildren; ++i) {
      const child = current.childForNthLegalMove(i);
      let exploit: number;
      let numVisits: number;

      if (child === null) {
        exploit = unvisitedValueEstimate;
        numVisits = 0;
      } else {
        exploit = child.exploitationScore(moverAgent);
        numVisits = child.numVisits() + child.numVirtualVisits();
      }

      const priorProb = distribution.get(i);
      const explore = (parentSqrt === 0.0) ? 1.0 : parentSqrt / (1.0 + numVisits);

      const pucb1Value = exploit + this.explorationConstant * priorProb * explore;

      if (pucb1Value > bestValue) {
        bestValue = pucb1Value;
        bestIdx = i;
        numBestFound = 1;
      } else if (
        pucb1Value === bestValue &&
        Math.trunc(Math.random() * 2147483647) % ++numBestFound === 0
      ) {
        bestIdx = i;
      }
    }

    return bestIdx;
  }

  // -------------------------------------------------------------------------

  /**
   * @java AG0Selection.backpropFlags()
   */
  backpropFlags(): number {
    return 0;
  }

  /**
   * @java AG0Selection.expansionFlags()
   */
  expansionFlags(): number {
    return 0;
  }

  /**
   * @java AG0Selection.customise(String[])
   */
  customise(inputs: string[]): void {
    if (inputs.length > 1) {
      // We have more inputs than just the name of the strategy
      for (let i = 1; i < inputs.length; ++i) {
        const input = inputs[i]!;

        if (input.startsWith("explorationconstant=")) {
          this.explorationConstant = parseFloat(input.substring("explorationconstant=".length));
        } else {
          console.error("AG0Selection ignores unknown customisation: " + input);
        }
      }
    }
  }

  // -------------------------------------------------------------------------
}
