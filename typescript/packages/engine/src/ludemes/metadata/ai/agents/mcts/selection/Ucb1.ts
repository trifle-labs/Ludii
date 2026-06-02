// @java Core/src/metadata/ai/agents/mcts/selection/Ucb1.java

import { Selection } from "./Selection.js";

/**
 * Describes the UCB1 selection strategy, which is one of the most straightforward
 * and simple Selection strategies, used by the standard UCT variant of MCTS.
 *
 * @author Dennis Soemers
 */
export class Ucb1 extends Selection {
  // WARNING: The weird capitalisation of the class name is INTENTIONAL!
  // This makes the type name in the grammar and documentation look better,
  // as just "<ucb1>" instead of "<uCB1>".

  /** The exploration constant */
  protected readonly explorationConstant: number;

  // -------------------------------------------------------------------------

  /**
   * Constructor
   *
   * @param explorationConstant The value to use for the exploration constant [square root of 2].
   *
   * @example (ucb1)
   * @example (ucb1 0.6)
   */
  constructor(explorationConstant: number | null = null) {
    super();
    this.explorationConstant = explorationConstant ?? Math.sqrt(2.0);
  }

  // -------------------------------------------------------------------------

  override toString(): string {
    return `(ucb1 ${this.explorationConstant})`;
  }
}
