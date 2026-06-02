// @java Core/src/metadata/ai/features/trees/classifiers/Leaf.java

import { DecisionTreeNode } from "./DecisionTreeNode.js";

/**
 * Describes a leaf node in a binary classification tree for features; it contains
 * only a predicted probability for "best move".
 *
 * @author Dennis Soemers
 */
export class Leaf extends DecisionTreeNode {
  /** Predicted probability of being a bottom-25% move */
  protected readonly bottom25Prob: number;

  /** Predicted probability of being a move in the Interquartile Range */
  protected readonly iqrProb: number;

  /** Predicted probability of being a top-25% move */
  protected readonly top25Prob: number;

  // -------------------------------------------------------------------------

  /**
   * Defines the feature (condition) and the predicted probabilities for different classes.
   * @param bottom25 Predicted probability of being a bottom-25% move.
   * @param iqr Predicted probability of being a move in the Interquartile Range.
   * @param top25 Predicted probability of being a top-25% move.
   *
   * @example (leaf bottom25:0.0 iqr:0.2 top25:0.8)
   */
  constructor(bottom25: number, iqr: number, top25: number) {
    super();
    this.bottom25Prob = bottom25;
    this.iqrProb = iqr;
    this.top25Prob = top25;
  }

  // -------------------------------------------------------------------------

  override collectFeatureStrings(_outFeatureStrings: Set<string>): void {
    // Do nothing — leaf has no features
  }

  // -------------------------------------------------------------------------

  /** @return Predicted probability for the bottom-25% class */
  getBottom25Prob(): number {
    return this.bottom25Prob;
  }

  /** @return Predicted probability for the IQR class */
  getIqrProb(): number {
    return this.iqrProb;
  }

  /** @return Predicted probability for the top-25% class */
  getTop25Prob(): number {
    return this.top25Prob;
  }

  // -------------------------------------------------------------------------

  override toStringIndented(_indent: number): string {
    return this.toString();
  }

  override toString(): string {
    return `(leaf bottom25:${this.bottom25Prob} iqr:${this.iqrProb} top25:${this.top25Prob})`;
  }
}
