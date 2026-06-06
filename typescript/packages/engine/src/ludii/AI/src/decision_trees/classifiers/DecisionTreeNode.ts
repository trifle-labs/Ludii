// @java AI/src/decision_trees/classifiers/DecisionTreeNode.java

/**
 * Abstract class for a node in a feature-based decision tree that should
 * output class probabilities.
 *
 * @java decision_trees/classifiers/DecisionTreeNode.java
 * @author Dennis Soemers
 */

// ---------------------------------------------------------------------------
// Not-yet-ported escape-hatch interfaces for external dependencies

/** @java features.FeatureVector */
export interface FeatureVector {
  aspatialFeatureValues(): { get(i: number): number; dim(): number };
  activeSpatialFeatureIndices(): {
    size(): number;
    getQuick(j: number): number;
    contains(i: number): boolean;
  };
}

/** @java features.Feature */
export interface Feature {
  toString(): string;
}

/** @java features.aspatial.AspatialFeature */
export interface AspatialFeature extends Feature {
  __aspatial: true;
}

/** @java features.feature_sets.BaseFeatureSet */
export interface BaseFeatureSet {
  aspatialFeatures(): AspatialFeature[];
  spatialFeatures(): Feature[];
  getNumAspatialFeatures(): number;
  getNumSpatialFeatures(): number;
  findFeatureIndexForString(s: string): number;
}

/** @java metadata.ai.features.trees.classifiers.DecisionTreeNode */
export interface DecisionTreeNodeMetadata {
  __decisionTreeNode: true;
}

/** @java metadata.ai.features.trees.classifiers.If */
export interface IfMetadataNode extends DecisionTreeNodeMetadata {
  featureString(): string;
  thenNode(): DecisionTreeNodeMetadata;
  elseNode(): DecisionTreeNodeMetadata;
}

/** @java metadata.ai.features.trees.classifiers.BinaryLeaf */
export interface BinaryLeafMetadataNode extends DecisionTreeNodeMetadata {
  prob(): number;
}

/** @java metadata.ai.features.trees.classifiers.Leaf */
export interface LeafMetadataNode extends DecisionTreeNodeMetadata {
  bottom25Prob(): number;
  iqrProb(): number;
  top25Prob(): number;
}

// ---------------------------------------------------------------------------

/**
 * Abstract class for a node in a feature-based decision tree that should
 * output class probabilities.
 *
 * @java decision_trees.classifiers.DecisionTreeNode
 */
export abstract class DecisionTreeNode {

  //-------------------------------------------------------------------------

  /**
   * @param featureVector
   * @return Predicted (unnormalised) probability estimate for playing given feature vector
   * @java DecisionTreeNode.predict(FeatureVector)
   */
  public abstract predict(featureVector: FeatureVector): number;

  //-------------------------------------------------------------------------

  /**
   * Convert to tree in metadata format.
   * @return Decision tree node.
   * @java DecisionTreeNode.toMetadataNode()
   */
  public abstract toMetadataNode(): DecisionTreeNodeMetadata;

  //-------------------------------------------------------------------------

  /**
   * Constructs a node (and hence, tree) from the given metadata node.
   * @param metadataNode
   * @param featureSet
   * @return Constructed node
   * @java DecisionTreeNode.fromMetadataNode(DecisionTreeNode, BaseFeatureSet)
   */
  public static fromMetadataNode(
    metadataNode: DecisionTreeNodeMetadata,
    featureSet: BaseFeatureSet
  ): DecisionTreeNode {
    // Use duck-typing to detect If vs Leaf node
    const ifNode = metadataNode as unknown as IfMetadataNode;
    if (typeof ifNode.featureString === "function") {
      // It's an If node
      const thenBranch = DecisionTreeNode.fromMetadataNode(ifNode.thenNode(), featureSet);
      const elseBranch = DecisionTreeNode.fromMetadataNode(ifNode.elseNode(), featureSet);

      const featureString = ifNode.featureString();
      const featureIdx = featureSet.findFeatureIndexForString(featureString);
      const aspatials = featureSet.aspatialFeatures();
      let feature: Feature;
      if (featureIdx < aspatials.length) {
        const asp = aspatials[featureIdx];
        if (asp !== undefined && asp.toString() === featureString) {
          feature = asp;
        } else {
          feature = featureSet.spatialFeatures()[featureIdx] as Feature;
        }
      } else {
        feature = featureSet.spatialFeatures()[featureIdx] as Feature;
      }

      return DecisionTreeNode._makeConditionNode(feature, thenBranch, elseBranch, featureIdx);
    } else {
      const binaryLeaf = metadataNode as unknown as BinaryLeafMetadataNode;
      if (typeof binaryLeaf.prob === "function") {
        // It's a BinaryLeaf node
        return DecisionTreeNode._makeBinaryLeafNode(binaryLeaf.prob());
      } else {
        // It's a Leaf node
        const leafNode = metadataNode as unknown as LeafMetadataNode;
        return DecisionTreeNode._makeLeafNode(
          leafNode.bottom25Prob(),
          leafNode.iqrProb(),
          leafNode.top25Prob()
        );
      }
    }
  }

  //-------------------------------------------------------------------------

  /**
   * Factory hook for DecisionConditionNode — set after class definition to break circular dep.
   * @internal
   */
  static _makeConditionNode: (
    feature: Feature,
    trueNode: DecisionTreeNode,
    falseNode: DecisionTreeNode,
    featureIdx: number
  ) => DecisionTreeNode = () => { throw new Error("DecisionConditionNode not registered"); };

  /**
   * Factory hook for BinaryLeafNode — set after class definition to break circular dep.
   * @internal
   */
  static _makeBinaryLeafNode: (prob: number) => DecisionTreeNode =
    () => { throw new Error("BinaryLeafNode not registered"); };

  /**
   * Factory hook for DecisionLeafNode — set after class definition to break circular dep.
   * @internal
   */
  static _makeLeafNode: (bottom25Prob: number, iqrProb: number, top25Prob: number) => DecisionTreeNode =
    () => { throw new Error("DecisionLeafNode not registered"); };

  //-------------------------------------------------------------------------
}
