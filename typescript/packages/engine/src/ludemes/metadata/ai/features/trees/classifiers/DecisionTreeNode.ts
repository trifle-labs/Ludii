// @java Core/src/metadata/ai/features/trees/classifiers/DecisionTreeNode.java

/**
 * Describes a node in a decision tree for features. May either be a condition
 * node (internal node), or a node with class predictions (leaf node).
 *
 * @author Dennis Soemers
 */
export abstract class DecisionTreeNode {
  /**
   * Collect strings for all features under this node.
   * @param outFeatureStrings Set to put all the feature strings in.
   */
  abstract collectFeatureStrings(outFeatureStrings: Set<string>): void;

  /**
   * @param indent Number of tabs (assuming four spaces) to indent
   * @return String representation of this node.
   */
  abstract toStringIndented(indent: number): string;

  abstract toString(): string;
}
