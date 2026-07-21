// @java Core/src/metadata/ai/features/trees/FeatureTrees.java

import type { LogitTree } from "./logits/LogitTree.js";
import type { DecisionTree } from "./classifiers/DecisionTree.js";

/**
 * Describes one or more sets of features (local, geometric patterns),
 * represented as decision / regression trees.
 *
 * @author Dennis Soemers
 */
export class FeatureTrees {
  /** Logit trees */
  protected logitTrees: LogitTree[] | null;

  /** Decision trees for predicting bottom 25% / IQR / top 25% */
  protected decisionTrees: DecisionTree[] | null;

  // -------------------------------------------------------------------------

  /**
   * For a variety of different types of trees, each for one or more roles.
   *
   * @param logitTrees One or more logit trees (each for the All
   * role or for a specific player).
   * @param decisionTrees One or more decision trees (each for the All
   * role or for a specific player).
   *
   * @example (featureTrees logitTrees:{
   * (logitTree P1 (if "rel:to=<{}>:pat=<els=[f{0}]>" then:(leaf { (pair "Intercept" 1.0) }) else:(leaf { (pair "Intercept" -1.0) })))
   * })
   */
  constructor(
    logitTrees: LogitTree[] | null = null,
    decisionTrees: DecisionTree[] | null = null,
  ) {
    this.logitTrees = logitTrees;
    this.decisionTrees = decisionTrees;
  }

  // -------------------------------------------------------------------------

  /** @return Array of logit trees. */
  getLogitTrees(): LogitTree[] | null {
    return this.logitTrees;
  }

  /** @return Array of decision trees. */
  getDecisionTrees(): DecisionTree[] | null {
    return this.decisionTrees;
  }

  // -------------------------------------------------------------------------

  toString(): string {
    let sb = "(featureTrees \n";

    if (this.logitTrees != null) {
      sb += "logitTrees:{\n";
      for (const tree of this.logitTrees) {
        sb += tree.toString() + "\n";
      }
      sb += "}\n";
    }

    if (this.decisionTrees != null) {
      sb += "decisionTrees:{\n";
      for (const tree of this.decisionTrees) {
        sb += tree.toString() + "\n";
      }
      sb += "}\n";
    }

    sb += ")";
    return sb;
  }
}
