// @java AI/src/search/mcts/selection/ProgressiveBias.java

import type { MCTS, BaseNode, SelectionStrategy } from "./SelectionStrategy.js";

/** MCTS.HEURISTIC_INIT = 0x1 */
const HEURISTIC_INIT = 0x1;

//-------------------------------------------------------------------------

/**
 * Progressive Bias, as described in "Progressive Strategies for
 * Monte-Carlo Tree Search" by Chaslot et al.
 *
 * Assumes that a heuristic function has been defined inside the MCTS object.
 *
 * @java search.mcts.selection.ProgressiveBias
 * @author Dennis Soemers
 */
export class ProgressiveBias implements SelectionStrategy {

  //-------------------------------------------------------------------------

  /** Exploration constant */
  protected explorationConstant: number;

  //-------------------------------------------------------------------------

  /**
   * Constructor with default value sqrt(2.0) for exploration constant
   * @java ProgressiveBias()
   */
  constructor();

  /**
   * Constructor with parameter for exploration constant
   * @param explorationConstant
   * @java ProgressiveBias(double)
   */
  constructor(explorationConstant: number);

  constructor(explorationConstant?: number) {
    this.explorationConstant = explorationConstant !== undefined
      ? explorationConstant
      : Math.sqrt(2.0);
  }

  //-------------------------------------------------------------------------

  /**
   * @java ProgressiveBias.select(MCTS, BaseNode)
   */
  select(mcts: MCTS, current: BaseNode): number {
    console.assert(mcts.heuristics() !== null);

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
      let heuristicScore: number;

      if (child === null) {
        exploit = unvisitedValueEstimate;
        explore = Math.sqrt(parentLog);
        heuristicScore = unvisitedValueEstimate;
      } else {
        exploit = child.exploitationScore(moverAgent);
        const numVisits = Math.max(child.numVisits() + child.numVirtualVisits(), 1);
        explore = Math.sqrt(parentLog / numVisits);

        // No idea what kind of weight we should use, just guessing 10.0 for now based on nothing
        heuristicScore = (10.0 * child.heuristicValueEstimates()[moverAgent]!) / numVisits;
      }

      const ucb1Value = exploit + this.explorationConstant * explore + heuristicScore;

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
   * @java ProgressiveBias.backpropFlags()
   */
  backpropFlags(): number {
    return 0;
  }

  /**
   * @java ProgressiveBias.expansionFlags()
   */
  expansionFlags(): number {
    return HEURISTIC_INIT;
  }

  /**
   * @java ProgressiveBias.customise(String[])
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
          console.error("Progressive Bias ignores unknown customisation: " + input);
        }
      }
    }
  }

  //-------------------------------------------------------------------------
}
