// @java AI/src/training/feature_discovery/ErrorReductionExpander.java

/**
 * Feature Set expander based on estimated reduction in error.
 *
 * @java training.feature_discovery.ErrorReductionExpander
 * @author Dennis Soemers
 */

import {
  CombinableFeatureInstancePair,
  ScoredFeatureInstancePair,
  type BaseFeatureSet,
  type BitSet,
  type ExperienceSample,
  type FastArrayList,
  type FeatureDiscoveryParams,
  type FeatureInstance,
  type FeatureVector,
  type FVector,
  type Game,
  type InterruptableExperiment,
  type Move,
  type ObjectiveParams,
  type PrintWriter,
  type SoftmaxPolicyLinear,
  type SpatialFeature,
  type TDoubleArrayList,
  type TIntArrayList,
} from "./FeatureSetExpander.js";

// FeatureUtils escape hatch
const FeatureUtils = null as unknown as {
  fromPos(move: Move): number;
  toPos(move: Move): number;
};

// Gradients escape hatch
const GradientsHelper = null as unknown as {
  computeDistributionErrors(estimated: FVector, target: FVector): FVector;
};

/** @java new FVector(int) — escape hatch */
const fvectorFromSize = null as unknown as (dim: number) => FVector;

//-------------------------------------------------------------------------

function mapGetOrNull(
  map: Map<CombinableFeatureInstancePair, number[]>,
  key: CombinableFeatureInstancePair,
): number[] | null {
  for (const [k, v] of map) {
    if (k.equals(key)) return v;
  }
  return null;
}

function containsPair(set: Set<CombinableFeatureInstancePair>, key: CombinableFeatureInstancePair): boolean {
  for (const k of set) {
    if (k.equals(key)) return true;
  }
  return false;
}

function addPair(set: Set<CombinableFeatureInstancePair>, key: CombinableFeatureInstancePair): void {
  if (!containsPair(set, key)) {
    set.add(key);
  }
}

function removeSwapNum(list: number[], idx: number): void {
  list[idx] = list[list.length - 1]!;
  list.pop();
}

//-------------------------------------------------------------------------

/**
 * ErrorReductionExpander: Expands feature sets based on estimated error reduction.
 *
 * @java training.feature_discovery.ErrorReductionExpander
 */
export class ErrorReductionExpander {

  //-------------------------------------------------------------------------

  /**
   * @java ErrorReductionExpander.expandFeatureSet(...)
   */
  public expandFeatureSet(
    batch: ExperienceSample[],
    featureSet: BaseFeatureSet,
    policy: SoftmaxPolicyLinear,
    game: Game,
    featureDiscoveryMaxNumFeatureInstances: number,
    objectiveParams: ObjectiveParams,
    featureDiscoveryParams: FeatureDiscoveryParams,
    featureActiveRatios: TDoubleArrayList,
    logWriter: PrintWriter,
    experiment: InterruptableExperiment,
  ): BaseFeatureSet | null {
    let numCases = 0; // we'll increment this as we go

    const errorLists = new Map<CombinableFeatureInstancePair, number[]>();

    // Create a Hash Set of features already in Feature Set
    const existingFeatures = new Set<SpatialFeature>();
    for (const feature of featureSet.spatialFeatures()) {
      existingFeatures.add(feature);
    }

    // For every sample in batch, first compute apprentice policies, errors, and sum of absolute errors
    const apprenticePolicies: FVector[] = new Array(batch.length);
    const errorVectors: FVector[] = new Array(batch.length);
    const absErrorSums: number[] = new Array(batch.length).fill(0);

    const errorsPerActiveFeature: number[][] = new Array(featureSet.getNumSpatialFeatures());
    const errorsPerInactiveFeature: number[][] = new Array(featureSet.getNumSpatialFeatures());
    for (let i = 0; i < errorsPerActiveFeature.length; ++i) {
      errorsPerActiveFeature[i] = [];
      errorsPerInactiveFeature[i] = [];
    }
    let avgActionError = 0.0;

    for (let i = 0; i < batch.length; ++i) {
      const sample = batch[i]!;
      const featureVectors = sample.generateFeatureVectors(featureSet);

      const apprenticePolicy = policy.computeDistribution(featureVectors, sample.gameState().mover());
      const errors = GradientsHelper.computeDistributionErrors(
        apprenticePolicy,
        sample.expertDistribution() as FVector,
      );

      for (let a = 0; a < featureVectors.length; ++a) {
        const actionError = errors.get(a);
        const sparseFeatureVector = featureVectors[a]!.activeSpatialFeatureIndices();
        sparseFeatureVector.sort();
        let sparseIdx = 0;

        for (let featureIdx = 0; featureIdx < featureSet.getNumSpatialFeatures(); ++featureIdx) {
          if (sparseIdx < sparseFeatureVector.size() && sparseFeatureVector.getQuick(sparseIdx) === featureIdx) {
            errorsPerActiveFeature[featureIdx]!.push(actionError);
            ++sparseIdx;
          } else {
            errorsPerInactiveFeature[featureIdx]!.push(actionError);
          }
        }

        avgActionError += (actionError - avgActionError) / (numCases + 1);
        ++numCases;
      }

      const absErrors = errors.copy();
      absErrors.abs();
      apprenticePolicies[i] = apprenticePolicy;
      errorVectors[i] = errors;
      absErrorSums[i] = absErrors.sum();
    }

    // For every feature, compute sample correlation coefficient between its activity level (0 or 1) and errors
    const featureErrorCorrelations = new Float64Array(featureSet.getNumSpatialFeatures());
    const expectedAbsErrorGivenFeature = new Float64Array(featureSet.getNumSpatialFeatures());
    const expectedFeatureTimesAbsError = new Float64Array(featureSet.getNumSpatialFeatures());

    for (let fIdx = 0; fIdx < featureSet.getNumSpatialFeatures(); ++fIdx) {
      const errorsWhenActive = errorsPerActiveFeature[fIdx]!;
      const errorsWhenInactive = errorsPerInactiveFeature[fIdx]!;

      const avgFeatureVal = errorsWhenActive.length / (errorsWhenActive.length + errorsWhenInactive.length);

      let dErrorSquaresSum = 0.0;
      let numerator = 0.0;

      for (let i = 0; i < errorsWhenActive.length; ++i) {
        const error = errorsWhenActive[i]!;
        const dError = error - avgActionError;
        numerator += (1.0 - avgFeatureVal) * dError;
        dErrorSquaresSum += dError * dError;
        expectedAbsErrorGivenFeature[fIdx] = expectedAbsErrorGivenFeature[fIdx]! + (Math.abs(error) - expectedAbsErrorGivenFeature[fIdx]!) / (i + 1);
        expectedFeatureTimesAbsError[fIdx] = expectedFeatureTimesAbsError[fIdx]! + (Math.abs(error) - expectedFeatureTimesAbsError[fIdx]!) / (i + 1);
      }

      for (let i = 0; i < errorsWhenInactive.length; ++i) {
        const error = errorsWhenInactive[i]!;
        const dError = error - avgActionError;
        numerator += (0.0 - avgFeatureVal) * dError;
        dErrorSquaresSum += dError * dError;
        expectedFeatureTimesAbsError[fIdx] = expectedFeatureTimesAbsError[fIdx]! + (0.0 - expectedFeatureTimesAbsError[fIdx]!) / (i + 1);
      }

      const dFeatureSquaresSum =
        errorsWhenActive.length * ((1.0 - avgFeatureVal) * (1.0 - avgFeatureVal)) +
        errorsWhenInactive.length * ((0.0 - avgFeatureVal) * (0.0 - avgFeatureVal));

      const denominator = Math.sqrt(dFeatureSquaresSum * dErrorSquaresSum);
      featureErrorCorrelations[fIdx] = numerator / denominator;
      if (isNaN(featureErrorCorrelations[fIdx]!)) featureErrorCorrelations[fIdx] = 0;
    }

    // Create list of indices sorted in descending order of sums of absolute errors
    const batchIndices: number[] = Array.from({ length: batch.length }, (_, i) => i);
    batchIndices.sort((o1, o2) => {
      const delta = absErrorSums[o1]! - absErrorSums[o2]!;
      if (delta > 0) return -1;
      else if (delta < 0) return 1;
      else return 0;
    });

    // Set of feature instances that we have already preserved
    const preservedInstances = new Set<CombinableFeatureInstancePair>();
    // Set of feature instances that we have already chosen to discard once
    const discardedInstances = new Set<CombinableFeatureInstancePair>();

    // Loop through all samples in batch
    for (let bi = 0; bi < batchIndices.length; ++bi) {
      const batchIndex = batchIndices[bi]!;
      const sample = batch[batchIndex]!;
      const errors = errorVectors[batchIndex]!;
      const minError = errors.min();
      const maxError = errors.max();
      const moves = sample.moves();

      const sortedActionIndices: number[] = [];

      const winningMoves = sample.winningMoves();
      for (let i = winningMoves.nextSetBit(0); i >= 0; i = winningMoves.nextSetBit(i + 1)) {
        sortedActionIndices.push(i);
      }

      const losingMoves = sample.losingMoves();
      for (let i = losingMoves.nextSetBit(0); i >= 0; i = losingMoves.nextSetBit(i + 1)) {
        sortedActionIndices.push(i);
      }

      const antiDefeatingMoves = sample.antiDefeatingMoves();
      for (let i = antiDefeatingMoves.nextSetBit(0); i >= 0; i = antiDefeatingMoves.nextSetBit(i + 1)) {
        sortedActionIndices.push(i);
      }

      const unsortedActionIndices: number[] = [];
      for (let a = 0; a < moves.size(); ++a) {
        if (!winningMoves.get(a) && !losingMoves.get(a) && !antiDefeatingMoves.get(a)) {
          unsortedActionIndices.push(a);
        }
      }

      while (unsortedActionIndices.length > 0) {
        const r = Math.floor(Math.random() * unsortedActionIndices.length);
        const a = unsortedActionIndices[r]!;
        removeSwapNum(unsortedActionIndices, r);
        sortedActionIndices.push(a);
      }

      // Every action in the sample is a new "case"
      for (let aIdx = 0; aIdx < sortedActionIndices.length; ++aIdx) {
        const a = sortedActionIndices[aIdx]!;

        const observedCasePairs = new Set<CombinableFeatureInstancePair>();

        const activeInstancesSet = new Set<FeatureInstance>(
          featureSet.getActiveSpatialFeatureInstances(
            sample.gameState(),
            sample.lastFromPos(),
            sample.lastToPos(),
            FeatureUtils.fromPos(moves.get(a)),
            FeatureUtils.toPos(moves.get(a)),
            moves.get(a).mover(),
          ),
        );
        const activeInstances: FeatureInstance[] = Array.from(activeInstancesSet);

        const origActiveInstances: FeatureInstance[] = [...activeInstances];

        const instancesToKeep: FeatureInstance[] = [];
        const activeInstancesCombinedSelfs: CombinableFeatureInstancePair[] = [];
        const instancesToKeepCombinedSelfs: CombinableFeatureInstancePair[] = [];

        for (let i = 0; i < activeInstances.length; /**/) {
          const instance = activeInstances[i]!;
          const combinedSelf = new CombinableFeatureInstancePair(game, instance, instance);

          if (containsPair(preservedInstances, combinedSelf)) {
            instancesToKeepCombinedSelfs.push(combinedSelf);
            instancesToKeep.push(instance);
            activeInstances.splice(i, 1);
          } else if (containsPair(discardedInstances, combinedSelf)) {
            activeInstances.splice(i, 1);
          } else {
            activeInstancesCombinedSelfs.push(combinedSelf);
            ++i;
          }
        }

        // This action is allowed to pick at most this many extra instances
        let numInstancesAllowedThisAction = Math.min(
          Math.min(15, featureDiscoveryMaxNumFeatureInstances - preservedInstances.size),
          activeInstances.length,
        );

        if (numInstancesAllowedThisAction > 0) {
          const distr = fvectorFromSize(activeInstances.length);
          for (let i = 0; i < activeInstances.length; ++i) {
            const fIdx = activeInstances[i]!.feature().spatialFeatureSetIndex();
            distr.set(i, featureErrorCorrelations[fIdx]! + expectedAbsErrorGivenFeature[fIdx]! + expectedFeatureTimesAbsError[fIdx]!);
          }
          distr.softmax(1.0);

          // For every instance, divide its probability by the number of active instances for the same feature
          for (let i = 0; i < activeInstances.length; ++i) {
            const fIdx = activeInstances[i]!.feature().spatialFeatureSetIndex();
            let featureCount = 0;
            for (let j = 0; j < origActiveInstances.length; ++j) {
              if (origActiveInstances[j]!.feature().spatialFeatureSetIndex() === fIdx) ++featureCount;
            }
            distr.set(i, distr.get(i) / featureCount);
          }
          distr.normalise();

          while (numInstancesAllowedThisAction > 0) {
            const sampledIdx = distr.sampleFromDistribution();
            const combinedSelf = activeInstancesCombinedSelfs[sampledIdx]!;
            const keepInstance = activeInstances[sampledIdx]!;
            instancesToKeep.push(keepInstance);
            instancesToKeepCombinedSelfs.push(combinedSelf);
            addPair(preservedInstances, combinedSelf);
            distr.updateSoftmaxInvalidate(sampledIdx);
            --numInstancesAllowedThisAction;
          }
        }

        // Mark all instances that haven't been marked as preserved yet as discarded
        for (let i = 0; i < activeInstances.length; ++i) {
          const combinedSelf = new CombinableFeatureInstancePair(game, activeInstances[i]!, activeInstances[i]!);
          if (!containsPair(preservedInstances, combinedSelf)) {
            addPair(discardedInstances, combinedSelf);
          }
        }

        const numActiveInstances = instancesToKeep.length;

        let error = errors.get(a);
        if (winningMoves.get(a)) {
          error = minError;
        } else if (losingMoves.get(a)) {
          error = maxError;
        } else if (antiDefeatingMoves.get(a)) {
          error = Math.min(error, minError + 0.1);
        }

        for (let i = 0; i < numActiveInstances; ++i) {
          const instanceI = instancesToKeep[i]!;

          // increment entries on main diagonals
          const combinedSelf = instancesToKeepCombinedSelfs[i]!;

          if (!containsPair(observedCasePairs, combinedSelf)) {
            addPair(observedCasePairs, combinedSelf);
            let errorsList = mapGetOrNull(errorLists, combinedSelf);
            if (errorsList === null) {
              errorsList = [];
              errorLists.set(combinedSelf, errorsList);
            }
            errorsList.push(error);
          }

          for (let j = i + 1; j < numActiveInstances; ++j) {
            const instanceJ = instancesToKeep[j]!;

            // increment off-diagonal entries
            const combined = new CombinableFeatureInstancePair(game, instanceI, instanceJ);

            if (!existingFeatures.has(combined.combinedFeature)) {
              let errorsList = mapGetOrNull(errorLists, combined);
              if (errorsList === null) {
                errorsList = [];
                errorLists.set(combined, errorsList);
              }
              errorsList.push(error);
            }
          }
        }
      }
    }

    // Construct all possible pairs and scores
    const proactivePairs: ScoredFeatureInstancePair[] = [];
    const reactivePairs: ScoredFeatureInstancePair[] = [];

    for (const [pair, errList] of errorLists) {
      if (!pair.a.equals(pair.b)) { // Only interested in combinations of different instances
        const pairErrorReduction = computeMaxErrorReduction(errList);

        const selfA = new CombinableFeatureInstancePair(game, pair.a, pair.a);
        const selfB = new CombinableFeatureInstancePair(game, pair.b, pair.b);
        const errListA = mapGetOrNull(errorLists, selfA) ?? [];
        const errListB = mapGetOrNull(errorLists, selfB) ?? [];
        const errorReductionA = computeMaxErrorReduction(errListA);
        const errorReductionB = computeMaxErrorReduction(errListB);

        const score = pairErrorReduction - errorReductionA - errorReductionB;

        if (pair.combinedFeature.isReactive()) {
          reactivePairs.push(new ScoredFeatureInstancePair(pair, score));
        } else {
          proactivePairs.push(new ScoredFeatureInstancePair(pair, score));
        }
      }
    }

    // Sort descending by score
    proactivePairs.sort((a, b) => b.score - a.score);
    reactivePairs.sort((a, b) => b.score - a.score);

    // Keep trying to add a proactive feature
    let currFeatureSet: BaseFeatureSet = featureSet;

    while (proactivePairs.length > 0) {
      const bestPair = proactivePairs.shift()!;
      const newFeatureSet = currFeatureSet.createExpandedFeatureSet(game, bestPair.pair.combinedFeature);
      if (newFeatureSet !== null) {
        currFeatureSet = newFeatureSet;
        break;
      }
    }

    // Keep trying to add a reactive feature
    while (reactivePairs.length > 0) {
      const bestPair = reactivePairs.shift()!;
      const newFeatureSet = currFeatureSet.createExpandedFeatureSet(game, bestPair.pair.combinedFeature);
      if (newFeatureSet !== null) {
        currFeatureSet = newFeatureSet;
        break;
      }
    }

    return currFeatureSet;
  }

  //-------------------------------------------------------------------------

  /**
   * @param errorsList
   * @return Estimate of maximum error reduction we can get from a single feature with
   *   a given list of errors.
   * @java ErrorReductionExpander.computeMaxErrorReduction(TDoubleArrayList)
   */
  private static computeMaxErrorReduction(errorsList: number[]): number {
    if (errorsList.length === 0) return 0.0;

    const sorted = [...errorsList].sort((a, b) => a - b);
    const midIndex = (sorted.length - 1) >>> 1; // integer division by 2
    let median: number;
    if (sorted.length % 2 === 0) {
      median = (sorted[midIndex]! + sorted[midIndex + 1]!) / 2.0;
    } else {
      median = sorted[midIndex]!;
    }

    let origAbsErrorSum = 0.0;
    let newAbsErrorSum = 0.0;
    for (let i = 0; i < sorted.length; ++i) {
      origAbsErrorSum += Math.abs(sorted[i]!);
      newAbsErrorSum += Math.abs(sorted[i]! - median);
    }

    const errorReduction = origAbsErrorSum - newAbsErrorSum;

    if (errorReduction < 0.0) {
      console.error("ERROR: NEGATIVE ERROR REDUCTION!");
    }

    return errorReduction;
  }

  //-------------------------------------------------------------------------

}

//-------------------------------------------------------------------------

function computeMaxErrorReduction(errorsList: number[]): number {
  return ErrorReductionExpander["computeMaxErrorReduction"](errorsList);
}
