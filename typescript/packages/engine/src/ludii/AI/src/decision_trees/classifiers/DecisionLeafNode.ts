// @java AI/src/decision_trees/classifiers/DecisionLeafNode.java

/**
 * Leaf node in a feature-based decision tree, with probabilities for classes.
 *
 * @java decision_trees/classifiers/DecisionLeafNode.java
 * @author Dennis Soemers
 */

import { DecisionTreeNode } from "./DecisionTreeNode.js";
import type { FeatureVector, DecisionTreeNodeMetadata } from "./DecisionTreeNode.js";

/**
 * Leaf node in a feature-based decision tree, with probabilities for classes.
 *
 * @java decision_trees.classifiers.DecisionLeafNode
 */
export class DecisionLeafNode extends DecisionTreeNode {

  //-------------------------------------------------------------------------

  /** Predicted probability of being a bottom-25% move
   * @java DecisionLeafNode.bottom25Prob */
  protected readonly bottom25Prob: number;

  /** Predicted probability of being a move in the Interquartile Range
   * @java DecisionLeafNode.iqrProb */
  protected readonly iqrProb: number;

  /** Predicted probability of being a top-25% move
   * @java DecisionLeafNode.top25Prob */
  protected readonly top25Prob: number;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @param bottom25Prob
   * @param iqrProb
   * @param top25Prob
   * @java DecisionLeafNode(float, float, float)
   */
  public constructor(
    bottom25Prob: number,
    iqrProb: number,
    top25Prob: number
  ) {
    super();
    this.bottom25Prob = bottom25Prob;
    this.iqrProb = iqrProb;
    this.top25Prob = top25Prob;
  }

  //-------------------------------------------------------------------------

  /**
   * @java DecisionLeafNode.predict(FeatureVector)
   */
  public override predict(_featureVector: FeatureVector): number {
    return this.top25Prob * (1 - this.bottom25Prob);
  }

  //-------------------------------------------------------------------------

  /**
   * @java DecisionLeafNode.toMetadataNode()
   */
  public override toMetadataNode(): DecisionTreeNodeMetadata {
    // metadata.ai.features.trees.classifiers.Leaf is not yet ported — use escape hatch
    return {
      __decisionTreeNode: true,
      __type: "Leaf",
      bottom25Prob: () => this.bottom25Prob,
      iqrProb: () => this.iqrProb,
      top25Prob: () => this.top25Prob,
    } as unknown as DecisionTreeNodeMetadata;
  }

  //-------------------------------------------------------------------------
}

// Register factory hook to break circular dependency with DecisionTreeNode
DecisionTreeNode._makeLeafNode = (bottom25Prob, iqrProb, top25Prob) =>
  new DecisionLeafNode(bottom25Prob, iqrProb, top25Prob);
