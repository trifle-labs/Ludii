/**
 * Java parity: AI/src/decision_trees/logits/LogitTreeLearner.java and
 * AI/src/decision_trees/classifiers/DecisionTreeLearner.java.
 *
 * A self-contained CART-style regressor: take labelled (features → value)
 * samples, exhaustively search axis-aligned splits, and grow a binary
 * tree until a stop criterion fires (max depth, min samples per node, or
 * insufficient variance reduction).
 */

import {
  DecisionTree,
  type DecisionTreeInternal,
  type DecisionTreeLeaf,
  type DecisionTreeNode,
} from "./decision-tree.js";

export interface TrainingSample {
  readonly features: readonly number[];
  readonly label: number;
}

export interface DecisionTreeTrainerOptions {
  readonly maxDepth?: number;
  readonly minSamplesPerLeaf?: number;
  /** Minimum variance reduction to keep a split. */
  readonly minImpurityDecrease?: number;
}

function meanOf(samples: readonly TrainingSample[]): number {
  if (samples.length === 0) return 0;
  let total = 0;
  for (const s of samples) total += s.label;
  return total / samples.length;
}

function ssOf(samples: readonly TrainingSample[]): number {
  if (samples.length === 0) return 0;
  const mu = meanOf(samples);
  let sumSq = 0;
  for (const s of samples) {
    const d = s.label - mu;
    sumSq += d * d;
  }
  return sumSq;
}

interface BestSplit {
  readonly featureIndex: number;
  readonly threshold: number;
  readonly left: TrainingSample[];
  readonly right: TrainingSample[];
  readonly impurityDecrease: number;
}

function bestSplit(samples: readonly TrainingSample[]): BestSplit | undefined {
  const numFeatures = samples[0]?.features.length ?? 0;
  if (numFeatures === 0 || samples.length < 2) return undefined;
  const parentSS = ssOf(samples);
  let best: BestSplit | undefined;
  for (let f = 0; f < numFeatures; f += 1) {
    const values = new Set<number>();
    for (const s of samples) values.add(s.features[f] ?? 0);
    const sorted = [...values].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length - 1; i += 1) {
      const a = sorted[i];
      const b = sorted[i + 1];
      if (a === undefined || b === undefined) continue;
      const threshold = (a + b) / 2;
      const left: TrainingSample[] = [];
      const right: TrainingSample[] = [];
      for (const s of samples) {
        if ((s.features[f] ?? 0) <= threshold) left.push(s);
        else right.push(s);
      }
      if (left.length === 0 || right.length === 0) continue;
      const decrease = parentSS - (ssOf(left) + ssOf(right));
      if (!best || decrease > best.impurityDecrease) {
        best = {
          featureIndex: f,
          threshold,
          left,
          right,
          impurityDecrease: decrease,
        };
      }
    }
  }
  return best;
}

export class DecisionTreeTrainer {
  public readonly maxDepth: number;
  public readonly minSamplesPerLeaf: number;
  public readonly minImpurityDecrease: number;

  public constructor(options: DecisionTreeTrainerOptions = {}) {
    this.maxDepth = options.maxDepth ?? 6;
    this.minSamplesPerLeaf = options.minSamplesPerLeaf ?? 1;
    this.minImpurityDecrease = options.minImpurityDecrease ?? 1e-6;
  }

  public train(samples: readonly TrainingSample[]): DecisionTree {
    const root = this.build(samples, 0);
    return new DecisionTree(root);
  }

  private build(
    samples: readonly TrainingSample[],
    depth: number,
  ): DecisionTreeNode {
    const leafValue = meanOf(samples);
    if (
      depth >= this.maxDepth ||
      samples.length <= this.minSamplesPerLeaf * 2
    ) {
      return this.leaf(leafValue);
    }
    const split = bestSplit(samples);
    if (
      !split ||
      split.impurityDecrease < this.minImpurityDecrease ||
      split.left.length < this.minSamplesPerLeaf ||
      split.right.length < this.minSamplesPerLeaf
    ) {
      return this.leaf(leafValue);
    }
    const internal: DecisionTreeInternal = {
      kind: "internal",
      featureIndex: split.featureIndex,
      threshold: split.threshold,
      left: this.build(split.left, depth + 1),
      right: this.build(split.right, depth + 1),
    };
    return internal;
  }

  private leaf(value: number): DecisionTreeLeaf {
    return { kind: "leaf", value };
  }
}
