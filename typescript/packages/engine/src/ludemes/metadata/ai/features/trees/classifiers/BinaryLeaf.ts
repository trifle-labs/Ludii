// @java Core/src/metadata/ai/features/trees/classifiers/BinaryLeaf.java

import { DecisionTreeNode } from "./DecisionTreeNode.js";

/**
 * Describes a leaf node in a binary classification tree for features; it contains
 * only a predicted probability for "top move".
 *
 * @author Dennis Soemers
 */
export class BinaryLeaf extends DecisionTreeNode {
  /** Predicted probability of being the/a top move */
  protected readonly prob: number;

  // -------------------------------------------------------------------------

  /**
   * Defines the feature (condition) and the predicted probability of being a top move.
   * @param prob Predicted probability of being a top move.
   *
   * @example (binaryLeaf 0.6)
   */
  constructor(prob: number) {
    super();
    this.prob = prob;
  }

  // -------------------------------------------------------------------------

  override collectFeatureStrings(_outFeatureStrings: Set<string>): void {
    // Do nothing
  }

  // -------------------------------------------------------------------------

  /** @return Move probability predicted by this leaf. */
  getProb(): number {
    return this.prob;
  }

  // -------------------------------------------------------------------------

  override toStringIndented(_indent: number): string {
    return this.toString();
  }

  override toString(): string {
    return `(binaryLeaf ${this.prob})`;
  }
}
