// @java AI/src/decision_trees/logits/LogitDecisionNode.java

/**
 * Decision node in a feature-based logit tree
 *
 * @java decision_trees/logits/LogitDecisionNode.java
 * @author Dennis Soemers
 */

import {
  LogitTreeNode,
  type Feature,
  type AspatialFeature,
  type FeatureVector,
  type LogitNodeMetadata,
} from "./LogitTreeNode.js";

// Not-yet-ported escape-hatch for metadata.ai.features.trees.logits.If
// metadata.ai.features.trees.logits.If is not yet ported; we construct duck-typed objects in toMetadataNode() instead.

/**
 * Decision node in a feature-based logit tree
 *
 * @java decision_trees.logits.LogitDecisionNode
 */
export class LogitDecisionNode extends LogitTreeNode {

  //-------------------------------------------------------------------------

  /** The feature we want to evaluate (our condition)
   * @java LogitDecisionNode.feature */
  protected readonly feature: Feature;

  /** Node we should traverse to if feature is true
   * @java LogitDecisionNode.trueNode */
  protected readonly trueNode: LogitTreeNode;

  /** Node we should traverse to if feature is false
   * @java LogitDecisionNode.falseNode */
  protected readonly falseNode: LogitTreeNode;

  /** Index of the feature we look at in our feature set
   * @java LogitDecisionNode.featureIdx */
  protected featureIdx: number = -1;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @param feature
   * @param trueNode Node we should traverse to if feature is true
   * @param falseNode Node we should traverse to if feature is false
   * @java LogitDecisionNode(Feature, LogitTreeNode, LogitTreeNode)
   */
  public constructor(
    feature: Feature,
    trueNode: LogitTreeNode,
    falseNode: LogitTreeNode,
    featureIdx?: number
  ) {
    super();
    this.feature = feature;
    this.trueNode = trueNode;
    this.falseNode = falseNode;
    if (featureIdx !== undefined) {
      this.featureIdx = featureIdx;
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @java LogitDecisionNode.predict(FeatureVector)
   */
  public override predict(featureVector: FeatureVector): number {
    // Check if feature is an AspatialFeature by duck-typing for __aspatial marker
    if ((this.feature as unknown as AspatialFeature).__aspatial) {
      if (featureVector.aspatialFeatureValues().get(this.featureIdx) !== 0) {
        return this.trueNode.predict(featureVector);
      } else {
        return this.falseNode.predict(featureVector);
      }
    } else {
      if (featureVector.activeSpatialFeatureIndices().contains(this.featureIdx)) {
        return this.trueNode.predict(featureVector);
      } else {
        return this.falseNode.predict(featureVector);
      }
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @java LogitDecisionNode.toMetadataNode()
   */
  public override toMetadataNode(): LogitNodeMetadata {
    // metadata.ai.features.trees.logits.If not yet ported — use escape hatch
    return {
      __logitNode: true,
      featureString: () => this.feature.toString(),
      thenNode: () => this.trueNode.toMetadataNode(),
      elseNode: () => this.falseNode.toMetadataNode(),
    } as unknown as LogitNodeMetadata;
  }

  //-------------------------------------------------------------------------
}

// Register factory hook to break circular dependency with LogitTreeNode
LogitTreeNode._makeDecisionNode = (feature, trueNode, falseNode, featureIdx) =>
  new LogitDecisionNode(feature, trueNode, falseNode, featureIdx);
