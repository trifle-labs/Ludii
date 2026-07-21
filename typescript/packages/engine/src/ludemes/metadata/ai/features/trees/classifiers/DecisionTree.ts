// @java Core/src/metadata/ai/features/trees/classifiers/DecisionTree.java

import type { RoleType } from "../../../RoleType.js";
import type { DecisionTreeNode } from "./DecisionTreeNode.js";

/**
 * Describes a Decision Tree for features (a decision tree representation of a feature set,
 * which outputs class predictions).
 *
 * @author Dennis Soemers
 */
export class DecisionTree {
  /** Role (should either be All, or a specific Player) */
  protected readonly role: RoleType;

  /** Root node of the tree */
  protected readonly rootNode: DecisionTreeNode;

  // -------------------------------------------------------------------------

  /**
   * For a single decision tree for one role.
   *
   * @param role The Player (P1, P2, etc.) for which the logit tree should apply,
   * or All if it is applicable to all players in a game.
   * @param root The root node of the tree.
   *
   * @example (decisionTree P1 (if "rel:to=<{}>:pat=<els=[f{0}]>" then:(leaf bottom25:0.0 iqr:0.2 top25:0.8) else:(leaf bottom25:0.6 iqr:0.35 top25:0.05)))
   */
  constructor(role: RoleType, root: DecisionTreeNode) {
    this.role = role;
    this.rootNode = root;
  }

  // -------------------------------------------------------------------------

  /** @return The role that this tree was built for. */
  getRole(): RoleType {
    return this.role;
  }

  /** @return The root node of this tree */
  root(): DecisionTreeNode {
    return this.rootNode;
  }

  // -------------------------------------------------------------------------

  toString(): string {
    let sb = `(decisionTree ${this.role}\n`;
    sb += this.rootNode.toStringIndented(1) + "\n";
    sb += ")";
    return sb;
  }
}
