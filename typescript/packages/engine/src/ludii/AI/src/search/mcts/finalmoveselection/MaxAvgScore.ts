// @java AI/src/search/mcts/finalmoveselection/MaxAvgScore.java

import type { MCTS, BaseNode, Move, FinalMoveSelectionStrategy } from "./FinalMoveSelectionStrategy.js";

// Extended escape-hatch interface for the methods used here

/** Extended BaseNode with methods used in MaxAvgScore */
interface MaxAvgScoreBaseNode extends BaseNode {
  numLegalMoves(): number;
  childForNthLegalMove(i: number): MaxAvgScoreBaseNode | null;
  nthLegalMove(i: number): Move;
  contextRef(): { state(): { mover(): number; playerToAgent(p: number): number } };
  expectedScore(moverAgent: number): number;
  valueEstimateUnvisitedChildren(moverAgent: number): number;
}

//-------------------------------------------------------------------------

/**
 * Selects move corresponding to the child with the highest average score
 *
 * @java search.mcts.finalmoveselection.MaxAvgScore
 * @author Dennis Soemers
 */
export class MaxAvgScore implements FinalMoveSelectionStrategy {

  //-------------------------------------------------------------------------

  /**
   * @java MaxAvgScore.selectMove(MCTS, BaseNode)
   */
  selectMove(mcts: MCTS, rootNode: BaseNode): Move {
    const typedRoot = rootNode as unknown as MaxAvgScoreBaseNode;

    let bestIdx = -1;
    let maxAvgScore = -Infinity;
    let numBestFound = 0;

    const state = typedRoot.contextRef().state();
    const numChildren = typedRoot.numLegalMoves();
    const moverAgent = state.playerToAgent(state.mover());

    for (let i = 0; i < numChildren; ++i) {
      const child = typedRoot.childForNthLegalMove(i);
      const avgScore =
        child === null
          ? typedRoot.valueEstimateUnvisitedChildren(moverAgent)
          : child.expectedScore(moverAgent);

      if (avgScore > maxAvgScore) {
        maxAvgScore = avgScore;
        bestIdx = i;
        numBestFound = 1;
      } else if (
        avgScore === maxAvgScore &&
        Math.trunc(Math.random() * 2147483647) % ++numBestFound === 0
      ) {
        bestIdx = i;
      }
    }

    return typedRoot.nthLegalMove(bestIdx);
  }

  //-------------------------------------------------------------------------

  /**
   * @java MaxAvgScore.customise(String[])
   */
  customise(inputs: string[]): void {
    // do nothing
  }

  //-------------------------------------------------------------------------
}
