// @java AI/src/training/feature_discovery/VarianceReductionExpander.java

/**
 * Expands feature sets by adding features that maximally reduce variance in
 * at least one of the "splits", based on the upper bound of a confidence interval
 * on the split's variance.
 *
 * @java training.feature_discovery.VarianceReductionExpander
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

/**
 * VarianceReductionExpander: Expands feature sets by adding features that
 * maximally reduce variance in error splits.
 *
 * @java training.feature_discovery.VarianceReductionExpander
 */
export class VarianceReductionExpander {

  //-------------------------------------------------------------------------

  /**
   * @java VarianceReductionExpander.expandFeatureSet(...)
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
    // This is our n(i, j) matrix
    const featurePairActivations = new Map<CombinableFeatureInstancePair, number>();

    // This is our S(i, j) matrix
    const errorSums = new Map<CombinableFeatureInstancePair, number>();

    // This is our SS(i, j) matrix
    const squaredErrorSums = new Map<CombinableFeatureInstancePair, number>();

    // This is our M(i, j) matrix
    const meanErrors = new Map<CombinableFeatureInstancePair, number>();

    // These are our n, S, SS, and M scalars for the complete dataset
    let numCases = 0;
    let sumErrors = 0.0;
    let sumSquaredErrors = 0.0;
    let meanError = 0.0;

    // Create a Hash Set of features already in Feature Set; we won't
    // have to consider combinations that are already in
    const existingFeatures = new Set<SpatialFeature>();
    for (const feature of featureSet.spatialFeatures()) {
      existingFeatures.add(feature);
    }

    // Set of feature instances that we have already preserved
    const preservedInstances = new Set<CombinableFeatureInstancePair>();

    // Set of feature instances that we have already chosen to discard once
    const discardedInstances = new Set<CombinableFeatureInstancePair>();

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
    let totalNumActions = 0;

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

        avgActionError += (actionError - avgActionError) / (totalNumActions + 1);
        ++totalNumActions;
      }

      const absErrors = errors.copy();
      absErrors.abs();
      apprenticePolicies[i] = apprenticePolicy;
      errorVectors[i] = errors;
      absErrorSums[i] = absErrors.sum();
    }

    // For every feature, compute sample correlation coefficient between its activity level (0 or 1) and errors
    const featureErrorCorrelations = new Float64Array(featureSet.getNumSpatialFeatures());
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
        expectedFeatureTimesAbsError[fIdx]! += (Math.abs(error) - expectedFeatureTimesAbsError[fIdx]!) / (i + 1);
      }

      for (let i = 0; i < errorsWhenInactive.length; ++i) {
        const error = errorsWhenInactive[i]!;
        const dError = error - avgActionError;
        numerator += (0.0 - avgFeatureVal) * dError;
        dErrorSquaresSum += dError * dError;
      }

      const dFeatureSquaresSum =
        errorsWhenActive.length * ((1.0 - avgFeatureVal) * (1.0 - avgFeatureVal)) +
        errorsWhenInactive.length * ((0.0 - avgFeatureVal) * (0.0 - avgFeatureVal));

      const denominator = Math.sqrt(dFeatureSquaresSum * dErrorSquaresSum);
      featureErrorCorrelations[fIdx] = numerator / denominator;
    }

    // Create list of indices that we can use to index into batch, sorted in descending order
    // of sums of absolute errors.
    const batchIndices: number[] = Array.from({ length: batch.length }, (_, i) => i);
    batchIndices.sort((o1, o2) => {
      const delta = absErrorSums[o1]! - absErrorSums[o2]!;
      if (delta > 0) return -1;
      else if (delta < 0) return 1;
      else return 0;
    });

    // Loop through all samples in batch
    for (let bi = 0; bi < batchIndices.length; ++bi) {
      const batchIndex = batchIndices[bi]!;
      const sample = batch[batchIndex]!;
      const errors = errorVectors[batchIndex]!;
      const moves = sample.moves();

      // Every action in the sample is a new "case" (state-action pair)
      for (let a = 0; a < moves.size(); ++a) {
        ++numCases;

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

        // Start out by keeping all feature instances that have already been marked as having to be
        // preserved, and discarding those that have already been discarded before
        const instancesToKeep: FeatureInstance[] = [];

        for (let i = 0; i < activeInstances.length; /**/) {
          const instance = activeInstances[i]!;
          const combinedSelf = new CombinableFeatureInstancePair(game, instance, instance);
          if (containsPair(preservedInstances, combinedSelf)) {
            instancesToKeep.push(instance);
            activeInstances.splice(i, 1);
          } else if (containsPair(discardedInstances, combinedSelf)) {
            activeInstances.splice(i, 1);
          } else {
            ++i;
          }
        }

        // This action is allowed to pick at most this many extra instances
        let numInstancesAllowedThisAction = Math.min(
          Math.min(
            Math.max(5, featureDiscoveryMaxNumFeatureInstances - preservedInstances.size / (moves.size() - a)),
            featureDiscoveryMaxNumFeatureInstances - preservedInstances.size,
          ),
          activeInstances.length,
        );

        // Create distribution over active instances
        const distr = fvectorFromSize(activeInstances.length);
        for (let i = 0; i < activeInstances.length; ++i) {
          const fIdx = activeInstances[i]!.feature().spatialFeatureSetIndex();
          distr.set(i, featureErrorCorrelations[fIdx]! + expectedFeatureTimesAbsError[fIdx]!);
        }
        distr.softmax(2.0);

        while (numInstancesAllowedThisAction > 0) {
          const sampledIdx = distr.sampleFromDistribution();
          const keepInstance = activeInstances[sampledIdx]!;
          instancesToKeep.push(keepInstance);
          const combinedSelf = new CombinableFeatureInstancePair(game, keepInstance, keepInstance);
          addPair(preservedInstances, combinedSelf);
          distr.updateSoftmaxInvalidate(sampledIdx);
          --numInstancesAllowedThisAction;
        }

        // Mark all instances that haven't been marked as preserved yet as discarded
        for (const instance of activeInstances) {
          const combinedSelf = new CombinableFeatureInstancePair(game, instance, instance);
          if (!containsPair(preservedInstances, combinedSelf)) {
            addPair(discardedInstances, combinedSelf);
          }
        }

        const numActiveInstances = instancesToKeep.length;
        const error = errors.get(a);

        sumErrors += error;
        sumSquaredErrors += error * error;
        meanError += (error - meanError) / numCases;

        for (let i = 0; i < numActiveInstances; ++i) {
          const instanceI = instancesToKeep[i]!;

          // increment entries on main diagonals
          const combinedSelf = new CombinableFeatureInstancePair(game, instanceI, instanceI);

          if (!containsPair(observedCasePairs, combinedSelf)) {
            addPair(observedCasePairs, combinedSelf);
            mapAdjustOrPut(featurePairActivations, combinedSelf, 1);
            mapAdjustOrPut(errorSums, combinedSelf, error);
            mapAdjustOrPut(squaredErrorSums, combinedSelf, error * error);
            const curN = mapGetOrZero(featurePairActivations, combinedSelf);
            const deltaMean = (error - mapGetOrZero(meanErrors, combinedSelf)) / curN;
            mapAdjustOrPut(meanErrors, combinedSelf, deltaMean);
          }

          for (let j = i + 1; j < numActiveInstances; ++j) {
            const instanceJ = instancesToKeep[j]!;

            // increment off-diagonal entries
            const combined = new CombinableFeatureInstancePair(game, instanceI, instanceJ);

            if (!existingFeatures.has(combined.combinedFeature)) {
              if (!containsPair(observedCasePairs, combined)) {
                addPair(observedCasePairs, combined);
                mapAdjustOrPut(featurePairActivations, combined, 1);
                mapAdjustOrPut(errorSums, combined, error);
                mapAdjustOrPut(squaredErrorSums, combined, error * error);
                const curN = mapGetOrZero(featurePairActivations, combined);
                const deltaMean = (error - mapGetOrZero(meanErrors, combined)) / curN;
                mapAdjustOrPut(meanErrors, combined, deltaMean);
              }
            }
          }
        }
      }
    }

    if (sumErrors === 0.0 || sumSquaredErrors === 0.0) {
      // incredibly rare case: we have nothing to guide our feature growing
      return null;
    }

    // Construct all possible pairs and scores
    const scoredPairs: ScoredFeatureInstancePair[] = [];
    let bestScore = Number.NEGATIVE_INFINITY;
    let bestPairIdx = -1;

    for (const [pair, nij] of featurePairActivations) {
      if (!pair.a.equals(pair.b)) { // Only interested in combinations of different instances
        if (nij === numCases) continue; // No variance reduction
        if (nij < 2) continue; // Not enough cases

        const ni = mapGetOrZero(featurePairActivations, new CombinableFeatureInstancePair(game, pair.a, pair.a));
        const nj = mapGetOrZero(featurePairActivations, new CombinableFeatureInstancePair(game, pair.b, pair.b));

        if (ni === numCases || nj === numCases) continue; // Perfect correlation

        // Compute sample variance for all cases
        const varComplete = (sumSquaredErrors - 2 * meanError * sumErrors + numCases * meanError * meanError) / (numCases - 1);

        // Compute sample variance for the "split" that includes the feature pair
        const Sij = mapGetOrZero(errorSums, pair);
        const SSij = mapGetOrZero(squaredErrorSums, pair);
        const Mij = mapGetOrZero(meanErrors, pair);
        const varWithPair = (SSij - 2 * Mij * Sij + nij * Mij * Mij) / (nij - 1);

        // Compute sample variance for the "split" that excludes the feature pair
        const invNij = numCases - nij;
        const invSij = sumErrors - Sij;
        const invSSij = sumSquaredErrors - SSij;
        const invMij = (meanError * numCases - Mij * nij) / invNij;
        const varWithoutPair = (invSSij - 2 * invMij * invSij + invNij * invMij * invMij) / (nij - 1);

        const varReduction = varComplete - (varWithPair + varWithoutPair);

        const featureCorrI =
          (nij * (numCases - ni)) /
          (Math.sqrt(nij * (numCases - nij)) * Math.sqrt(ni * (numCases - ni)));

        const featureCorrJ =
          (nij * (numCases - nj)) /
          (Math.sqrt(nij * (numCases - nij)) * Math.sqrt(nj * (numCases - nj)));

        const worstFeatureCorr = Math.max(Math.abs(featureCorrI), Math.abs(featureCorrJ));

        if (worstFeatureCorr === 1.0) continue;
        if (isNaN(varReduction)) continue;

        const score = varReduction;

        scoredPairs.push(new ScoredFeatureInstancePair(pair, score));
        if (varReduction > bestScore) {
          bestScore = varReduction;
          bestPairIdx = scoredPairs.length - 1;
        }
      }
    }

    // keep trying to generate an expanded (by one) feature set
    while (scoredPairs.length > 0) {
      const bestPair = scoredPairs.splice(bestPairIdx, 1)[0]!;

      const newFeatureSet = featureSet.createExpandedFeatureSet(game, bestPair.pair.combinedFeature);

      if (newFeatureSet !== null) {
        const actsI = mapGetOrZero(
          featurePairActivations,
          new CombinableFeatureInstancePair(game, bestPair.pair.a, bestPair.pair.a),
        );
        const actsJ = mapGetOrZero(
          featurePairActivations,
          new CombinableFeatureInstancePair(game, bestPair.pair.b, bestPair.pair.b),
        );
        const pairActs = mapGetOrZero(
          featurePairActivations,
          new CombinableFeatureInstancePair(game, bestPair.pair.a, bestPair.pair.b),
        );
        const pairErrorSum = mapGetOrZero(
          errorSums,
          new CombinableFeatureInstancePair(game, bestPair.pair.a, bestPair.pair.b),
        );

        const errorCorr =
          (numCases * pairErrorSum - pairActs * sumErrors) /
          (
            Math.sqrt(numCases * pairActs - pairActs * pairActs) *
            Math.sqrt(numCases * sumSquaredErrors - sumErrors * sumErrors)
          );

        const featureCorrI =
          (numCases * pairActs - pairActs * actsI) /
          (
            Math.sqrt(numCases * pairActs - pairActs * pairActs) *
            Math.sqrt(numCases * actsI - actsI * actsI)
          );

        const featureCorrJ =
          (numCases * pairActs - pairActs * actsJ) /
          (
            Math.sqrt(numCases * pairActs - pairActs * pairActs) *
            Math.sqrt(numCases * actsJ - actsJ * actsJ)
          );

        // Compute sample variance for all cases
        const varComplete = (sumSquaredErrors - 2 * meanError * sumErrors + numCases * meanError * meanError) / (numCases - 1);
        const Sij = mapGetOrZero(errorSums, bestPair.pair);
        const SSij = mapGetOrZero(squaredErrorSums, bestPair.pair);
        const Mij = mapGetOrZero(meanErrors, bestPair.pair);
        const varWithPair = (SSij - 2 * Mij * Sij + pairActs * Mij * Mij) / (pairActs - 1);
        const invNij = numCases - pairActs;
        const invSij = sumErrors - Sij;
        const invSSij = sumSquaredErrors - SSij;
        const invMij = (meanError * numCases - Mij * pairActs) / invNij;
        const varWithoutPair = (invSSij - 2 * invMij * invSij + invNij * invMij * invMij) / (pairActs - 1);
        const varReduction = varComplete - (varWithPair + varWithoutPair);

        experiment.logLine(logWriter, "New feature added!");
        experiment.logLine(logWriter, "new feature = " + String(newFeatureSet.spatialFeatures()[newFeatureSet.getNumSpatialFeatures() - 1]));
        experiment.logLine(logWriter, "active feature A = " + String(bestPair.pair.a.feature()));
        experiment.logLine(logWriter, "rot A = " + String(bestPair.pair.a.rotation()));
        experiment.logLine(logWriter, "ref A = " + String(bestPair.pair.a.reflection()));
        experiment.logLine(logWriter, "anchor A = " + String(bestPair.pair.a.anchorSite()));
        experiment.logLine(logWriter, "active feature B = " + String(bestPair.pair.b.feature()));
        experiment.logLine(logWriter, "rot B = " + String(bestPair.pair.b.rotation()));
        experiment.logLine(logWriter, "ref B = " + String(bestPair.pair.b.reflection()));
        experiment.logLine(logWriter, "anchor B = " + String(bestPair.pair.b.anchorSite()));
        experiment.logLine(logWriter, "score = " + String(bestPair.score));
        experiment.logLine(logWriter, "correlation with errors = " + String(errorCorr));
        experiment.logLine(logWriter, "correlation with first constituent = " + String(featureCorrI));
        experiment.logLine(logWriter, "correlation with second constituent = " + String(featureCorrJ));
        experiment.logLine(logWriter, "varComplete = " + String(varComplete));
        experiment.logLine(logWriter, "varWithPair = " + String(varWithPair));
        experiment.logLine(logWriter, "varWithoutPair = " + String(varWithoutPair));
        experiment.logLine(logWriter, "varReduction = " + String(varReduction));

        return newFeatureSet;
      }

      // Search again for the next best pair
      bestScore = Number.NEGATIVE_INFINITY;
      bestPairIdx = -1;
      for (let i = 0; i < scoredPairs.length; ++i) {
        if (scoredPairs[i]!.score > bestScore) {
          bestScore = scoredPairs[i]!.score;
          bestPairIdx = i;
        }
      }
    }

    return null;
  }

  //-------------------------------------------------------------------------

}

//-------------------------------------------------------------------------

// Helpers for Map operations that mirror TObjectIntHashMap / TObjectDoubleHashMap behaviour.
// Java Trove maps use reference equality by default for objects; our TS uses hashCode-based
// CombinableFeatureInstancePair as key, but JavaScript Map uses reference equality.
// We implement a simple hash-map wrapper using hashCode() for lookup.

function mapGetOrZero(map: Map<CombinableFeatureInstancePair, number>, key: CombinableFeatureInstancePair): number {
  for (const [k, v] of map) {
    if (k.equals(key)) return v;
  }
  return 0;
}

function mapAdjustOrPut(map: Map<CombinableFeatureInstancePair, number>, key: CombinableFeatureInstancePair, delta: number): void {
  for (const [k] of map) {
    if (k.equals(key)) {
      map.set(k, map.get(k)! + delta);
      return;
    }
  }
  map.set(key, delta);
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

/** @java new FVector(int) — escape hatch */
const fvectorFromSize = null as unknown as (dim: number) => FVector;
