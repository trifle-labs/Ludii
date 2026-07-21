// @java AI/src/search/mcts/finalmoveselection/RobustChild.java

import type { MCTS, BaseNode, Move, FinalMoveSelectionStrategy } from "./FinalMoveSelectionStrategy.js";

// Escape-hatch for extended BaseNode methods needed here

/** Extended BaseNode with methods used in RobustChild */
interface RobustChildBaseNode extends BaseNode {
  numLegalMoves(): number;
  childForNthLegalMove(i: number): RobustChildBaseNode | null;
  nthLegalMove(i: number): Move;
  contextRef(): { state(): { mover(): number; playerToAgent(p: number): number } };
  numVisits(): number;
  expectedScore(moverAgent: number): number;
  learnedSelectionPolicy(): { get(i: number): number } | null;
}

/** Extended MCTS with learnedSelectionPolicy */
interface RobustChildMCTS extends MCTS {
  learnedSelectionPolicy(): unknown | null;
}

//-------------------------------------------------------------------------

/**
 * Selects move corresponding to the most robust child (highest visit count),
 * with an additional tie-breaker based on value estimates. If the MCTS
 * has a learned selection policy, that can be used as a second tie-breaker.
 *
 * @java search.mcts.finalmoveselection.RobustChild
 * @author Dennis Soemers
 */
export class RobustChild implements FinalMoveSelectionStrategy {

  //-------------------------------------------------------------------------

  /**
   * @java RobustChild.selectMove(MCTS, BaseNode)
   */
  selectMove(mcts: MCTS, rootNode: BaseNode): Move {
    const typedMcts = mcts as unknown as RobustChildMCTS;
    const typedRoot = rootNode as unknown as RobustChildBaseNode;

    const bestActions: Move[] = [];
    let bestActionValueEstimate = -Infinity;
    let bestActionPolicyPrior = -Infinity;
    const rootState = typedRoot.contextRef().state();
    const moverAgent = rootState.playerToAgent(rootState.mover());
    let maxNumVisits = Number.MIN_SAFE_INTEGER;

    const priorPolicy: { get(i: number): number } | null =
      typedMcts.learnedSelectionPolicy() === null
        ? null
        : typedRoot.learnedSelectionPolicy();

    const numChildren = typedRoot.numLegalMoves();
    for (let i = 0; i < numChildren; ++i) {
      const child = typedRoot.childForNthLegalMove(i);
      const numVisits = child === null ? 0 : child.numVisits();
      const childValueEstimate = child === null ? 0.0 : child.expectedScore(moverAgent);
      const childPriorPolicy = priorPolicy === null ? -1.0 : priorPolicy.get(i);

      if (numVisits > maxNumVisits) {
        maxNumVisits = numVisits;
        bestActions.length = 0;
        bestActionValueEstimate = childValueEstimate;
        bestActionPolicyPrior = childPriorPolicy;
        bestActions.push(typedRoot.nthLegalMove(i));
      } else if (numVisits === maxNumVisits) {
        if (childValueEstimate > bestActionValueEstimate) {
          // Tie-breaker; prefer higher value estimates
          bestActions.length = 0;
          bestActionValueEstimate = childValueEstimate;
          bestActionPolicyPrior = childPriorPolicy;
          bestActions.push(typedRoot.nthLegalMove(i));
        } else if (childValueEstimate === bestActionValueEstimate) {
          // Tie for both num visits and also for estimated value; prefer higher prior policy
          if (childPriorPolicy > bestActionPolicyPrior) {
            bestActions.length = 0;
            bestActionValueEstimate = childValueEstimate;
            bestActionPolicyPrior = childPriorPolicy;
            bestActions.push(typedRoot.nthLegalMove(i));
          } else if (childPriorPolicy === bestActionPolicyPrior) {
            // Tie for everything
            bestActions.push(typedRoot.nthLegalMove(i));
          }
        }
      }
    }

    return bestActions[Math.floor(Math.random() * bestActions.length)]!;
  }

  //-------------------------------------------------------------------------

  /**
   * @java RobustChild.customise(String[])
   */
  customise(inputs: string[]): void {
    // Do nothing
  }

  //-------------------------------------------------------------------------
}
