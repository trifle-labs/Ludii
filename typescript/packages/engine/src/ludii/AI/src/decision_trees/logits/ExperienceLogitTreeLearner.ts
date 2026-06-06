// @java AI/src/decision_trees/logits/ExperienceLogitTreeLearner.java

/**
 * Class with methods for learning logit trees from experience.
 *
 * @java decision_trees/logits/ExperienceLogitTreeLearner.java
 * @author Dennis Soemers
 */

import { LogitTreeNode, type Feature, type AspatialFeature, type FeatureVector, type BaseFeatureSet } from "./LogitTreeNode.js";
import { LogitDecisionNode } from "./LogitDecisionNode.js";
import { LogitModelNode } from "./LogitModelNode.js";

// Not-yet-ported escape-hatch interfaces

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

/** Intercept feature singleton escape hatch */
const InterceptFeature: Feature & AspatialFeature = {
  __aspatial: true as const,
  toString() { return "Intercept"; },
};

//-------------------------------------------------------------------------

/**
 * Class with methods for learning logit trees from experience.
 *
 * @java decision_trees.logits.ExperienceLogitTreeLearner
 */
export class ExperienceLogitTreeLearner {

  //-------------------------------------------------------------------------

  /**
   * Builds an exact logit tree node for given feature set and experience buffer
   * @java ExperienceLogitTreeLearner.buildTree(BaseFeatureSet, LinearFunction, ExperienceBuffer, int, int)
   */
  public static buildTree(
    featureSet: BaseFeatureSet,
    linFunc: LinearFunction,
    buffer: ExperienceBuffer,
    maxDepth: number,
    minSamplesPerLeaf: number
  ): LogitTreeNode {
    const oracleWeightVector = linFunc.effectiveParams();
    const samples = buffer.allExperience();
    const allFeatureVectors: FeatureVector[] = [];
    const allTargetLogits: number[] = [];

    for (const sample of samples) {
      if (sample !== null && sample !== undefined && sample.moves().size() > 1) {
        const featureVectors = sample.generateFeatureVectors(featureSet);

        for (const featureVector of featureVectors) {
          allFeatureVectors.push(featureVector);
          allTargetLogits.push(oracleWeightVector.dot(featureVector));
        }
      }
    }

    return ExperienceLogitTreeLearner.buildNode(
      featureSet,
      allFeatureVectors,
      allTargetLogits,
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
   * @java ExperienceLogitTreeLearner.buildNode(BaseFeatureSet, List<FeatureVector>, TFloatArrayList, BitSet, BitSet, int, int, int, int)
   */
  private static buildNode(
    featureSet: BaseFeatureSet,
    remainingFeatureVectors: FeatureVector[],
    remainingTargetLogits: number[],
    alreadyPickedAspatials: Set<number>,
    alreadyPickedSpatials: Set<number>,
    numAspatialFeatures: number,
    numSpatialFeatures: number,
    allowedDepth: number,
    minSamplesPerLeaf: number
  ): LogitTreeNode {
    if (minSamplesPerLeaf <= 0) {
      throw new Error("minSamplesPerLeaf must be greater than 0");
    }

    if (remainingFeatureVectors.length === 0) {
      return new LogitModelNode([InterceptFeature], [0]);
    }

    if (allowedDepth === 0) {
      // Have to create leaf node here — TODO could in theory use remaining features to compute a model again
      const sum = remainingTargetLogits.reduce((a, b) => a + b, 0);
      const meanLogit = sum / remainingTargetLogits.length;
      return new LogitModelNode([InterceptFeature], [meanLogit]);
    }

    // For every aspatial and every spatial feature, if not already picked, compute mean logits for true and false branches
    const sumLogitsIfFalseAspatial = new Array<number>(numAspatialFeatures).fill(0);
    const numFalseAspatial = new Array<number>(numAspatialFeatures).fill(0);
    const sumLogitsIfTrueAspatial = new Array<number>(numAspatialFeatures).fill(0);
    const numTrueAspatial = new Array<number>(numAspatialFeatures).fill(0);

    for (let i = 0; i < numAspatialFeatures; ++i) {
      if (alreadyPickedAspatials.has(i)) continue;

      for (let j = 0; j < remainingFeatureVectors.length; ++j) {
        const featureVector = remainingFeatureVectors[j]!;
        const targetLogit = remainingTargetLogits[j]!;

        if (featureVector.aspatialFeatureValues().get(i) !== 0) {
          (sumLogitsIfTrueAspatial as number[])[i] = (sumLogitsIfTrueAspatial as number[])[i]! + targetLogit;
          (numTrueAspatial as number[])[i] = (numTrueAspatial as number[])[i]! + 1;
        } else {
          (sumLogitsIfFalseAspatial as number[])[i] = (sumLogitsIfFalseAspatial as number[])[i]! + targetLogit;
          (numFalseAspatial as number[])[i] = (numFalseAspatial as number[])[i]! + 1;
        }
      }
    }

    const sumLogitsIfFalseSpatial = new Array<number>(numSpatialFeatures).fill(0);
    const numFalseSpatial = new Array<number>(numSpatialFeatures).fill(0);
    const sumLogitsIfTrueSpatial = new Array<number>(numSpatialFeatures).fill(0);
    const numTrueSpatial = new Array<number>(numSpatialFeatures).fill(0);

    for (let i = 0; i < remainingFeatureVectors.length; ++i) {
      const featureVector = remainingFeatureVectors[i]!;
      const targetLogit = remainingTargetLogits[i]!;

      const active = new Array<boolean>(numSpatialFeatures).fill(false);
      const sparseSpatials = featureVector.activeSpatialFeatureIndices();

      for (let j = 0; j < sparseSpatials.size(); ++j) {
        active[sparseSpatials.getQuick(j)] = true;
      }

      for (let j = 0; j < active.length; ++j) {
        if (alreadyPickedSpatials.has(j)) continue;

        if (active[j]) {
          (sumLogitsIfTrueSpatial as number[])[j] = (sumLogitsIfTrueSpatial as number[])[j]! + targetLogit;
          (numTrueSpatial as number[])[j] = (numTrueSpatial as number[])[j]! + 1;
        } else {
          (sumLogitsIfFalseSpatial as number[])[j] = (sumLogitsIfFalseSpatial as number[])[j]! + targetLogit;
          (numFalseSpatial as number[])[j] = (numFalseSpatial as number[])[j]! + 1;
        }
      }
    }

    const meanLogitsIfFalseAspatial = new Array<number>(numAspatialFeatures).fill(0);
    const meanLogitsIfTrueAspatial = new Array<number>(numAspatialFeatures).fill(0);
    const meanLogitsIfFalseSpatial = new Array<number>(numSpatialFeatures).fill(0);
    const meanLogitsIfTrueSpatial = new Array<number>(numSpatialFeatures).fill(0);

    for (let i = 0; i < numAspatialFeatures; ++i) {
      if (numFalseAspatial[i]! > 0) meanLogitsIfFalseAspatial[i] = sumLogitsIfFalseAspatial[i]! / numFalseAspatial[i]!;
      if (numTrueAspatial[i]! > 0) meanLogitsIfTrueAspatial[i] = sumLogitsIfTrueAspatial[i]! / numTrueAspatial[i]!;
    }

    for (let i = 0; i < numSpatialFeatures; ++i) {
      if (numFalseSpatial[i]! > 0) meanLogitsIfFalseSpatial[i] = sumLogitsIfFalseSpatial[i]! / numFalseSpatial[i]!;
      if (numTrueSpatial[i]! > 0) meanLogitsIfTrueSpatial[i] = sumLogitsIfTrueSpatial[i]! / numTrueSpatial[i]!;
    }

    // Find feature that maximally reduces sum of squared errors
    let minSumSquaredErrors = Infinity;
    let maxSumSquaredErrors = -Infinity;
    let bestIdx = -1;
    let bestFeatureIsAspatial = true;

    for (let i = 0; i < numAspatialFeatures; ++i) {
      if (numFalseAspatial[i]! < minSamplesPerLeaf || numTrueAspatial[i]! < minSamplesPerLeaf) continue;

      let sumSquaredErrors = 0;
      for (let j = 0; j < remainingFeatureVectors.length; ++j) {
        const featureVector = remainingFeatureVectors[j]!;
        const targetLogit = remainingTargetLogits[j]!;
        const error = featureVector.aspatialFeatureValues().get(i) !== 0
          ? targetLogit - meanLogitsIfTrueAspatial[i]!
          : targetLogit - meanLogitsIfFalseAspatial[i]!;
        sumSquaredErrors += error * error;
      }

      if (sumSquaredErrors < minSumSquaredErrors) { minSumSquaredErrors = sumSquaredErrors; bestIdx = i; }
      if (sumSquaredErrors > maxSumSquaredErrors) { maxSumSquaredErrors = sumSquaredErrors; }
    }

    for (let i = 0; i < numSpatialFeatures; ++i) {
      if (numFalseSpatial[i]! < minSamplesPerLeaf || numTrueSpatial[i]! < minSamplesPerLeaf) continue;

      let sumSquaredErrors = 0;
      for (let j = 0; j < remainingFeatureVectors.length; ++j) {
        const featureVector = remainingFeatureVectors[j]!;
        const targetLogit = remainingTargetLogits[j]!;
        const error = featureVector.activeSpatialFeatureIndices().contains(i)
          ? targetLogit - meanLogitsIfTrueSpatial[i]!
          : targetLogit - meanLogitsIfFalseSpatial[i]!;
        sumSquaredErrors += error * error;
      }

      if (sumSquaredErrors < minSumSquaredErrors) { minSumSquaredErrors = sumSquaredErrors; bestIdx = i; bestFeatureIsAspatial = false; }
      if (sumSquaredErrors > maxSumSquaredErrors) { maxSumSquaredErrors = sumSquaredErrors; }
    }

    if (bestIdx === -1 || minSumSquaredErrors === 0 || minSumSquaredErrors === maxSumSquaredErrors) {
      // No point in making any split at all, so just make leaf
      const sum = remainingTargetLogits.reduce((a, b) => a + b, 0);
      const meanLogit = sum / remainingTargetLogits.length;
      return new LogitModelNode([InterceptFeature], [meanLogit]);
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
    const remainingTargetLogitsTrue: number[] = [];

    const remainingFeatureVectorsFalse: FeatureVector[] = [];
    const remainingTargetLogitsFalse: number[] = [];

    if (bestFeatureIsAspatial) {
      for (let i = 0; i < remainingFeatureVectors.length; ++i) {
        if (remainingFeatureVectors[i]!.aspatialFeatureValues().get(bestIdx) !== 0) {
          remainingFeatureVectorsTrue.push(remainingFeatureVectors[i]!);
          remainingTargetLogitsTrue.push(remainingTargetLogits[i]!);
        } else {
          remainingFeatureVectorsFalse.push(remainingFeatureVectors[i]!);
          remainingTargetLogitsFalse.push(remainingTargetLogits[i]!);
        }
      }
    } else {
      for (let i = 0; i < remainingFeatureVectors.length; ++i) {
        if (remainingFeatureVectors[i]!.activeSpatialFeatureIndices().contains(bestIdx)) {
          remainingFeatureVectorsTrue.push(remainingFeatureVectors[i]!);
          remainingTargetLogitsTrue.push(remainingTargetLogits[i]!);
        } else {
          remainingFeatureVectorsFalse.push(remainingFeatureVectors[i]!);
          remainingTargetLogitsFalse.push(remainingTargetLogits[i]!);
        }
      }
    }

    // Create the node for case where splitting feature is true
    const trueBranch = ExperienceLogitTreeLearner.buildNode(
      featureSet,
      remainingFeatureVectorsTrue,
      remainingTargetLogitsTrue,
      newAlreadyPickedAspatials,
      newAlreadyPickedSpatials,
      numAspatialFeatures,
      numSpatialFeatures,
      allowedDepth - 1,
      minSamplesPerLeaf
    );

    // Create the node for case where splitting feature is false
    const falseBranch = ExperienceLogitTreeLearner.buildNode(
      featureSet,
      remainingFeatureVectorsFalse,
      remainingTargetLogitsFalse,
      newAlreadyPickedAspatials,
      newAlreadyPickedSpatials,
      numAspatialFeatures,
      numSpatialFeatures,
      allowedDepth - 1,
      minSamplesPerLeaf
    );

    return new LogitDecisionNode(splittingFeature, trueBranch, falseBranch);
  }

  //-------------------------------------------------------------------------
}
