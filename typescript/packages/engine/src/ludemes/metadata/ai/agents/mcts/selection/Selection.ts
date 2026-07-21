// @java Core/src/metadata/ai/agents/mcts/selection/Selection.java

/**
 * Abstract class for Selection strategies for MCTS in AI metadata.
 *
 * @author Dennis Soemers
 */
export abstract class Selection {
  /**
   * @return Do we require a learned selection policy?
   */
  requiresLearnedSelectionPolicy(): boolean {
    return false;
  }

  abstract toString(): string;
}
