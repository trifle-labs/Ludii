// @java AI/src/policies/softmax/SoftmaxPolicy.java

import { Policy } from "../Policy.js";

/**
 * Abstract class for softmax policies; policies that compute
 * logits for moves, and then pass them through a softmax to
 * obtain a probability distribution over moves.
 *
 * @java policies/softmax/SoftmaxPolicy.java
 * @author Dennis Soemers
 */
export abstract class SoftmaxPolicy extends Policy {

  //-------------------------------------------------------------------------

  /** Epsilon for epsilon-greedy playouts */
  protected epsilon: number = 0.0;

  /**
   * If >= 0, we'll only actually use this softmax policy in MCTS play-outs
   * for up to this many actions. If a play-out still did not terminate
   * after this many play-out actions, we revert to a random play-out
   * strategy as fallback
   */
  protected playoutActionLimit: number = -1;

  /** Auto-end playouts in a draw if they take more turns than this */
  protected playoutTurnLimit: number = -1;

  //-------------------------------------------------------------------------
}
