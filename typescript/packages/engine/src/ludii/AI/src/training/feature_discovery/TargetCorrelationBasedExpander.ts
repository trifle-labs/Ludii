// @java AI/src/training/feature_discovery/TargetCorrelationBasedExpander.java

/**
 * Feature Set Expander based on correlation with targets (i.e., expert policies),
 * irrespective of our current predictions / errors.
 *
 * @java training.feature_discovery.TargetCorrelationBasedExpander
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

/** @java new FVector(int) — escape hatch */
const fvectorFromSize = null as unknown as (dim: number) => FVector;

//-------------------------------------------------------------------------

function mapGetOrZero(
  map: Map<CombinableFeatureInstancePair, number>,
  key: CombinableFeatureInstancePair,
): number {
  for (const [k, v] of map) {
    if (k.equals(key)) return v;
  }
  return 0;
}

function mapAdjustOrPut(
  map: Map<CombinableFeatureInstancePair, number>,
  key: CombinableFeatureInstancePair,
  delta: number,
): void {
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

function removeSwapList<T>(list: T[], idx: number): void {
  list[idx] = list[list.length - 1]!;
  list.pop();
}

function removeSwapNum(list: number[], idx: number): void {
  list[idx] = list[list.length - 1]!;
  list.pop();
}

//-------------------------------------------------------------------------

/**
 * TargetCorrelationBasedExpander: Expands feature sets based on correlation
 * with targets (expert policies).
 *
 * @java training.feature_discovery.TargetCorrelationBasedExpander
 */
export class TargetCorrelationBasedExpander {

  //-------------------------------------------------------------------------

  /**
   * @java TargetCorrelationBasedExpander.expandFeatureSet(...)
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

    // this is our C_f matrix
    const featurePairActivations = new Map<CombinableFeatureInstancePair, number>();

    // this is our C_e matrix
    const errorSums = new Map<CombinableFeatureInstancePair, number>();

    // these are our S and SS scalars
    let sumErrors = 0.0;
    let sumSquaredErrors = 0.0;

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
      // NOTE: In the Java source for TargetCorrelationBasedExpander, errors is set to apprenticePolicy.copy()
      // (the target is the expert policy, not the error vs. it)
      const errors = apprenticePolicy.copy();

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
        removeSwapNum(unsortedActionIndices, r);
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

        const instancesToKeep: FeatureInstance[] = [];
        const activeInstancesCombinedSelfs: CombinableFeatureInstancePair[] = [];
        const instancesToKeepCombinedSelfs: CombinableFeatureInstancePair[] = [];

        for (let i = 0; i < activeInstances.length; /**/) {
          const instance = activeInstances[i]!;
          const combinedSelf = new CombinableFeatureInstancePair(game, instance, instance);

          if (containsPair(preservedInstances, combinedSelf)) {
            instancesToKeepCombinedSelfs.push(combinedSelf);
            instancesToKeep.push(instance);
            removeSwapList(activeInstances, i);
          } else if (containsPair(discardedInstances, combinedSelf)) {
            removeSwapList(activeInstances, i);
          } else if (featureActiveRatios.getQuick(instance.feature().spatialFeatureSetIndex()) === 1.0) {
            removeSwapList(activeInstances, i);
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
          // Create distribution over active instances proportional to expectedAbsErrorGivenFeature
          const distr = fvectorFromSize(activeInstances.length);
          for (let i = 0; i < activeInstances.length; ++i) {
            const fIdx = activeInstances[i]!.feature().spatialFeatureSetIndex();
            distr.set(i, expectedAbsErrorGivenFeature[fIdx]!);
          }
          distr.softmax(2.0);

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

            // Maybe now have to auto-pick several other instances if they lead to equal combinedSelf
            for (let i = 0; i < distr.dim(); ++i) {
              if (distr.get(0) !== 0) {
                if (combinedSelf.equals(activeInstancesCombinedSelfs[i]!)) {
                  instancesToKeep.push(activeInstances[i]!);
                  instancesToKeepCombinedSelfs.push(activeInstancesCombinedSelfs[i]!);
                  distr.updateSoftmaxInvalidate(i);
                  --numInstancesAllowedThisAction;
                }
              }
            }
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

        sumErrors += error;
        sumSquaredErrors += error * error;

        for (let i = 0; i < numActiveInstances; ++i) {
          const instanceI = instancesToKeep[i]!;

          // increment entries on main diagonals
          const combinedSelf = instancesToKeepCombinedSelfs[i]!;

          if (!containsPair(observedCasePairs, combinedSelf)) {
            addPair(observedCasePairs, combinedSelf);
            mapAdjustOrPut(featurePairActivations, combinedSelf, 1);
            mapAdjustOrPut(errorSums, combinedSelf, error);
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
              }
            }
          }
        }
      }
    }

    if (sumErrors === 0.0 || sumSquaredErrors === 0.0) {
      return null;
    }

    // Construct all possible pairs and scores; one priority queue for proactive features,
    // and one for reactive features
    const proactivePairs: ScoredFeatureInstancePair[] = [];
    const reactivePairs: ScoredFeatureInstancePair[] = [];

    // Randomly pick a minimum required sample size in [3, 5]
    const requiredSampleSize = 3 + Math.floor(Math.random() * 3);

    for (const [pair] of featurePairActivations) {
      if (!pair.a.equals(pair.b)) { // Only interested in combinations of different instances
        const pairActs = mapGetOrZero(featurePairActivations, pair);
        if (pairActs === numCases || numCases < 4) continue; // Perfect correlation
        if (pairActs < requiredSampleSize) continue; // Need bigger sample size

        const actsI = mapGetOrZero(featurePairActivations, new CombinableFeatureInstancePair(game, pair.a, pair.a));
        const actsJ = mapGetOrZero(featurePairActivations, new CombinableFeatureInstancePair(game, pair.b, pair.b));

        if (actsI === numCases || actsJ === numCases || pairActs === actsI || pairActs === actsJ) continue;

        const pairErrorSum = mapGetOrZero(errorSums, pair);

        const errorCorr =
          (numCases * pairErrorSum - pairActs * sumErrors) /
          (
            Math.sqrt(pairActs * (numCases - pairActs)) *
            Math.sqrt(numCases * sumSquaredErrors - sumErrors * sumErrors)
          );

        // Fisher's r-to-z transformation
        const errorCorrZ = 0.5 * Math.log((1.0 + errorCorr) / (1.0 - errorCorr));
        // Standard deviation of the z
        const stdErrorCorrZ = Math.sqrt(1.0 / (numCases - 3));
        // Lower bound of confidence interval on z
        const lbErrorCorrZ = errorCorrZ - featureDiscoveryParams.criticalValueCorrConf * stdErrorCorrZ;
        // Transform lower bound on z back to r
        const lbErrorCorr = (Math.exp(2.0 * lbErrorCorrZ) - 1.0) / (Math.exp(2.0 * lbErrorCorrZ) + 1.0);
        // Upper bound of confidence interval on z
        const ubErrorCorrZ = errorCorrZ + featureDiscoveryParams.criticalValueCorrConf * stdErrorCorrZ;
        // Transform upper bound on z back to r
        const ubErrorCorr = (Math.exp(2.0 * ubErrorCorrZ) - 1.0) / (Math.exp(2.0 * ubErrorCorrZ) + 1.0);

        const featureCorrI =
          (pairActs * (numCases - actsI)) /
          (
            Math.sqrt(pairActs * (numCases - pairActs)) *
            Math.sqrt(actsI * (numCases - actsI))
          );

        const featureCorrJ =
          (pairActs * (numCases - actsJ)) /
          (
            Math.sqrt(pairActs * (numCases - pairActs)) *
            Math.sqrt(actsJ * (numCases - actsJ))
          );

        const worstFeatureCorr = Math.max(Math.abs(featureCorrI), Math.abs(featureCorrJ));

        let score: number;
        if (errorCorr >= 0.0) {
          score = Math.max(0.0, lbErrorCorr) * (1.0 - worstFeatureCorr * worstFeatureCorr);
        } else {
          score = -Math.min(0.0, ubErrorCorr) * (1.0 - worstFeatureCorr * worstFeatureCorr);
        }

        if (isNaN(score)) continue;

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
        const actsI = mapGetOrZero(featurePairActivations, new CombinableFeatureInstancePair(game, bestPair.pair.a, bestPair.pair.a));
        const actsJ = mapGetOrZero(featurePairActivations, new CombinableFeatureInstancePair(game, bestPair.pair.b, bestPair.pair.b));
        const pair = new CombinableFeatureInstancePair(game, bestPair.pair.a, bestPair.pair.b);
        const pairActs = mapGetOrZero(featurePairActivations, pair);
        const pairErrorSum = mapGetOrZero(errorSums, pair);

        const errorCorr =
          (numCases * pairErrorSum - pairActs * sumErrors) /
          (Math.sqrt(numCases * pairActs - pairActs * pairActs) * Math.sqrt(numCases * sumSquaredErrors - sumErrors * sumErrors));

        const errorCorrZ = 0.5 * Math.log((1.0 + errorCorr) / (1.0 - errorCorr));
        const stdErrorCorrZ = Math.sqrt(1.0 / (numCases - 3));
        const lbErrorCorrZ = errorCorrZ - 1.64 * stdErrorCorrZ;
        const lbErrorCorr = (Math.exp(2.0 * lbErrorCorrZ) - 1.0) / (Math.exp(2.0 * lbErrorCorrZ) + 1.0);
        const ubErrorCorrZ = errorCorrZ + 1.64 * stdErrorCorrZ;
        const ubErrorCorr = (Math.exp(2.0 * ubErrorCorrZ) - 1.0) / (Math.exp(2.0 * ubErrorCorrZ) + 1.0);

        const featureCorrI =
          (numCases * pairActs - pairActs * actsI) /
          (Math.sqrt(numCases * pairActs - pairActs * pairActs) * Math.sqrt(numCases * actsI - actsI * actsI));
        const featureCorrJ =
          (numCases * pairActs - pairActs * actsJ) /
          (Math.sqrt(numCases * pairActs - pairActs * pairActs) * Math.sqrt(numCases * actsJ - actsJ * actsJ));

        experiment.logLine(logWriter, "New proactive feature added!");
        experiment.logLine(logWriter, "new feature = " + String(newFeatureSet.spatialFeatures()[newFeatureSet.getNumSpatialFeatures() - 1]));
        experiment.logLine(logWriter, "active feature A = " + String(bestPair.pair.a.feature()));
        experiment.logLine(logWriter, "rot A = " + String(bestPair.pair.a.rotation()));
        experiment.logLine(logWriter, "ref A = " + String(bestPair.pair.a.reflection()));
        experiment.logLine(logWriter, "anchor A = " + String(bestPair.pair.a.anchorSite()));
        experiment.logLine(logWriter, "active feature B = " + String(bestPair.pair.b.feature()));
        experiment.logLine(logWriter, "rot B = " + String(bestPair.pair.b.rotation()));
        experiment.logLine(logWriter, "ref B = " + String(bestPair.pair.b.reflection()));
        experiment.logLine(logWriter, "anchor B = " + String(bestPair.pair.b.anchorSite()));
        experiment.logLine(logWriter, "avg error = " + String(sumErrors / numCases));
        experiment.logLine(logWriter, "avg error for pair = " + String(pairErrorSum / pairActs));
        experiment.logLine(logWriter, "score = " + String(bestPair.score));
        experiment.logLine(logWriter, "correlation with errors = " + String(errorCorr));
        experiment.logLine(logWriter, "lower bound correlation with errors = " + String(lbErrorCorr));
        experiment.logLine(logWriter, "upper bound correlation with errors = " + String(ubErrorCorr));
        experiment.logLine(logWriter, "correlation with first constituent = " + String(featureCorrI));
        experiment.logLine(logWriter, "correlation with second constituent = " + String(featureCorrJ));
        experiment.logLine(logWriter, "observed pair of instances " + String(pairActs) + " times");
        experiment.logLine(logWriter, "observed first constituent " + String(actsI) + " times");
        experiment.logLine(logWriter, "observed second constituent " + String(actsJ) + " times");

        currFeatureSet = newFeatureSet;
        break;
      }
    }

    // Keep trying to add a reactive feature
    while (reactivePairs.length > 0) {
      const bestPair = reactivePairs.shift()!;
      const newFeatureSet = currFeatureSet.createExpandedFeatureSet(game, bestPair.pair.combinedFeature);
      if (newFeatureSet !== null) {
        const actsI = mapGetOrZero(featurePairActivations, new CombinableFeatureInstancePair(game, bestPair.pair.a, bestPair.pair.a));
        const actsJ = mapGetOrZero(featurePairActivations, new CombinableFeatureInstancePair(game, bestPair.pair.b, bestPair.pair.b));
        const pair = new CombinableFeatureInstancePair(game, bestPair.pair.a, bestPair.pair.b);
        const pairActs = mapGetOrZero(featurePairActivations, pair);
        const pairErrorSum = mapGetOrZero(errorSums, pair);

        const errorCorr =
          (numCases * pairErrorSum - pairActs * sumErrors) /
          (Math.sqrt(numCases * pairActs - pairActs * pairActs) * Math.sqrt(numCases * sumSquaredErrors - sumErrors * sumErrors));

        const errorCorrZ = 0.5 * Math.log((1.0 + errorCorr) / (1.0 - errorCorr));
        const stdErrorCorrZ = Math.sqrt(1.0 / (numCases - 3));
        const lbErrorCorrZ = errorCorrZ - 1.64 * stdErrorCorrZ;
        const lbErrorCorr = (Math.exp(2.0 * lbErrorCorrZ) - 1.0) / (Math.exp(2.0 * lbErrorCorrZ) + 1.0);
        const ubErrorCorrZ = errorCorrZ + 1.64 * stdErrorCorrZ;
        const ubErrorCorr = (Math.exp(2.0 * ubErrorCorrZ) - 1.0) / (Math.exp(2.0 * ubErrorCorrZ) + 1.0);

        const featureCorrI =
          (numCases * pairActs - pairActs * actsI) /
          (Math.sqrt(numCases * pairActs - pairActs * pairActs) * Math.sqrt(numCases * actsI - actsI * actsI));
        const featureCorrJ =
          (numCases * pairActs - pairActs * actsJ) /
          (Math.sqrt(numCases * pairActs - pairActs * pairActs) * Math.sqrt(numCases * actsJ - actsJ * actsJ));

        experiment.logLine(logWriter, "New reactive feature added!");
        experiment.logLine(logWriter, "new feature = " + String(newFeatureSet.spatialFeatures()[newFeatureSet.getNumSpatialFeatures() - 1]));
        experiment.logLine(logWriter, "active feature A = " + String(bestPair.pair.a.feature()));
        experiment.logLine(logWriter, "rot A = " + String(bestPair.pair.a.rotation()));
        experiment.logLine(logWriter, "ref A = " + String(bestPair.pair.a.reflection()));
        experiment.logLine(logWriter, "anchor A = " + String(bestPair.pair.a.anchorSite()));
        experiment.logLine(logWriter, "active feature B = " + String(bestPair.pair.b.feature()));
        experiment.logLine(logWriter, "rot B = " + String(bestPair.pair.b.rotation()));
        experiment.logLine(logWriter, "ref B = " + String(bestPair.pair.b.reflection()));
        experiment.logLine(logWriter, "anchor B = " + String(bestPair.pair.b.anchorSite()));
        experiment.logLine(logWriter, "avg error = " + String(sumErrors / numCases));
        experiment.logLine(logWriter, "avg error for pair = " + String(pairErrorSum / pairActs));
        experiment.logLine(logWriter, "score = " + String(bestPair.score));
        experiment.logLine(logWriter, "correlation with errors = " + String(errorCorr));
        experiment.logLine(logWriter, "lower bound correlation with errors = " + String(lbErrorCorr));
        experiment.logLine(logWriter, "upper bound correlation with errors = " + String(ubErrorCorr));
        experiment.logLine(logWriter, "correlation with first constituent = " + String(featureCorrI));
        experiment.logLine(logWriter, "correlation with second constituent = " + String(featureCorrJ));
        experiment.logLine(logWriter, "observed pair of instances " + String(pairActs) + " times");
        experiment.logLine(logWriter, "observed first constituent " + String(actsI) + " times");
        experiment.logLine(logWriter, "observed second constituent " + String(actsJ) + " times");

        currFeatureSet = newFeatureSet;
        break;
      }
    }

    return currFeatureSet;
  }

  //-------------------------------------------------------------------------

}
