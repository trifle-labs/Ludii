// @java AI/src/training/feature_discovery/KolmogorovSmirnovExpander.java

/**
 * Expands feature sets based on Kolmogorov-Smirnov statistics between distributions
 * of errors.
 *
 * @java training.feature_discovery.KolmogorovSmirnovExpander
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

// KolmogorovSmirnov escape hatch
const KolmogorovSmirnov = null as unknown as {
  kolmogorovSmirnovStatistic(a: number[], b: number[]): number;
};

// Sampling escape hatch
const Sampling = null as unknown as {
  sampleWithReplacement(n: number, source: number[]): number[];
};

// MathRoutines escape hatch
const MathRoutines = null as unknown as {
  clip(val: number, min: number, max: number): number;
};

/** @java new FVector(int) — escape hatch */
const fvectorFromSize = null as unknown as (dim: number) => FVector;

//-------------------------------------------------------------------------

/**
 * Swap-remove: replaces element at index i with last element, then removes last.
 * @java main.collections.ListUtils.removeSwap(TIntArrayList, int)
 */
function removeSwap(list: number[], idx: number): void {
  list[idx] = list[list.length - 1]!;
  list.pop();
}

function mapGetOrZero(
  map: Map<CombinableFeatureInstancePair, number>,
  key: CombinableFeatureInstancePair,
): number {
  for (const [k, v] of map) {
    if (k.equals(key)) return v;
  }
  return 0;
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

function mapGetOrNull(
  map: Map<CombinableFeatureInstancePair, number[]>,
  key: CombinableFeatureInstancePair,
): number[] | null {
  for (const [k, v] of map) {
    if (k.equals(key)) return v;
  }
  return null;
}

function mapPutIfAbsent(
  map: Map<CombinableFeatureInstancePair, number[]>,
  key: CombinableFeatureInstancePair,
  val: number[],
): void {
  for (const [k] of map) {
    if (k.equals(key)) return;
  }
  map.set(key, val);
}

function mapGetRequired(
  map: Map<CombinableFeatureInstancePair, number[]>,
  key: CombinableFeatureInstancePair,
): number[] {
  const v = mapGetOrNull(map, key);
  if (v === null) return [];
  return v;
}

//-------------------------------------------------------------------------

/**
 * KolmogorovSmirnovExpander: Expands feature sets based on KS statistics
 * between distributions of errors.
 *
 * @java training.feature_discovery.KolmogorovSmirnovExpander
 */
export class KolmogorovSmirnovExpander {

  //-------------------------------------------------------------------------

  /**
   * @java KolmogorovSmirnovExpander.expandFeatureSet(...)
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

      // Want to start looking at winning moves
      const winningMoves = sample.winningMoves();
      for (let i = winningMoves.nextSetBit(0); i >= 0; i = winningMoves.nextSetBit(i + 1)) {
        sortedActionIndices.push(i);
      }

      // Look at losing moves next
      const losingMoves = sample.losingMoves();
      for (let i = losingMoves.nextSetBit(0); i >= 0; i = losingMoves.nextSetBit(i + 1)) {
        sortedActionIndices.push(i);
      }

      // And finally anti-defeating moves
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

      // Randomly fill up with the remaining actions
      while (unsortedActionIndices.length > 0) {
        const r = Math.floor(Math.random() * unsortedActionIndices.length);
        const a = unsortedActionIndices[r]!;
        removeSwap(unsortedActionIndices, r);
        sortedActionIndices.push(a);
      }

      // Every action in the sample is a new "case" (state-action pair)
      for (let aIdx = 0; aIdx < sortedActionIndices.length; ++aIdx) {
        const a = sortedActionIndices[aIdx]!;

        // keep track of pairs we've already seen in this "case"
        const observedCasePairs = new Set<CombinableFeatureInstancePair>();

        // list --> set --> list to get rid of duplicates
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

        // Save a copy of the above list, which we leave unmodified
        const origActiveInstances: FeatureInstance[] = [...activeInstances];

        // Start out by keeping all feature instances that have already been marked as having to be
        // preserved, and discarding those that have already been discarded before
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
          } else if (featureActiveRatios.getQuick(instance.feature().spatialFeatureSetIndex()) === 1.0) {
            activeInstances.splice(i, 1);
          } else {
            activeInstancesCombinedSelfs.push(combinedSelf);
            ++i;
          }
        }

        // This action is allowed to pick at most this many extra instances
        let numInstancesAllowedThisAction = Math.min(
          Math.min(50, featureDiscoveryMaxNumFeatureInstances - preservedInstances.size),
          activeInstances.length,
        );

        if (numInstancesAllowedThisAction > 0) {
          const distr = fvectorFromSize(activeInstances.length);
          for (let i = 0; i < activeInstances.length; ++i) {
            const fIdx = activeInstances[i]!.feature().spatialFeatureSetIndex();
            distr.set(
              i,
              featureErrorCorrelations[fIdx]! +
                expectedAbsErrorGivenFeature[fIdx]! +
                expectedFeatureTimesAbsError[fIdx]! +
                Math.abs(
                  (policy as unknown as {
                    linearFunction(mover: number): {
                      effectiveParams(): { allWeights(): FVector };
                    };
                  }).linearFunction(
                    sample.gameState().mover(),
                  ).effectiveParams().allWeights().get(fIdx + featureSet.getNumAspatialFeatures()),
                ),
            );
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
          error = minError; // Reward correlation with winning moves
        } else if (losingMoves.get(a)) {
          error = maxError; // Reward correlation with losing moves
        } else if (antiDefeatingMoves.get(a)) {
          error = Math.min(error, minError + 0.1); // Reward correlation with anti-defeating moves
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
              if (!containsPair(observedCasePairs, combined)) {
                addPair(observedCasePairs, combined);
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
    }

    // Construct all possible pairs and scores using priority queues
    // In priority queues, we want highest scores at the head (reversed comparator)
    const proactivePairs: ScoredFeatureInstancePair[] = [];
    const reactivePairs: ScoredFeatureInstancePair[] = [];

    for (const [pair] of errorLists) {
      if (!pair.a.equals(pair.b)) { // Only interested in combinations of different instances
        const pairErrors = mapGetRequired(errorLists, pair);
        const errorsA = mapGetRequired(errorLists, new CombinableFeatureInstancePair(game, pair.a, pair.a));
        const errorsB = mapGetRequired(errorLists, new CombinableFeatureInstancePair(game, pair.b, pair.b));

        if (errorsA.length === 0 || errorsB.length === 0) continue;

        const pairErrorsSorted = [...pairErrors].sort((a, b) => a - b);
        const errorsASorted = [...errorsA].sort((a, b) => a - b);
        const errorsBSorted = [...errorsB].sort((a, b) => a - b);

        // Check if pair errors equal constituent errors (skip if so)
        if (arraysEqual(pairErrorsSorted, errorsASorted) || arraysEqual(pairErrorsSorted, errorsBSorted)) continue;

        const minSampleSize = 50;

        const pairErrorsAug = [...pairErrors];
        const numRealPairSamples = pairErrorsAug.length;
        while (pairErrorsAug.length < minSampleSize) {
          const realSample = pairErrorsAug[Math.floor(Math.random() * numRealPairSamples)]!;
          const syntheticSample = MathRoutines.clip(gaussianRandom() * 0.1 + realSample, -1.0, 1.0);
          pairErrorsAug.push(syntheticSample);
        }

        const errorsAAug = [...errorsA];
        const numRealSamplesA = errorsAAug.length;
        while (errorsAAug.length < minSampleSize) {
          const realSample = errorsAAug[Math.floor(Math.random() * numRealSamplesA)]!;
          const syntheticSample = MathRoutines.clip(gaussianRandom() * 0.1 + realSample, -1.0, 1.0);
          errorsAAug.push(syntheticSample);
        }

        const errorsBAug = [...errorsB];
        const numRealSamplesB = errorsBAug.length;
        while (errorsBAug.length < minSampleSize) {
          const realSample = errorsBAug[Math.floor(Math.random() * numRealSamplesB)]!;
          const syntheticSample = MathRoutines.clip(gaussianRandom() * 0.1 + realSample, -1.0, 1.0);
          errorsBAug.push(syntheticSample);
        }

        const numBootstrapsPerConstituent = 10;
        let minKolmogorovSmirnovDistance = 0.0;

        for (let i = 0; i < numBootstrapsPerConstituent; ++i) {
          const bootstrapA = Sampling.sampleWithReplacement(Math.min(150, pairErrorsAug.length), errorsAAug);
          const bootstrapB = Sampling.sampleWithReplacement(Math.min(150, pairErrorsAug.length), errorsBAug);
          const bootstrapPair = Sampling.sampleWithReplacement(Math.min(150, pairErrorsAug.length), pairErrorsAug);

          const ksA = KolmogorovSmirnov.kolmogorovSmirnovStatistic(bootstrapPair, bootstrapA);
          const ksB = KolmogorovSmirnov.kolmogorovSmirnovStatistic(bootstrapPair, bootstrapB);

          if (ksA < minKolmogorovSmirnovDistance) minKolmogorovSmirnovDistance = ksA;
          if (ksB < minKolmogorovSmirnovDistance) minKolmogorovSmirnovDistance = ksB;
        }

        const score = minKolmogorovSmirnovDistance;

        if (pair.combinedFeature.isReactive()) {
          reactivePairs.push(new ScoredFeatureInstancePair(pair, score));
        } else {
          proactivePairs.push(new ScoredFeatureInstancePair(pair, score));
        }
      }
    }

    // Sort descending by score (highest score = best)
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

}

//-------------------------------------------------------------------------

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Box-Muller transform for standard normal random variable.
 * @java ThreadLocalRandom.current().nextGaussian()
 */
function gaussianRandom(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}
