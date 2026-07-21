// @java AI/src/decision_trees/classifiers/DecisionConditionNode.java

/**
 * Decision node in a feature-based logit tree
 *
 * @java decision_trees/classifiers/DecisionConditionNode.java
 * @author Dennis Soemers
 */

import { DecisionTreeNode } from "./DecisionTreeNode.js";
import type {
  Feature,
  AspatialFeature,
  FeatureVector,
  DecisionTreeNodeMetadata,
} from "./DecisionTreeNode.js";

/**
 * Decision node in a feature-based classifier tree
 *
 * @java decision_trees.classifiers.DecisionConditionNode
 */
export class DecisionConditionNode extends DecisionTreeNode {

  //-------------------------------------------------------------------------

  /** The feature we want to evaluate (our condition)
   * @java DecisionConditionNode.feature */
  protected readonly feature: Feature;

  /** Node we should traverse to if feature is true
   * @java DecisionConditionNode.trueNode */
  protected readonly trueNode: DecisionTreeNode;

  /** Node we should traverse to if feature is false
   * @java DecisionConditionNode.falseNode */
  protected readonly falseNode: DecisionTreeNode;

  /** Index of the feature we look at in our feature set (may index into either aspatial or spatial features list)
   * @java DecisionConditionNode.featureIdx */
  protected featureIdx: number = -1;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @param feature
   * @param trueNode Node we should traverse to if feature is true
   * @param falseNode Node we should traverse to if feature is false
   * @param featureIdx optional index of the feature
   * @java DecisionConditionNode(Feature, DecisionTreeNode, DecisionTreeNode)
   * @java DecisionConditionNode(Feature, DecisionTreeNode, DecisionTreeNode, int)
   */
  public constructor(
    feature: Feature,
    trueNode: DecisionTreeNode,
    falseNode: DecisionTreeNode,
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
   * @java DecisionConditionNode.predict(FeatureVector)
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
   * @java DecisionConditionNode.toMetadataNode()
   */
  public override toMetadataNode(): DecisionTreeNodeMetadata {
    // metadata.ai.features.trees.classifiers.If is not yet ported — use escape hatch
    return {
      __decisionTreeNode: true,
      __type: "If",
      featureString: () => this.feature.toString(),
      thenNode: () => this.trueNode.toMetadataNode(),
      elseNode: () => this.falseNode.toMetadataNode(),
    } as unknown as DecisionTreeNodeMetadata;
  }

  //-------------------------------------------------------------------------

  /**
   * @return The feature we check in this node
   * @java DecisionConditionNode.feature()
   */
  public getFeature(): Feature {
    return this.feature;
  }

  /**
   * @return The node we go to when the feature is active
   * @java DecisionConditionNode.trueNode()
   */
  public getTrueNode(): DecisionTreeNode {
    return this.trueNode;
  }

  /**
   * @return The node we go to when the feature is not active
   * @java DecisionConditionNode.falseNode()
   */
  public getFalseNode(): DecisionTreeNode {
    return this.falseNode;
  }

  //-------------------------------------------------------------------------
}

// Register factory hook to break circular dependency with DecisionTreeNode
DecisionTreeNode._makeConditionNode = (feature, trueNode, falseNode, featureIdx) =>
  new DecisionConditionNode(feature, trueNode, falseNode, featureIdx);
