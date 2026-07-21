// @java AI/src/decision_trees/classifiers/ExperienceUrgencyTreeLearner.java

/**
 * Class with methods for learning urgency trees from experience.
 *
 * @java decision_trees/classifiers/ExperienceUrgencyTreeLearner.java
 * @author Dennis Soemers
 */

import { DecisionTreeNode } from "./DecisionTreeNode.js";
import { BinaryLeafNode } from "./BinaryLeafNode.js";
import type { FeatureVector, Feature, BaseFeatureSet } from "./DecisionTreeNode.js";

// ---------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported types

/** @java function_approx.LinearFunction */
interface LinearFunction {
  effectiveParams(): WeightVector;
}

/** @java features.WeightVector */
interface WeightVector {
  dot(featureVector: FeatureVector): number;
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

/** Helpers: compute max and min over a number array */
function arrayMax(arr: number[]): number {
  let m = -Infinity;
  for (const v of arr) if (v > m) m = v;
  return m;
}

function arrayMin(arr: number[]): number {
  let m = Infinity;
  for (const v of arr) if (v < m) m = v;
  return m;
}

/** Simple in-place softmax on a plain number array. */
function softmaxInPlace(logits: number[]): void {
  let maxVal = -Infinity;
  for (const v of logits) if (v > maxVal) maxVal = v;
  let sum = 0;
  for (let i = 0; i < logits.length; ++i) {
    (logits as number[])[i] = Math.exp((logits as number[])[i]! - maxVal);
    sum += (logits as number[])[i]!;
  }
  for (let i = 0; i < logits.length; ++i) (logits as number[])[i] = (logits as number[])[i]! / sum;
}

// ---------------------------------------------------------------------------

/**
 * Class with methods for learning urgency trees from experience.
 *
 * @java decision_trees.classifiers.ExperienceUrgencyTreeLearner
 */
export class ExperienceUrgencyTreeLearner {

  //-------------------------------------------------------------------------

  /**
   * Builds an urgency tree node for given feature set and experience buffer.
   * @param featureSet
   * @param linFunc
   * @param buffer
   * @param maxDepth
   * @param minSamplesPerLeaf
   * @return Root node of the generated tree
   * @java ExperienceUrgencyTreeLearner.buildTree(BaseFeatureSet, LinearFunction, ExperienceBuffer, int, int)
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
        const logits: number[] = new Array(featureVectors.length) as number[];

        for (let i = 0; i < featureVectors.length; ++i) {
          (logits as number[])[i] = oracleWeightVector.dot(featureVectors[i]!);
        }

        const maxLogit = arrayMax(logits);
        const minLogit = arrayMin(logits);

        if (maxLogit === minLogit)
          continue; // Nothing to learn from this, just skip it

        for (let i = 0; i < featureVectors.length; ++i) {
          allFeatureVectors.push(featureVectors[i]!);
        }

        // Maximise logits for winning moves and minimise for losing moves
        const winningMoves = sample.winningMoves();
        for (let i = winningMoves.nextSetBit(0); i >= 0; i = winningMoves.nextSetBit(i + 1)) {
          (logits as number[])[i] = maxLogit;
        }

        const losingMoves = sample.losingMoves();
        for (let i = losingMoves.nextSetBit(0); i >= 0; i = losingMoves.nextSetBit(i + 1)) {
          (logits as number[])[i] = minLogit;
        }

        // softmax
        softmaxInPlace(logits);

        let maxProb = -Infinity;
        for (const v of logits) if (v > maxProb) maxProb = v;

        const targets: number[] = new Array(logits.length) as number[];
        for (let i = 0; i < targets.length; ++i) {
          (targets as number[])[i] = (logits as number[])[i]! / maxProb;
        }

        for (const target of targets) {
          allTargetLabels.push(target!);
        }
      }
    }

    return ExperienceUrgencyTreeLearner.buildNode(
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
   * @param featureSet
   * @param remainingFeatureVectors
   * @param remainingTargetLabels
   * @param alreadyPickedAspatials
   * @param alreadyPickedSpatials
   * @param numAspatialFeatures
   * @param numSpatialFeatures
   * @param allowedDepth
   * @param minSamplesPerLeaf
   * @return Newly built node for decision tree, for given data
   * @java ExperienceUrgencyTreeLearner.buildNode(...)
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
    if (minSamplesPerLeaf <= 0)
      throw new Error("minSamplesPerLeaf must be greater than 0");

    if (remainingFeatureVectors.length === 0) {
      return new BinaryLeafNode(0.5);
    }

    if (allowedDepth === 0) {
      // Have to create leaf node here
      const sum = remainingTargetLabels.reduce((a, b) => a + b, 0);
      return new BinaryLeafNode(sum / remainingTargetLabels.length);
    }

    // Compute baseline prob (mean for the full node that we want to split)
    const baselineSum = remainingTargetLabels.reduce((a, b) => a + b, 0);
    const baselineProb = baselineSum / remainingTargetLabels.length;

    // For every aspatial and every spatial feature, if not already picked,
    // compute mean prob for true and false branches
    const sumProbsIfFalseAspatial = new Array(numAspatialFeatures).fill(0) as number[];
    const numFalseAspatial = new Array(numAspatialFeatures).fill(0) as number[];
    const sumProbsIfTrueAspatial = new Array(numAspatialFeatures).fill(0) as number[];
    const numTrueAspatial = new Array(numAspatialFeatures).fill(0) as number[];

    for (let i = 0; i < numAspatialFeatures; ++i) {
      if (alreadyPickedAspatials.has(i))
        continue;

      for (let j = 0; j < remainingFeatureVectors.length; ++j) {
        const featureVector = remainingFeatureVectors[j]!;
        const targetProb = remainingTargetLabels[j]!;

        if (featureVector.aspatialFeatureValues().get(i) !== 0.0) {
          (sumProbsIfTrueAspatial as number[])[i] = (sumProbsIfTrueAspatial as number[])[i]! + targetProb;
          (numTrueAspatial as number[])[i] = (numTrueAspatial as number[])[i]! + 1;
        } else {
          (sumProbsIfFalseAspatial as number[])[i] = (sumProbsIfFalseAspatial as number[])[i]! + targetProb;
          (numFalseAspatial as number[])[i] = (numFalseAspatial as number[])[i]! + 1;
        }
      }
    }

    const sumProbsIfFalseSpatial = new Array(numSpatialFeatures).fill(0) as number[];
    const numFalseSpatial = new Array(numSpatialFeatures).fill(0) as number[];
    const sumProbsIfTrueSpatial = new Array(numSpatialFeatures).fill(0) as number[];
    const numTrueSpatial = new Array(numSpatialFeatures).fill(0) as number[];

    for (let i = 0; i < remainingFeatureVectors.length; ++i) {
      const featureVector = remainingFeatureVectors[i]!;
      const targetProb = remainingTargetLabels[i]!;

      const active = new Array(numSpatialFeatures).fill(false) as boolean[];
      const sparseSpatials = featureVector.activeSpatialFeatureIndices();

      for (let j = 0; j < sparseSpatials.size(); ++j) {
        (active as boolean[])[sparseSpatials.getQuick(j)] = true;
      }

      for (let j = 0; j < active.length; ++j) {
        if (alreadyPickedSpatials.has(j))
          continue;

        if ((active as boolean[])[j]) {
          (sumProbsIfTrueSpatial as number[])[j] = (sumProbsIfTrueSpatial as number[])[j]! + targetProb;
          (numTrueSpatial as number[])[j] = (numTrueSpatial as number[])[j]! + 1;
        } else {
          (sumProbsIfFalseSpatial as number[])[j] = (sumProbsIfFalseSpatial as number[])[j]! + targetProb;
          (numFalseSpatial as number[])[j] = (numFalseSpatial as number[])[j]! + 1;
        }
      }
    }

    const meanProbsIfFalseAspatial = new Array(numAspatialFeatures).fill(0) as number[];
    const meanProbsIfTrueAspatial = new Array(numAspatialFeatures).fill(0) as number[];
    const meanProbsIfFalseSpatial = new Array(numSpatialFeatures).fill(0) as number[];
    const meanProbsIfTrueSpatial = new Array(numSpatialFeatures).fill(0) as number[];

    for (let i = 0; i < numAspatialFeatures; ++i) {
      if ((numFalseAspatial as number[])[i]! > 0)
        (meanProbsIfFalseAspatial as number[])[i] = (sumProbsIfFalseAspatial as number[])[i]! / (numFalseAspatial as number[])[i]!;
      if ((numTrueAspatial as number[])[i]! > 0)
        (meanProbsIfTrueAspatial as number[])[i] = (sumProbsIfTrueAspatial as number[])[i]! / (numTrueAspatial as number[])[i]!;
    }

    for (let i = 0; i < numSpatialFeatures; ++i) {
      if ((numFalseSpatial as number[])[i]! > 0)
        (meanProbsIfFalseSpatial as number[])[i] = (sumProbsIfFalseSpatial as number[])[i]! / (numFalseSpatial as number[])[i]!;
      if ((numTrueSpatial as number[])[i]! > 0)
        (meanProbsIfTrueSpatial as number[])[i] = (sumProbsIfTrueSpatial as number[])[i]! / (numTrueSpatial as number[])[i]!;
    }

    // Find features with maximum scaled urgency
    const negativeRange = baselineProb;
    const positiveRange = 1.0 - baselineProb;

    let maxUrgency = 0.0;
    const bestIndices: number[] = [];

    for (let i = 0; i < numAspatialFeatures; ++i) {
      if ((numFalseAspatial as number[])[i]! < minSamplesPerLeaf || (numTrueAspatial as number[])[i]! < minSamplesPerLeaf)
        continue;

      const mFalse = (meanProbsIfFalseAspatial as number[])[i]!;
      const mTrue = (meanProbsIfTrueAspatial as number[])[i]!;
      const scaledUrgencyFalse = mFalse > baselineProb
        ? (mFalse - baselineProb) / positiveRange
        : (baselineProb - mFalse) / negativeRange;

      const scaledUrgencyTrue = mTrue > baselineProb
        ? (mTrue - baselineProb) / positiveRange
        : (baselineProb - mTrue) / negativeRange;

      const scaledUrgency = Math.max(scaledUrgencyFalse, scaledUrgencyTrue);

      if (scaledUrgency > maxUrgency) {
        bestIndices.length = 0;
        bestIndices.push(i);
        maxUrgency = scaledUrgency;
      } else if (scaledUrgency === maxUrgency) {
        bestIndices.push(i);
      }
    }

    for (let i = 0; i < numSpatialFeatures; ++i) {
      if ((numFalseSpatial as number[])[i]! < minSamplesPerLeaf || (numTrueSpatial as number[])[i]! < minSamplesPerLeaf)
        continue;

      const mFalse = (meanProbsIfFalseSpatial as number[])[i]!;
      const mTrue = (meanProbsIfTrueSpatial as number[])[i]!;
      const scaledUrgencyFalse = mFalse > baselineProb
        ? (mFalse - baselineProb) / positiveRange
        : (baselineProb - mFalse) / negativeRange;

      const scaledUrgencyTrue = mTrue > baselineProb
        ? (mTrue - baselineProb) / positiveRange
        : (baselineProb - mTrue) / negativeRange;

      const scaledUrgency = Math.max(scaledUrgencyFalse, scaledUrgencyTrue);

      if (scaledUrgency > maxUrgency) {
        bestIndices.length = 0;
        bestIndices.push(i + numAspatialFeatures);
        maxUrgency = scaledUrgency;
      } else if (scaledUrgency === maxUrgency) {
        bestIndices.push(i + numAspatialFeatures);
      }
    }

    if (bestIndices.length === 0 || maxUrgency === 0.0) {
      // No point in making any split at all, so just make leaf
      return new BinaryLeafNode(baselineProb);
    }

    // Use sample size as tie-breaker
    let bestSampleSize = 0;
    let splittingFeature: Feature | null = null;
    let bestFeatureIsAspatial = false;
    let bestIdx = -1;

    for (let i = 0; i < bestIndices.length; ++i) {
      const rawIdx = (bestIndices as number[])[i]!;
      const isAspatial = rawIdx < numAspatialFeatures;
      const adjustedIdx = isAspatial ? rawIdx : rawIdx - numAspatialFeatures;

      const sampleSize = isAspatial
        ? Math.min((numFalseAspatial as number[])[adjustedIdx]!, (numTrueAspatial as number[])[adjustedIdx]!)
        : Math.min((numFalseSpatial as number[])[adjustedIdx]!, (numTrueSpatial as number[])[adjustedIdx]!);

      if (sampleSize > bestSampleSize) {
        bestSampleSize = sampleSize;
        splittingFeature = isAspatial
          ? (featureSet.aspatialFeatures()[adjustedIdx] as Feature)
          : (featureSet.spatialFeatures()[adjustedIdx] as Feature);
        bestFeatureIsAspatial = isAspatial;
        bestIdx = adjustedIdx;
      }
    }

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
        const fv = remainingFeatureVectors[i]!;
        const tp = remainingTargetLabels[i]!;
        if (fv.aspatialFeatureValues().get(bestIdx) !== 0.0) {
          remainingFeatureVectorsTrue.push(fv);
          remainingTargetProbsTrue.push(tp);
        } else {
          remainingFeatureVectorsFalse.push(fv);
          remainingTargetProbsFalse.push(tp);
        }
      }
    } else {
      for (let i = 0; i < remainingFeatureVectors.length; ++i) {
        const fv = remainingFeatureVectors[i]!;
        const tp = remainingTargetLabels[i]!;
        if (fv.activeSpatialFeatureIndices().contains(bestIdx)) {
          remainingFeatureVectorsTrue.push(fv);
          remainingTargetProbsTrue.push(tp);
        } else {
          remainingFeatureVectorsFalse.push(fv);
          remainingTargetProbsFalse.push(tp);
        }
      }
    }

    // Create the node for case where splitting feature is true
    const trueBranch = ExperienceUrgencyTreeLearner.buildNode(
      featureSet,
      remainingFeatureVectorsTrue,
      remainingTargetProbsTrue,
      newAlreadyPickedAspatials,
      newAlreadyPickedSpatials,
      numAspatialFeatures,
      numSpatialFeatures,
      allowedDepth - 1,
      minSamplesPerLeaf
    );

    // Create the node for case where splitting feature is false
    const falseBranch = ExperienceUrgencyTreeLearner.buildNode(
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

    // Use factory hook to create DecisionConditionNode (avoids circular import)
    return DecisionTreeNode._makeConditionNode(splittingFeature!, trueBranch, falseBranch, bestIdx);
  }

  //-------------------------------------------------------------------------
}
