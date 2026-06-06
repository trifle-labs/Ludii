// @java AI/src/decision_trees/logits/LogitModelNode.java

/**
 * Leaf node in a feature-based logit tree, with a linear model.
 *
 * @java decision_trees/logits/LogitModelNode.java
 * @author Dennis Soemers
 */

import {
  LogitTreeNode,
  type Feature,
  type AspatialFeature,
  type FeatureVector,
  type LogitNodeMetadata,
} from "./LogitTreeNode.js";

/**
 * Leaf node in a feature-based logit tree, with a linear model.
 *
 * @java decision_trees.logits.LogitModelNode
 */
export class LogitModelNode extends LogitTreeNode {

  //-------------------------------------------------------------------------

  /** Array of remaining features
   * @java LogitModelNode.features */
  protected readonly features: Feature[];

  /** Array of weights for the remaining features
   * @java LogitModelNode.weights */
  protected readonly weights: number[];

  /** Array of feature indices
   * @java LogitModelNode.featureIndices */
  protected readonly featureIndices: number[] | null;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @param features
   * @param weights
   * @param featureIndices optional
   * @java LogitModelNode(Feature[], float[])
   * @java LogitModelNode(Feature[], float[], int[])
   */
  public constructor(
    features: Feature[],
    weights: number[],
    featureIndices?: number[]
  ) {
    super();
    this.features = features;
    this.weights = weights;
    this.featureIndices = featureIndices !== undefined ? featureIndices : null;
  }

  //-------------------------------------------------------------------------

  /**
   * @java LogitModelNode.predict(FeatureVector)
   */
  public override predict(featureVector: FeatureVector): number {
    let dotProduct = 0;

    for (let i = 0; i < this.features.length; ++i) {
      const feature = this.features[i];
      const featureIdx = this.featureIndices !== null ? this.featureIndices[i]! : i;

      // Check if feature is an AspatialFeature by duck-typing
      if ((feature as unknown as AspatialFeature).__aspatial) {
        dotProduct += featureVector.aspatialFeatureValues().get(featureIdx) * this.weights[i]!;
      } else {
        if (featureVector.activeSpatialFeatureIndices().contains(featureIdx)) {
          dotProduct += this.weights[i]!;
        }
      }
    }

    return dotProduct;
  }

  //-------------------------------------------------------------------------

  /**
   * @java LogitModelNode.toMetadataNode()
   */
  public override toMetadataNode(): LogitNodeMetadata {
    // metadata.ai.features.trees.logits.Leaf and metadata.ai.misc.Pair are not yet ported
    // Return a duck-typed object as escape hatch
    const pairs = this.features.map((f, i) => ({
      key: f.toString(),
      value: this.weights[i],
    }));
    return {
      __logitNode: true,
      _pairs: pairs,
      featureStrings: () => pairs.map(p => p.key),
      weights: () => pairs.map(p => p.value),
    } as unknown as LogitNodeMetadata;
  }

  //-------------------------------------------------------------------------
}

// Register factory hook to break circular dependency with LogitTreeNode
LogitTreeNode._makeModelNode = (features, weights, featureIndices) =>
  new LogitModelNode(features, weights, featureIndices);
