// @java AI/src/decision_trees/classifiers/BinaryLeafNode.java

/**
 * Leaf node in a feature-based decision tree, with probabilities for classes.
 *
 * @java decision_trees/classifiers/BinaryLeafNode.java
 * @author Dennis Soemers
 */

import { DecisionTreeNode } from "./DecisionTreeNode.js";
import type { FeatureVector, DecisionTreeNodeMetadata } from "./DecisionTreeNode.js";

// Register factory hook after class is defined (to break circular dep)
import "./DecisionTreeNode.js";

/**
 * Leaf node in a feature-based decision tree that outputs a single binary
 * probability (probability of being a "top move").
 *
 * @java decision_trees.classifiers.BinaryLeafNode
 */
export class BinaryLeafNode extends DecisionTreeNode {

  //-------------------------------------------------------------------------

  /** Predicted probability of being a top move */
  protected readonly prob: number;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @param prob Probability of being a top move
   * @java BinaryLeafNode(float)
   */
  public constructor(prob: number) {
    super();
    this.prob = prob;
  }

  //-------------------------------------------------------------------------

  /** @java BinaryLeafNode.predict(FeatureVector) */
  public override predict(_featureVector: FeatureVector): number {
    return this.prob;
  }

  //-------------------------------------------------------------------------

  /** @java BinaryLeafNode.toMetadataNode() */
  public override toMetadataNode(): DecisionTreeNodeMetadata {
    return { __decisionTreeNode: true, __type: "BinaryLeaf", prob: this.prob } as unknown as DecisionTreeNodeMetadata;
  }

  //-------------------------------------------------------------------------
}

// Register factory hooks
DecisionTreeNode._makeBinaryLeafNode = (prob: number) => new BinaryLeafNode(prob);
