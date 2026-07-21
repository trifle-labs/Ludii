// @java Core/src/metadata/ai/features/trees/logits/LogitTree.java

import type { RoleType } from "../../../RoleType.js";
import type { LogitNode } from "./LogitNode.js";

/**
 * Describes a Logit Tree for features (a regression tree representation of a feature set,
 * which outputs logits).
 *
 * @author Dennis Soemers
 */
export class LogitTree {
  /** Role (should either be All, or a specific Player) */
  protected readonly role: RoleType;

  /** Root node of the tree */
  protected readonly rootNode: LogitNode;

  // -------------------------------------------------------------------------

  /**
   * For a single logit tree for one role.
   *
   * @param role The Player (P1, P2, etc.) for which the logit tree should apply,
   * or All if it is applicable to all players in a game.
   * @param root The root node of the tree.
   *
   * @example (logitTree P1 (if "rel:to=<{}>:pat=<els=[f{0}]>" then:(leaf { (pair "Intercept" 1.0) }) else:(leaf { (pair "Intercept" -1.0) })))
   */
  constructor(role: RoleType, root: LogitNode) {
    this.role = role;
    this.rootNode = root;
  }

  // -------------------------------------------------------------------------

  /** @return Root node of this logit tree */
  root(): LogitNode {
    return this.rootNode;
  }

  /** @return The role that this tree belongs to */
  getRole(): RoleType {
    return this.role;
  }

  // -------------------------------------------------------------------------

  toString(): string {
    let sb = `(logitTree ${this.role}\n`;
    sb += this.rootNode.toStringIndented(1) + "\n";
    sb += ")";
    return sb;
  }
}
