// @java AI/src/decision_trees/classifiers/ExperienceIQRTreeLearner.java

/**
 * Class with methods for learning decision trees (classifiers) from experience.
 *
 * @java decision_trees/classifiers/ExperienceIQRTreeLearner.java
 * @author Dennis Soemers
 */

import { DecisionTreeNode } from "./DecisionTreeNode.js";
import { DecisionLeafNode } from "./DecisionLeafNode.js";
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

/**
 * Classes we distinguish for IQR tree
 * @java ExperienceIQRTreeLearner.IQRClass
 */
const enum IQRClass {
  /** Should remain unused */
  UNDEFINED = 0,
  /** Bottom 25% */
  Bottom25 = 1,
  /** Interquartile Range */
  IQR = 2,
  /** Top 25% */
  Top25 = 3,
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

/** @java main.math.MathRoutines.log2(double) */
function log2(x: number): number {
  return Math.log(x) / Math.log(2);
}

// ---------------------------------------------------------------------------

/**
 * Class with methods for learning decision trees (classifiers) from experience.
 *
 * @java decision_trees.classifiers.ExperienceIQRTreeLearner
 */
export class ExperienceIQRTreeLearner {

  //-------------------------------------------------------------------------

  /**
   * Builds an IQR classification tree node for given feature set and experience buffer
   * @java ExperienceIQRTreeLearner.buildTree(BaseFeatureSet, LinearFunction, ExperienceBuffer, int, int)
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
    const allTargetClasses: IQRClass[] = [];

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

        // Sort indices by logit value
        const sortedIndices: number[] = Array.from({ length: featureVectors.length }, (_, idx) => idx);
        sortedIndices.sort((i1, i2) => {
          const delta = logits[i1]! - logits[i2]!;
          if (delta < 0) return -1;
          if (delta > 0) return 1;
          return 0;
        });

        const numBottom25 = Math.min(1, Math.round(0.25 * featureVectors.length));
        const numTop25 = numBottom25;
        const numIQR = featureVectors.length - numBottom25 - numTop25;

        let lowestTop25Logit = Infinity;
        let highestBottom25Logit = -Infinity;

        const classes: IQRClass[] = new Array(sortedIndices.length).fill(IQRClass.UNDEFINED);

        for (let i = 0; i < numBottom25; ++i) {
          const idx = sortedIndices[i]!;
          const logit = logits[idx]!;
          classes[idx] = IQRClass.Bottom25;
          highestBottom25Logit = Math.max(highestBottom25Logit, logit);
        }

        for (let i = sortedIndices.length - 1; i >= numBottom25 + numIQR; --i) {
          const idx = sortedIndices[i]!;
          const logit = logits[idx]!;
          classes[idx] = IQRClass.Top25;
          lowestTop25Logit = Math.min(lowestTop25Logit, logit);
        }

        for (let i = numBottom25; i < numBottom25 + numIQR; ++i) {
          const idx = sortedIndices[i]!;
          const logit = logits[idx]!;
          if (logit === lowestTop25Logit) {
            classes[idx] = IQRClass.Top25;
          } else if (logit === highestBottom25Logit) {
            classes[idx] = IQRClass.Bottom25;
          } else {
            classes[idx] = IQRClass.IQR;
          }
        }

        if (lowestTop25Logit === highestBottom25Logit) {
          // Top 25% and Bottom 25% logits overlap, so shrink those two buckets
          // and instead have a greater IQR
          for (let i = 0; i < sortedIndices.length; ++i) {
            const idx = sortedIndices[i]!;
            const logit = logits[idx]!;
            if (logit === lowestTop25Logit) {
              classes[idx] = IQRClass.IQR;
            }
          }
        }

        for (const targetClass of classes) {
          allTargetClasses.push(targetClass);
        }
      }
    }

    return ExperienceIQRTreeLearner.buildNode(
      featureSet,
      allFeatureVectors,
      allTargetClasses,
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
   * @java ExperienceIQRTreeLearner.buildNode(BaseFeatureSet, List<FeatureVector>, List<IQRClass>, BitSet, BitSet, int, int, int, int)
   */
  private static buildNode(
    featureSet: BaseFeatureSet,
    remainingFeatureVectors: FeatureVector[],
    remainingTargetClasses: IQRClass[],
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
      // This should probably never happen
      console.error("Empty list of remaining feature vectors!");
      return new DecisionLeafNode(1 / 3, 1 / 3, 1 / 3);
    }

    let numBottom25 = 0;
    let numTop25 = 0;

    for (const iqrClass of remainingTargetClasses) {
      if (iqrClass === IQRClass.Bottom25) ++numBottom25;
      else if (iqrClass === IQRClass.Top25) ++numTop25;
    }

    const probBottom25 = numBottom25 / remainingTargetClasses.length;
    const probTop25 = numTop25 / remainingTargetClasses.length;
    const probIQR = 1 - probBottom25 - probTop25;

    if (allowedDepth === 0) {
      // Have to create leaf node here
      return new DecisionLeafNode(probBottom25, probIQR, probTop25);
    }

    let entropyBeforeSplit = 0;
    if (probBottom25 > 0) entropyBeforeSplit -= probBottom25 * log2(probBottom25);
    if (probTop25 > 0) entropyBeforeSplit -= probTop25 * log2(probTop25);
    if (probIQR > 0) entropyBeforeSplit -= probIQR * log2(probIQR);

    // Find feature with maximum information gain
    let maxInformationGain = -Infinity;
    let minInformationGain = Infinity;
    let bestIdx = -1;
    let bestFeatureIsAspatial = true;

    for (let i = 0; i < numAspatialFeatures; ++i) {
      if (alreadyPickedAspatials.has(i)) continue;

      let numBottom25IfFalse = 0;
      let numIQRIfFalse = 0;
      let numTop25IfFalse = 0;

      let numBottom25IfTrue = 0;
      let numIQRIfTrue = 0;
      let numTop25IfTrue = 0;

      for (let j = 0; j < remainingFeatureVectors.length; ++j) {
        const fv = remainingFeatureVectors[j]!;
        const iqrClass = remainingTargetClasses[j]!;

        if (fv.aspatialFeatureValues().get(i) !== 0) {
          if (iqrClass === IQRClass.Bottom25) ++numBottom25IfTrue;
          else if (iqrClass === IQRClass.IQR) ++numIQRIfTrue;
          else if (iqrClass === IQRClass.Top25) ++numTop25IfTrue;
          else console.error("Unrecognised IQR class!");
        } else {
          if (iqrClass === IQRClass.Bottom25) ++numBottom25IfFalse;
          else if (iqrClass === IQRClass.IQR) ++numIQRIfFalse;
          else if (iqrClass === IQRClass.Top25) ++numTop25IfFalse;
          else console.error("Unrecognised IQR class!");
        }
      }

      const totalNumFalse = numBottom25IfFalse + numIQRIfFalse + numTop25IfFalse;
      const totalNumTrue = numBottom25IfTrue + numIQRIfTrue + numTop25IfTrue;

      if (totalNumFalse < minSamplesPerLeaf || totalNumTrue < minSamplesPerLeaf) continue;

      const probBottom25IfFalse = numBottom25IfFalse / totalNumFalse;
      const probIQRIfFalse = numIQRIfFalse / totalNumFalse;
      const probTop25IfFalse = numTop25IfFalse / totalNumFalse;

      const probBottom25IfTrue = numBottom25IfTrue / totalNumTrue;
      const probIQRIfTrue = numIQRIfTrue / totalNumTrue;
      const probTop25IfTrue = numTop25IfTrue / totalNumTrue;

      let entropyFalseBranch = 0;
      if (probBottom25IfFalse > 0) entropyFalseBranch -= probBottom25IfFalse * log2(probBottom25IfFalse);
      if (probIQRIfFalse > 0) entropyFalseBranch -= probIQRIfFalse * log2(probIQRIfFalse);
      if (probTop25IfFalse > 0) entropyFalseBranch -= probTop25IfFalse * log2(probTop25IfFalse);

      let entropyTrueBranch = 0;
      if (probBottom25IfTrue > 0) entropyTrueBranch -= probBottom25IfTrue * log2(probBottom25IfTrue);
      if (probIQRIfTrue > 0) entropyTrueBranch -= probIQRIfTrue * log2(probIQRIfTrue);
      if (probTop25IfTrue > 0) entropyTrueBranch -= probTop25IfTrue * log2(probTop25IfTrue);

      const probFalse = totalNumFalse / (totalNumFalse + totalNumTrue);
      const probTrue = 1 - probFalse;

      const informationGain = entropyBeforeSplit - probFalse * entropyFalseBranch - probTrue * entropyTrueBranch;

      if (informationGain > maxInformationGain) { maxInformationGain = informationGain; bestIdx = i; }
      if (informationGain < minInformationGain) { minInformationGain = informationGain; }
    }

    for (let i = 0; i < numSpatialFeatures; ++i) {
      if (alreadyPickedSpatials.has(i)) continue;

      let numBottom25IfFalse = 0;
      let numIQRIfFalse = 0;
      let numTop25IfFalse = 0;

      let numBottom25IfTrue = 0;
      let numIQRIfTrue = 0;
      let numTop25IfTrue = 0;

      for (let j = 0; j < remainingFeatureVectors.length; ++j) {
        const fv = remainingFeatureVectors[j]!;
        const iqrClass = remainingTargetClasses[j]!;

        if (fv.activeSpatialFeatureIndices().contains(i)) {
          if (iqrClass === IQRClass.Bottom25) ++numBottom25IfTrue;
          else if (iqrClass === IQRClass.IQR) ++numIQRIfTrue;
          else if (iqrClass === IQRClass.Top25) ++numTop25IfTrue;
          else console.error("Unrecognised IQR class!");
        } else {
          if (iqrClass === IQRClass.Bottom25) ++numBottom25IfFalse;
          else if (iqrClass === IQRClass.IQR) ++numIQRIfFalse;
          else if (iqrClass === IQRClass.Top25) ++numTop25IfFalse;
          else console.error("Unrecognised IQR class!");
        }
      }

      const totalNumFalse = numBottom25IfFalse + numIQRIfFalse + numTop25IfFalse;
      const totalNumTrue = numBottom25IfTrue + numIQRIfTrue + numTop25IfTrue;

      if (totalNumFalse < minSamplesPerLeaf || totalNumTrue < minSamplesPerLeaf) continue;

      const probBottom25IfFalse = numBottom25IfFalse / totalNumFalse;
      const probIQRIfFalse = numIQRIfFalse / totalNumFalse;
      const probTop25IfFalse = numTop25IfFalse / totalNumFalse;

      const probBottom25IfTrue = numBottom25IfTrue / totalNumTrue;
      const probIQRIfTrue = numIQRIfTrue / totalNumTrue;
      const probTop25IfTrue = numTop25IfTrue / totalNumTrue;

      let entropyFalseBranch = 0;
      if (probBottom25IfFalse > 0) entropyFalseBranch -= probBottom25IfFalse * log2(probBottom25IfFalse);
      if (probIQRIfFalse > 0) entropyFalseBranch -= probIQRIfFalse * log2(probIQRIfFalse);
      if (probTop25IfFalse > 0) entropyFalseBranch -= probTop25IfFalse * log2(probTop25IfFalse);

      let entropyTrueBranch = 0;
      if (probBottom25IfTrue > 0) entropyTrueBranch -= probBottom25IfTrue * log2(probBottom25IfTrue);
      if (probIQRIfTrue > 0) entropyTrueBranch -= probIQRIfTrue * log2(probIQRIfTrue);
      if (probTop25IfTrue > 0) entropyTrueBranch -= probTop25IfTrue * log2(probTop25IfTrue);

      const probFalse = totalNumFalse / (totalNumFalse + totalNumTrue);
      const probTrue = 1 - probFalse;

      const informationGain = entropyBeforeSplit - probFalse * entropyFalseBranch - probTrue * entropyTrueBranch;

      if (informationGain > maxInformationGain) { maxInformationGain = informationGain; bestIdx = i; bestFeatureIsAspatial = false; }
      if (informationGain < minInformationGain) { minInformationGain = informationGain; }
    }

    if (bestIdx === -1 || maxInformationGain === 0 || minInformationGain === maxInformationGain) {
      // No point in making any split at all, so just make leaf
      return new DecisionLeafNode(probBottom25, probIQR, probTop25);
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
    const remainingTargetClassesTrue: IQRClass[] = [];

    const remainingFeatureVectorsFalse: FeatureVector[] = [];
    const remainingTargetClassesFalse: IQRClass[] = [];

    if (bestFeatureIsAspatial) {
      for (let i = 0; i < remainingFeatureVectors.length; ++i) {
        if (remainingFeatureVectors[i]!.aspatialFeatureValues().get(bestIdx) !== 0) {
          remainingFeatureVectorsTrue.push(remainingFeatureVectors[i]!);
          remainingTargetClassesTrue.push(remainingTargetClasses[i]!);
        } else {
          remainingFeatureVectorsFalse.push(remainingFeatureVectors[i]!);
          remainingTargetClassesFalse.push(remainingTargetClasses[i]!);
        }
      }
    } else {
      for (let i = 0; i < remainingFeatureVectors.length; ++i) {
        if (remainingFeatureVectors[i]!.activeSpatialFeatureIndices().contains(bestIdx)) {
          remainingFeatureVectorsTrue.push(remainingFeatureVectors[i]!);
          remainingTargetClassesTrue.push(remainingTargetClasses[i]!);
        } else {
          remainingFeatureVectorsFalse.push(remainingFeatureVectors[i]!);
          remainingTargetClassesFalse.push(remainingTargetClasses[i]!);
        }
      }
    }

    // Create the node for case where splitting feature is true
    const trueBranch = ExperienceIQRTreeLearner.buildNode(
      featureSet,
      remainingFeatureVectorsTrue,
      remainingTargetClassesTrue,
      newAlreadyPickedAspatials,
      newAlreadyPickedSpatials,
      numAspatialFeatures,
      numSpatialFeatures,
      allowedDepth - 1,
      minSamplesPerLeaf
    );

    // Create the node for case where splitting feature is false
    const falseBranch = ExperienceIQRTreeLearner.buildNode(
      featureSet,
      remainingFeatureVectorsFalse,
      remainingTargetClassesFalse,
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
