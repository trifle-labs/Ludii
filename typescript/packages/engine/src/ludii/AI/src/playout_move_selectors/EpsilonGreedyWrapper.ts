// @java AI/src/playout_move_selectors/EpsilonGreedyWrapper.java

/**
 * Epsilon-greedy wrapper around a Playout Move Selector
 *
 * @java playout_move_selectors.EpsilonGreedyWrapper
 * @author Dennis Soemers
 */

import {
  PlayoutMoveSelector,
  type IsMoveReallyLegal,
  type IContext,
} from "../../../../ludemes/other/playout/PlayoutMoveSelector.js";
import type { IMove } from "../../../../ludemes/other/context/Context.js";

// ---------------------------------------------------------------------------

/**
 * Epsilon-greedy wrapper around a Playout Move Selector.
 *
 * @java playout_move_selectors.EpsilonGreedyWrapper
 */
export class EpsilonGreedyWrapper extends PlayoutMoveSelector {

  // -------------------------------------------------------------------------

  /** The wrapped playout move selector */
  protected readonly wrapped: PlayoutMoveSelector;

  /** Probability of picking uniformly at random */
  protected readonly epsilon: number;

  // -------------------------------------------------------------------------

  /**
   * Constructor
   * @param wrapped
   * @param epsilon
   * @java EpsilonGreedyWrapper(PlayoutMoveSelector, double)
   */
  public constructor(wrapped: PlayoutMoveSelector, epsilon: number) {
    super();
    this.wrapped = wrapped;
    this.epsilon = epsilon;
  }

  // -------------------------------------------------------------------------

  /**
   * @java EpsilonGreedyWrapper.selectMove(Context, FastArrayList<Move>, int, IsMoveReallyLegal)
   */
  public override selectMove(
    context: IContext,
    maybeLegalMoves: IMove[],
    p: number,
    isMoveReallyLegal: IsMoveReallyLegal
  ): IMove | null {
    return this.wrapped.selectMove(context, maybeLegalMoves, p, isMoveReallyLegal);
  }

  /**
   * @java EpsilonGreedyWrapper.wantsPlayUniformRandomMove()
   */
  public override wantsPlayUniformRandomMove(): boolean {
    return Math.random() < this.epsilon;
  }

  // -------------------------------------------------------------------------
}
