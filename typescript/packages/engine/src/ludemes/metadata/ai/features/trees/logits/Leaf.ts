// @java Core/src/metadata/ai/features/trees/logits/Leaf.java

import type { Pair } from "../../../misc/Pair.js";
import { LogitNode } from "./LogitNode.js";

/**
 * Describes a leaf node in a logit tree for features; it contains an array
 * of features and weights, describing a linear function to use to compute the
 * logit in this node. An intercept feature should collect all the weights
 * inferred from features evaluated in decision nodes leading up to this leaf.
 *
 * @author Dennis Soemers
 */
export class Leaf extends LogitNode {
  /** Remaining features to evaluate in our model */
  protected readonly featureStrings: string[];

  /** Array of weights for our remaining features */
  protected readonly weights: number[];

  // -------------------------------------------------------------------------

  /**
   * Defines the remaining features (used in linear model) and their weights.
   * @param features List of remaining features to evaluate and their weights.
   *
   * @example (leaf { (pair "Intercept" 1.0) })
   */
  constructor(features: Pair[]) {
    super();
    this.featureStrings = features.map((p) => p.key());
    this.weights = features.map((p) => p.floatVal());
  }

  // -------------------------------------------------------------------------

  override collectFeatureStrings(outFeatureStrings: Set<string>): void {
    for (const s of this.featureStrings) {
      outFeatureStrings.add(s);
    }
  }

  // -------------------------------------------------------------------------

  /** @return Array of strings of features used in model */
  getFeatureStrings(): string[] {
    return this.featureStrings;
  }

  /** @return Array of weights used in model */
  getWeights(): number[] {
    return this.weights;
  }

  // -------------------------------------------------------------------------

  override toStringIndented(_indent: number): string {
    return this.toString();
  }

  override toString(): string {
    let s = "(leaf { ";
    for (let i = 0; i < this.featureStrings.length; i++) {
      s += `(pair "${this.featureStrings[i]}" ${this.weights[i]}) `;
    }
    s += "})";
    return s;
  }
}
