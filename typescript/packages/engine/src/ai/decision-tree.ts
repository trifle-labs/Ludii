/**
 * Java parity: AI/src/decision_trees/classifiers/DecisionTreeNode.java
 * and AI/src/decision_trees/logits/LogitTreeNode.java.
 *
 * A self-contained decision-tree classifier. Each internal node tests
 * a single feature index against a threshold; each leaf carries a
 * predicted value (a logit or probability — the consumer decides). To
 * evaluate, the tree is walked top-down with a feature vector extracted
 * from a (Context, Move) pair via `FeatureSet.extract`.
 *
 * Mirrors the *evaluation* surface of the Java classes — training is
 * out of scope; trees are constructed externally (e.g. from saved
 * Ludii AI training data) and consumed for inference.
 */

export interface DecisionTreeLeaf {
  readonly kind: "leaf";
  /** Predicted value at this leaf (logit, probability, or score). */
  readonly value: number;
}

export interface DecisionTreeInternal {
  readonly kind: "internal";
  /** Index into the feature vector to test. */
  readonly featureIndex: number;
  /** Threshold. Activation ≤ threshold → `left`, else `right`. */
  readonly threshold: number;
  readonly left: DecisionTreeNode;
  readonly right: DecisionTreeNode;
}

export type DecisionTreeNode = DecisionTreeLeaf | DecisionTreeInternal;

export class DecisionTree {
  public readonly root: DecisionTreeNode;

  public constructor(root: DecisionTreeNode) {
    this.root = root;
  }

  /** Walk the tree against a feature vector and return the leaf value. */
  public predict(features: readonly number[]): number {
    let node: DecisionTreeNode = this.root;
    while (node.kind === "internal") {
      const value = features[node.featureIndex] ?? 0;
      node = value <= node.threshold ? node.left : node.right;
    }
    return node.value;
  }

  /** Convenience: stack of trees → softmax over leaf values. */
  public static softmaxOver(
    trees: readonly DecisionTree[],
    featuresPerMove: readonly (readonly number[])[],
  ): number[] {
    const logits = featuresPerMove.map((features) => {
      let total = 0;
      for (const tree of trees) total += tree.predict(features);
      return total;
    });
    let maxLogit = Number.NEGATIVE_INFINITY;
    for (const logit of logits) {
      if (logit > maxLogit) maxLogit = logit;
    }
    let totalExp = 0;
    const exps = logits.map((logit) => {
      const e = Math.exp(logit - maxLogit);
      totalExp += e;
      return e;
    });
    if (totalExp <= 0 || !Number.isFinite(totalExp)) {
      return logits.map(() => 1 / logits.length);
    }
    return exps.map((e) => e / totalExp);
  }
}
