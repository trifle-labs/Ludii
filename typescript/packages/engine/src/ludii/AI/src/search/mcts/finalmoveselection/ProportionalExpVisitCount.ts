// @java AI/src/search/mcts/finalmoveselection/ProportionalExpVisitCount.java

import type { MCTS, BaseNode, Move, FinalMoveSelectionStrategy } from "./FinalMoveSelectionStrategy.js";

//-------------------------------------------------------------------------

/**
 * Selects moves proportionally to exponentiated visit counts.
 *
 * This strategy should never be used for "competitive" play, but can be useful
 * to generate more variety in experience in self-play.
 *
 * @java search.mcts.finalmoveselection.ProportionalExpVisitCount
 * @author Dennis Soemers
 */
export class ProportionalExpVisitCount implements FinalMoveSelectionStrategy {

  //-------------------------------------------------------------------------

  /** Temperature parameter tau (all visit counts will be raised to this power to generate distribution) */
  protected tau: number;

  //-------------------------------------------------------------------------

  /**
   * Constructor with temperature parameter tau
   * (1.0 = proportional to visit counts, 0.0 = greedy)
   * @param tau
   * @java ProportionalExpVisitCount(double)
   */
  constructor(tau: number) {
    this.tau = tau;
  }

  //-------------------------------------------------------------------------

  /**
   * @java ProportionalExpVisitCount.selectMove(MCTS, BaseNode)
   */
  selectMove(mcts: MCTS, rootNode: BaseNode): Move {
    const distribution = (rootNode as unknown as { computeVisitCountPolicy(tau: number): { sampleProportionally(): number } }).computeVisitCountPolicy(this.tau);
    const actionIndex = distribution.sampleProportionally();
    return (rootNode as unknown as { nthLegalMove(i: number): Move }).nthLegalMove(actionIndex);
  }

  //-------------------------------------------------------------------------

  /**
   * @java ProportionalExpVisitCount.customise(String[])
   */
  customise(inputs: string[]): void {
    for (const input of inputs) {
      if (input.startsWith("tau=")) {
        this.tau = parseFloat(input.substring("tau=".length));
      }
    }
  }

  //-------------------------------------------------------------------------
}
