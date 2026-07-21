// @java Core/src/metadata/ai/agents/mcts/selection/Ag0.java

import { Selection } from "./Selection.js";

/**
 * Describes the selection strategy also used by AlphaGo Zero (and AlphaZero).
 * Requires that a learned selection policy (based on features) has been
 * described for the MCTS agent that uses this selection strategy.
 *
 * @author Dennis Soemers
 */
export class Ag0 extends Selection {
  /** The exploration constant */
  protected readonly explorationConstant: number;

  // -------------------------------------------------------------------------

  /**
   * Constructor
   *
   * @param explorationConstant The value to use for the exploration constant [2.5].
   *
   * @example (ag0)
   */
  constructor(explorationConstant: number | null = null) {
    super();
    this.explorationConstant = explorationConstant ?? 2.5;
  }

  // -------------------------------------------------------------------------

  override requiresLearnedSelectionPolicy(): boolean {
    return true;
  }

  override toString(): string {
    return `(ag0 ${this.explorationConstant})`;
  }
}
