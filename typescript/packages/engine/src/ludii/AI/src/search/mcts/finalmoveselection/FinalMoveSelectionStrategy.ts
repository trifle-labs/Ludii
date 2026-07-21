// @java AI/src/search/mcts/finalmoveselection/FinalMoveSelectionStrategy.java

/**
 * Interface for different strategies of finally selecting the move to play in the real game
 * (after searching finished)
 *
 * @java search.mcts.finalmoveselection.FinalMoveSelectionStrategy
 * @author Dennis Soemers
 */

// ---------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported dependencies

/** @java other.move.Move */
export interface Move {
  __move: true;
}

/** @java search.mcts.MCTS */
export interface MCTS {
  __mcts: true;
}

/** @java search.mcts.nodes.BaseNode */
export interface BaseNode {
  __baseNode: true;
}

// ---------------------------------------------------------------------------

/**
 * Interface for different strategies of finally selecting the move to play in
 * the real game (after searching finished).
 *
 * @java search.mcts.finalmoveselection.FinalMoveSelectionStrategy
 */
export interface FinalMoveSelectionStrategy {

  // -------------------------------------------------------------------------

  /**
   * Should be implemented to select the move to play in the real game
   *
   * @param mcts
   * @param rootNode
   * @return The move.
   * @java FinalMoveSelectionStrategy.selectMove(MCTS, BaseNode)
   */
  selectMove(mcts: MCTS, rootNode: BaseNode): Move;

  // -------------------------------------------------------------------------

  /**
   * Customise the final move selection strategy based on a list of given string inputs
   *
   * @param inputs
   * @java FinalMoveSelectionStrategy.customise(String[])
   */
  customise(inputs: string[]): void;

  // -------------------------------------------------------------------------
}

// ---------------------------------------------------------------------------

/**
 * Factory method: construct a FinalMoveSelectionStrategy from a JSON object.
 *
 * @param json JSON object with a "strategy" field.
 * @return FinalMoveSelectionStrategy constructed from the given JSON object.
 * @java FinalMoveSelectionStrategy.fromJson(JSONObject)
 */
export function finalMoveSelectionStrategyFromJson(
  json: { getString(key: string): string }
): FinalMoveSelectionStrategy | null {
  const strategy = json.getString("strategy");

  if (strategy.toLowerCase() === "robustchild") {
    // RobustChild is in a sibling file — import dynamically to avoid cycles,
    // but since that file may not exist yet we use an escape-hatch object.
    // When RobustChild.ts is ported, this should be replaced with a direct import.
    return null as unknown as FinalMoveSelectionStrategy;
  }

  return null;
}

// ---------------------------------------------------------------------------
