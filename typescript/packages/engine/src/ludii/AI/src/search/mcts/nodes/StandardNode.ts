// @java AI/src/search/mcts/nodes/StandardNode.java

/**
 * Nodes for "standard" MCTS search trees, for deterministic games.
 * This node implementation stores a game state in every node, and
 * assumes every node has a fixed list of legal actions.
 *
 * @java search.mcts.nodes.StandardNode
 * @author Dennis Soemers
 */

import { BaseNode } from "./BaseNode.js";
import { DeterministicNode } from "./DeterministicNode.js";

// ---------------------------------------------------------------------------
// Escape-hatch types

/** @java other.context.Context */
type Context = ConstructorParameters<typeof DeterministicNode>[4];

/** @java other.move.Move */
type Move = Parameters<DeterministicNode["findChildForMove"]>[0];

/** @java search.mcts.MCTS */
type MCTS = ConstructorParameters<typeof DeterministicNode>[0];

// ---------------------------------------------------------------------------

/**
 * Nodes for "standard" MCTS search trees, for deterministic games.
 *
 * @java search.mcts.nodes.StandardNode
 */
export class StandardNode extends DeterministicNode {

  // -------------------------------------------------------------------------

  /**
   * Constructor
   *
   * @java StandardNode(MCTS, BaseNode, Move, Move, Context)
   */
  public constructor(
    mcts: MCTS,
    parent: BaseNode | null,
    parentMove: Move | null,
    parentMoveWithoutConseq: Move | null,
    context: Context,
  ) {
    super(mcts, parent, parentMove, parentMoveWithoutConseq, context);
  }

  // -------------------------------------------------------------------------
}
