// @java Core/src/metadata/ai/agents/mcts/Mcts.java

import type { Selection } from "./selection/Selection.js";
import { Ucb1 } from "./selection/Ucb1.js";

/**
 * Describes a Monte-Carlo tree search agent.
 *
 * @author Dennis Soemers
 */
export class Mcts {
  // WARNING: The weird capitalisation of the class name is INTENTIONAL!
  // This makes the type name in the grammar and documentation look better,
  // as just "<mcts>" instead of "<mCTS>".

  /** Our Selection strategy */
  protected readonly selection: Selection;

  // -------------------------------------------------------------------------

  /**
   * Constructor
   *
   * @param selection The Selection strategy to be used by this MCTS agent [UCB1].
   *
   * @example (mcts)
   */
  constructor(selection: Selection | null = null) {
    this.selection = selection ?? new Ucb1(null);

    if (this.selection.requiresLearnedSelectionPolicy()) {
      // TODO: check whether a learned selection policy was specified
    }
  }

  // -------------------------------------------------------------------------

  toString(): string {
    return `(mcts ${this.selection})`;
  }
}
