// @java AI/src/decision_trees/logits/LogitTreeNode.java

/**
 * Abstract class for a node in a feature-based regression tree
 * that should output logits.
 *
 * @java decision_trees/logits/LogitTreeNode.java
 * @author Dennis Soemers
 */

// Not-yet-ported escape-hatch interfaces for external dependencies
export interface FeatureVector {
  aspatialFeatureValues(): { get(i: number): number };
  activeSpatialFeatureIndices(): { size(): number; getQuick(j: number): number; contains(i: number): boolean };
}

export interface Feature {
  toString(): string;
}

export interface AspatialFeature extends Feature {
  __aspatial: true;
}

export interface SpatialFeature extends Feature {
  __spatial: true;
  generalises(other: SpatialFeature): boolean;
}

export interface BaseFeatureSet {
  aspatialFeatures(): AspatialFeature[];
  spatialFeatures(): SpatialFeature[];
  getNumAspatialFeatures(): number;
  getNumSpatialFeatures(): number;
  findFeatureIndexForString(s: string): number;
}

/** @java metadata.ai.features.trees.logits.LogitNode */
export interface LogitNodeMetadata {
  __logitNode: true;
}

/** @java metadata.ai.features.trees.logits.If */
export interface IfLogitMetadataNode extends LogitNodeMetadata {
  featureString(): string;
  thenNode(): LogitNodeMetadata;
  elseNode(): LogitNodeMetadata;
}

/** @java metadata.ai.features.trees.logits.Leaf */
export interface LeafLogitMetadataNode extends LogitNodeMetadata {
  featureStrings(): string[];
  weights(): number[];
}

/** @java metadata.ai.misc.Pair */
export interface PairMetadata {
  __pair: true;
}

/**
 * Abstract class for a node in a feature-based regression tree
 * that should output logits.
 *
 * @java decision_trees.logits.LogitTreeNode
 */
export abstract class LogitTreeNode {

  //-------------------------------------------------------------------------

  /**
   * @param featureVector
   * @return Predicted logit for given feature vector
   * @java LogitTreeNode.predict(FeatureVector)
   */
  public abstract predict(featureVector: FeatureVector): number;

  //-------------------------------------------------------------------------

  /**
   * Convert to tree in metadata format.
   * @return logit node.
   * @java LogitTreeNode.toMetadataNode()
   */
  public abstract toMetadataNode(): LogitNodeMetadata;

  //-------------------------------------------------------------------------

  /**
   * Constructs a node (and hence, tree) from the given metadata node.
   * @param metadataNode
   * @param featureSet
   * @return Constructed node
   * @java LogitTreeNode.fromMetadataNode(LogitNode, BaseFeatureSet)
   */
  public static fromMetadataNode(
    metadataNode: LogitNodeMetadata,
    featureSet: BaseFeatureSet
  ): LogitTreeNode {
    // Use duck-typing to detect If vs Leaf node
    const ifNode = metadataNode as unknown as IfLogitMetadataNode;
    if (typeof ifNode.featureString === "function") {
      // It's an If node
      const thenBranch = LogitTreeNode.fromMetadataNode(ifNode.thenNode(), featureSet);
      const elseBranch = LogitTreeNode.fromMetadataNode(ifNode.elseNode(), featureSet);

      const featureString = ifNode.featureString();
      const featureIdx = featureSet.findFeatureIndexForString(featureString);
      const aspatials = featureSet.aspatialFeatures();
      let feature: Feature;
      if (featureIdx < aspatials.length) {
        if (aspatials[featureIdx]!.toString() === featureString) {
          feature = aspatials[featureIdx]!;
        } else {
          feature = featureSet.spatialFeatures()[featureIdx]!;
        }
      } else {
        feature = featureSet.spatialFeatures()[featureIdx]!;
      }

      // Import here would be circular; use dynamic require pattern via lazy factory
      return LogitTreeNode._makeDecisionNode(feature, thenBranch, elseBranch, featureIdx);
    } else {
      // It's a Leaf node
      const leafNode = metadataNode as unknown as LeafLogitMetadataNode;
      const featureStrings = leafNode.featureStrings();
      const weights = leafNode.weights();
      const featureIndices: number[] = new Array(featureStrings.length);
      const features: Feature[] = new Array(featureStrings.length);

      for (let i = 0; i < features.length; ++i) {
        const fs = featureStrings[i]!;
        const fi = featureSet.findFeatureIndexForString(fs);
        const aspatials = featureSet.aspatialFeatures();
        let feat: Feature;
        if (fi < aspatials.length) {
          if (aspatials[fi]!.toString() === fs) {
            feat = aspatials[fi]!;
          } else {
            feat = featureSet.spatialFeatures()[fi]!;
          }
        } else {
          feat = featureSet.spatialFeatures()[fi]!;
        }
        features[i] = feat;
        featureIndices[i] = fi;
      }

      return LogitTreeNode._makeModelNode(features, weights as number[], featureIndices);
    }
  }

  //-------------------------------------------------------------------------

  /**
   * Factory hook — set by LogitDecisionNode after its class definition to break circular dep.
   * @internal
   */
  static _makeDecisionNode: (
    feature: Feature,
    trueNode: LogitTreeNode,
    falseNode: LogitTreeNode,
    featureIdx: number
  ) => LogitTreeNode = () => { throw new Error("LogitDecisionNode not registered"); };

  /**
   * Factory hook — set by LogitModelNode after its class definition to break circular dep.
   * @internal
   */
  static _makeModelNode: (
    features: Feature[],
    weights: number[],
    featureIndices: number[]
  ) => LogitTreeNode = () => { throw new Error("LogitModelNode not registered"); };

  //-------------------------------------------------------------------------
}
