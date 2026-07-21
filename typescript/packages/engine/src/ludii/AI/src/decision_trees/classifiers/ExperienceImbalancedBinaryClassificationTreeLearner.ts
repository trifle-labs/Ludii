// @java AI/src/decision_trees/classifiers/ExperienceImbalancedBinaryClassificationTreeLearner.java

/**
 * Class with methods for learning imbalanced binary classification trees from experience,
 * where the "True" branch must always directly end in a leaf node.
 *
 * @java decision_trees/classifiers/ExperienceImbalancedBinaryClassificationTreeLearner.java
 * @author Dennis Soemers
 */

import { DecisionTreeNode } from "./DecisionTreeNode.js";
import { BinaryLeafNode } from "./BinaryLeafNode.js";
import { DecisionConditionNode } from "./DecisionConditionNode.js";
import type { FeatureVector, Feature, BaseFeatureSet } from "./DecisionTreeNode.js";

// ---------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported types

/** @java features.WeightVector */
interface WeightVector {
  dot(featureVector: FeatureVector): number;
}

/** @java function_approx.LinearFunction */
interface LinearFunction {
  effectiveParams(): WeightVector;
}

/** @java training.expert_iteration.ExItExperience */
interface ExItExperience {
  moves(): { size(): number };
  generateFeatureVectors(featureSet: BaseFeatureSet): FeatureVector[];
  winningMoves(): { nextSetBit(from: number): number };
  losingMoves(): { nextSetBit(from: number): number };
}

/** @java utils.data_structures.experience_buffers.ExperienceBuffer */
interface ExperienceBuffer {
  allExperience(): (ExItExperience | null)[];
}

// ---------------------------------------------------------------------------
// Utility functions

function arrayMax(arr: number[]): number {
  let max = -Infinity;
  for (const v of arr) { if (v > max) max = v; }
  return max;
}

function arrayMin(arr: number[]): number {
  let min = Infinity;
  for (const v of arr) { if (v < min) min = v; }
  return min;
}

function softmaxInPlace(arr: number[]): void {
  let max = -Infinity;
  for (const v of arr) { if (v > max) max = v; }
  let sum = 0;
  for (let i = 0; i < arr.length; ++i) { arr[i] = Math.exp(arr[i]! - max); sum += arr[i]!; }
  for (let i = 0; i < arr.length; ++i) (arr as number[])[i] = (arr as number[])[i]! / sum;
}

// ---------------------------------------------------------------------------

/**
 * Class with methods for learning imbalanced binary classification trees from experience,
 * where the "True" branch must always directly end in a leaf node.
 *
 * @java decision_trees.classifiers.ExperienceImbalancedBinaryClassificationTreeLearner
 */
export class ExperienceImbalancedBinaryClassificationTreeLearner {

  //-------------------------------------------------------------------------

  /**
   * Builds an exact logit tree node for given feature set and experience buffer
   * @java ExperienceImbalancedBinaryClassificationTreeLearner.buildTree(BaseFeatureSet, LinearFunction, ExperienceBuffer, int, int)
   */
  public static buildTree(
    featureSet: BaseFeatureSet,
    linFunc: LinearFunction,
    buffer: ExperienceBuffer,
    maxDepth: number,
    minSamplesPerLeaf: number
  ): DecisionTreeNode {
    const oracleWeightVector = linFunc.effectiveParams();
    const samples = buffer.allExperience();
    const allFeatureVectors: FeatureVector[] = [];
    const allTargetLabels: number[] = [];

    for (const sample of samples) {
      if (sample !== null && sample !== undefined && sample.moves().size() > 1) {
        const featureVectors = sample.generateFeatureVectors(featureSet);
        const logits: number[] = new Array(featureVectors.length);

        for (let i = 0; i < featureVectors.length; ++i) {
          logits[i] = oracleWeightVector.dot(featureVectors[i]!);
        }

        const maxLogit = arrayMax(logits);
        const minLogit = arrayMin(logits);

        if (maxLogit === minLogit) continue;  // Nothing to learn from this, just skip it

        for (let i = 0; i < featureVectors.length; ++i) {
          allFeatureVectors.push(featureVectors[i]!);
        }

        // Maximise logits for winning moves and minimise for losing moves
        const winningMoves = sample.winningMoves();
        for (let i = winningMoves.nextSetBit(0); i >= 0; i = winningMoves.nextSetBit(i + 1)) {
          logits[i] = maxLogit;
        }

        const losingMoves = sample.losingMoves();
        for (let i = losingMoves.nextSetBit(0); i >= 0; i = losingMoves.nextSetBit(i + 1)) {
          logits[i] = minLogit;
        }

        softmaxInPlace(logits);

        let maxProb = -Infinity;
        for (const v of logits) { if (v > maxProb) maxProb = v; }

        const targets: number[] = new Array(logits.length);
        for (let i = 0; i < targets.length; ++i) {
          targets[i] = logits[i]! / maxProb;
        }

        for (const target of targets) {
          allTargetLabels.push(target);
        }
      }
    }

    return ExperienceImbalancedBinaryClassificationTreeLearner.buildNode(
      featureSet,
      allFeatureVectors,
      allTargetLabels,
      new Set<number>(),
      new Set<number>(),
      featureSet.getNumAspatialFeatures(),
      featureSet.getNumSpatialFeatures(),
      maxDepth,
      minSamplesPerLeaf
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java ExperienceImbalancedBinaryClassificationTreeLearner.buildNode(BaseFeatureSet, List<FeatureVector>, TFloatArrayList, BitSet, BitSet, int, int, int, int)
   */
  private static buildNode(
    featureSet: BaseFeatureSet,
    remainingFeatureVectors: FeatureVector[],
    remainingTargetLabels: number[],
    alreadyPickedAspatials: Set<number>,
    alreadyPickedSpatials: Set<number>,
    numAspatialFeatures: number,
    numSpatialFeatures: number,
    allowedDepth: number,
    minSamplesPerLeaf: number
  ): DecisionTreeNode {
    if (minSamplesPerLeaf <= 0) {
      throw new Error("minSamplesPerLeaf must be greater than 0");
    }

    if (remainingFeatureVectors.length === 0) {
      return new BinaryLeafNode(0.5);
    }

    if (allowedDepth === 0) {
      // Have to create leaf node here
      const sum = remainingTargetLabels.reduce((a, b) => a + b, 0);
      return new BinaryLeafNode(sum / remainingTargetLabels.length);
    }

    // For every aspatial and every spatial feature, if not already picked, compute mean prob for true and false branches
    const sumProbsIfFalseAspatial = new Array<number>(numAspatialFeatures).fill(0);
    const numFalseAspatial = new Array<number>(numAspatialFeatures).fill(0);
    const sumProbsIfTrueAspatial = new Array<number>(numAspatialFeatures).fill(0);
    const numTrueAspatial = new Array<number>(numAspatialFeatures).fill(0);

    for (let i = 0; i < numAspatialFeatures; ++i) {
      if (alreadyPickedAspatials.has(i)) continue;

      for (let j = 0; j < remainingFeatureVectors.length; ++j) {
        const fv = remainingFeatureVectors[j]!;
        const targetProb = remainingTargetLabels[j]!;

        if (fv.aspatialFeatureValues().get(i) !== 0) {
          (sumProbsIfTrueAspatial as number[])[i] = (sumProbsIfTrueAspatial as number[])[i]! + targetProb;
          (numTrueAspatial as number[])[i] = (numTrueAspatial as number[])[i]! + 1;
        } else {
          (sumProbsIfFalseAspatial as number[])[i] = (sumProbsIfFalseAspatial as number[])[i]! + targetProb;
          (numFalseAspatial as number[])[i] = (numFalseAspatial as number[])[i]! + 1;
        }
      }
    }

    const sumProbsIfFalseSpatial = new Array<number>(numSpatialFeatures).fill(0);
    const numFalseSpatial = new Array<number>(numSpatialFeatures).fill(0);
    const sumProbsIfTrueSpatial = new Array<number>(numSpatialFeatures).fill(0);
    const numTrueSpatial = new Array<number>(numSpatialFeatures).fill(0);

    for (let i = 0; i < remainingFeatureVectors.length; ++i) {
      const fv = remainingFeatureVectors[i]!;
      const targetProb = remainingTargetLabels[i]!;

      const active = new Array<boolean>(numSpatialFeatures).fill(false);
      const sparseSpatials = fv.activeSpatialFeatureIndices();

      for (let j = 0; j < sparseSpatials.size(); ++j) {
        active[sparseSpatials.getQuick(j)] = true;
      }

      for (let j = 0; j < active.length; ++j) {
        if (alreadyPickedSpatials.has(j)) continue;

        if (active[j]) {
          (sumProbsIfTrueSpatial as number[])[j] = (sumProbsIfTrueSpatial as number[])[j]! + targetProb;
          (numTrueSpatial as number[])[j] = (numTrueSpatial as number[])[j]! + 1;
        } else {
          (sumProbsIfFalseSpatial as number[])[j] = (sumProbsIfFalseSpatial as number[])[j]! + targetProb;
          (numFalseSpatial as number[])[j] = (numFalseSpatial as number[])[j]! + 1;
        }
      }
    }

    const meanProbsIfTrueAspatial = new Array<number>(numAspatialFeatures).fill(0);
    const meanProbsIfTrueSpatial = new Array<number>(numSpatialFeatures).fill(0);

    for (let i = 0; i < numAspatialFeatures; ++i) {
      if (numTrueAspatial[i]! > 0) meanProbsIfTrueAspatial[i] = sumProbsIfTrueAspatial[i]! / numTrueAspatial[i]!;
    }

    for (let i = 0; i < numSpatialFeatures; ++i) {
      if (numTrueSpatial[i]! > 0) meanProbsIfTrueSpatial[i] = sumProbsIfTrueSpatial[i]! / numTrueSpatial[i]!;
    }

    // Find feature that maximally reduces squared errors for true branch
    let minTrueBranchSquaredErrors = Infinity;
    let maxTrueBranchSquaredErrors = -Infinity;
    let bestTrueBranchNumSamples = -1;
    let bestIdx = -1;
    let bestFeatureIsAspatial = true;

    for (let i = 0; i < numAspatialFeatures; ++i) {
      if (numFalseAspatial[i]! < minSamplesPerLeaf || numTrueAspatial[i]! < minSamplesPerLeaf) continue;

      let trueBranchSquaredErrors = 0;
      for (let j = 0; j < remainingFeatureVectors.length; ++j) {
        const fv = remainingFeatureVectors[j]!;
        const targetProb = remainingTargetLabels[j]!;
        const error = fv.aspatialFeatureValues().get(i) !== 0
          ? targetProb - meanProbsIfTrueAspatial[i]!
          : 0;  // Ignore false branch
        trueBranchSquaredErrors += error * error;
      }

      if (trueBranchSquaredErrors < minTrueBranchSquaredErrors) {
        minTrueBranchSquaredErrors = trueBranchSquaredErrors;
        bestIdx = i;
        bestTrueBranchNumSamples = numTrueAspatial[i]!;
      } else if (trueBranchSquaredErrors === minTrueBranchSquaredErrors && numTrueAspatial[i]! > bestTrueBranchNumSamples) {
        bestIdx = i;
        bestTrueBranchNumSamples = numTrueAspatial[i]!;
      }

      if (trueBranchSquaredErrors > maxTrueBranchSquaredErrors) { maxTrueBranchSquaredErrors = trueBranchSquaredErrors; }
    }

    for (let i = 0; i < numSpatialFeatures; ++i) {
      if (numFalseSpatial[i]! < minSamplesPerLeaf || numTrueSpatial[i]! < minSamplesPerLeaf) continue;

      let trueBranchSquaredErrors = 0;
      for (let j = 0; j < remainingFeatureVectors.length; ++j) {
        const fv = remainingFeatureVectors[j]!;
        const targetProb = remainingTargetLabels[j]!;
        const error = fv.activeSpatialFeatureIndices().contains(i)
          ? targetProb - meanProbsIfTrueSpatial[i]!
          : 0;  // Ignore false branch
        trueBranchSquaredErrors += error * error;
      }

      if (trueBranchSquaredErrors < minTrueBranchSquaredErrors) {
        minTrueBranchSquaredErrors = trueBranchSquaredErrors;
        bestIdx = i;
        bestTrueBranchNumSamples = numTrueSpatial[i]!;
        bestFeatureIsAspatial = false;
      } else if (trueBranchSquaredErrors === minTrueBranchSquaredErrors && numTrueSpatial[i]! > bestTrueBranchNumSamples) {
        bestIdx = i;
        bestTrueBranchNumSamples = numTrueSpatial[i]!;
        // Note: Java source does NOT update bestFeatureIsAspatial = false here; port faithfully
      }

      if (trueBranchSquaredErrors > maxTrueBranchSquaredErrors) { maxTrueBranchSquaredErrors = trueBranchSquaredErrors; }
    }

    if (bestIdx === -1 || minTrueBranchSquaredErrors === maxTrueBranchSquaredErrors) {
      // No point in making any split at all, so just make leaf
      const sum = remainingTargetLabels.reduce((a, b) => a + b, 0);
      return new BinaryLeafNode(sum / remainingTargetLabels.length);
    }

    const splittingFeature: Feature = bestFeatureIsAspatial
      ? featureSet.aspatialFeatures()[bestIdx]!
      : featureSet.spatialFeatures()[bestIdx]!;

    const newAlreadyPickedAspatials = new Set(alreadyPickedAspatials);
    const newAlreadyPickedSpatials = new Set(alreadyPickedSpatials);

    if (bestFeatureIsAspatial) {
      newAlreadyPickedAspatials.add(bestIdx);
    } else {
      newAlreadyPickedSpatials.add(bestIdx);
    }

    // Split remaining data for the two branches
    const remainingFeatureVectorsTrue: FeatureVector[] = [];
    const remainingTargetProbsTrue: number[] = [];

    const remainingFeatureVectorsFalse: FeatureVector[] = [];
    const remainingTargetProbsFalse: number[] = [];

    if (bestFeatureIsAspatial) {
      for (let i = 0; i < remainingFeatureVectors.length; ++i) {
        if (remainingFeatureVectors[i]!.aspatialFeatureValues().get(bestIdx) !== 0) {
          remainingFeatureVectorsTrue.push(remainingFeatureVectors[i]!);
          remainingTargetProbsTrue.push(remainingTargetLabels[i]!);
        } else {
          remainingFeatureVectorsFalse.push(remainingFeatureVectors[i]!);
          remainingTargetProbsFalse.push(remainingTargetLabels[i]!);
        }
      }
    } else {
      for (let i = 0; i < remainingFeatureVectors.length; ++i) {
        if (remainingFeatureVectors[i]!.activeSpatialFeatureIndices().contains(bestIdx)) {
          remainingFeatureVectorsTrue.push(remainingFeatureVectors[i]!);
          remainingTargetProbsTrue.push(remainingTargetLabels[i]!);
        } else {
          remainingFeatureVectorsFalse.push(remainingFeatureVectors[i]!);
          remainingTargetProbsFalse.push(remainingTargetLabels[i]!);
        }
      }
    }

    // Create the node for case where splitting feature is true (force leaf: depth 0)
    const trueBranch = ExperienceImbalancedBinaryClassificationTreeLearner.buildNode(
      featureSet,
      remainingFeatureVectorsTrue,
      remainingTargetProbsTrue,
      newAlreadyPickedAspatials,
      newAlreadyPickedSpatials,
      numAspatialFeatures,
      numSpatialFeatures,
      0,  // Force immediately making a leaf
      minSamplesPerLeaf
    );

    // Create the node for case where splitting feature is false
    const falseBranch = ExperienceImbalancedBinaryClassificationTreeLearner.buildNode(
      featureSet,
      remainingFeatureVectorsFalse,
      remainingTargetProbsFalse,
      newAlreadyPickedAspatials,
      newAlreadyPickedSpatials,
      numAspatialFeatures,
      numSpatialFeatures,
      allowedDepth - 1,
      minSamplesPerLeaf
    );

    return new DecisionConditionNode(splittingFeature, trueBranch, falseBranch);
  }

  //-------------------------------------------------------------------------
}
