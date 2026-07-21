// @java AI/src/training/feature_discovery/RandomExpander.java

/**
 * Random Feature Set Expander.
 *
 * @java training.feature_discovery.RandomExpander
 * @author Dennis Soemers
 */

import {
  CombinableFeatureInstancePair,
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
 * Random Feature Set Expander.
 *
 * @java training.feature_discovery.RandomExpander
 */
export class RandomExpander {

  //-------------------------------------------------------------------------

  /**
   * @java RandomExpander.expandFeatureSet(...)
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

    // For every feature, compute expectation of absolute value of error given that feature is active
    const expectedAbsErrorGivenFeature = new Float64Array(featureSet.getNumSpatialFeatures());

    for (let fIdx = 0; fIdx < featureSet.getNumSpatialFeatures(); ++fIdx) {
      const errorsWhenActive = errorsPerActiveFeature[fIdx]!;
      for (let i = 0; i < errorsWhenActive.length; ++i) {
        const error = errorsWhenActive[i]!;
        expectedAbsErrorGivenFeature[fIdx] = expectedAbsErrorGivenFeature[fIdx]! + (Math.abs(error) - expectedAbsErrorGivenFeature[fIdx]!) / (i + 1);
      }
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

        for (let i = 0; i < numActiveInstances; ++i) {
          const instanceI = instancesToKeep[i]!;

          // increment entries on main diagonals
          const combinedSelf = instancesToKeepCombinedSelfs[i]!;

          if (!containsPair(observedCasePairs, combinedSelf)) {
            addPair(observedCasePairs, combinedSelf);
            mapAdjustOrPut(featurePairActivations, combinedSelf, 1);
          }

          for (let j = i + 1; j < numActiveInstances; ++j) {
            const instanceJ = instancesToKeep[j]!;

            // increment off-diagonal entries
            const combined = new CombinableFeatureInstancePair(game, instanceI, instanceJ);

            if (!existingFeatures.has(combined.combinedFeature)) {
              if (!containsPair(observedCasePairs, combined)) {
                addPair(observedCasePairs, combined);
                mapAdjustOrPut(featurePairActivations, combined, 1);
              }
            }
          }
        }
      }
    }

    const proactivePairs: CombinableFeatureInstancePair[] = [];
    const reactivePairs: CombinableFeatureInstancePair[] = [];

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

        if (pair.combinedFeature.isReactive()) {
          reactivePairs.push(pair);
        } else {
          proactivePairs.push(pair);
        }
      }
    }

    // Shuffle lists for random feature combination
    shuffleArray(proactivePairs);
    shuffleArray(reactivePairs);

    // Keep trying to add a proactive feature
    let currFeatureSet: BaseFeatureSet = featureSet;

    while (proactivePairs.length > 0) {
      const bestPair = proactivePairs.pop()!;
      const newFeatureSet = currFeatureSet.createExpandedFeatureSet(game, bestPair.combinedFeature);
      if (newFeatureSet !== null) {
        const actsI = mapGetOrZero(featurePairActivations, new CombinableFeatureInstancePair(game, bestPair.a, bestPair.a));
        const actsJ = mapGetOrZero(featurePairActivations, new CombinableFeatureInstancePair(game, bestPair.b, bestPair.b));
        const pair = new CombinableFeatureInstancePair(game, bestPair.a, bestPair.b);
        const pairActs = mapGetOrZero(featurePairActivations, pair);

        experiment.logLine(logWriter, "New proactive feature added!");
        experiment.logLine(logWriter, "new feature = " + String(newFeatureSet.spatialFeatures()[newFeatureSet.getNumSpatialFeatures() - 1]));
        experiment.logLine(logWriter, "active feature A = " + String(bestPair.a.feature()));
        experiment.logLine(logWriter, "rot A = " + String(bestPair.a.rotation()));
        experiment.logLine(logWriter, "ref A = " + String(bestPair.a.reflection()));
        experiment.logLine(logWriter, "anchor A = " + String(bestPair.a.anchorSite()));
        experiment.logLine(logWriter, "active feature B = " + String(bestPair.b.feature()));
        experiment.logLine(logWriter, "rot B = " + String(bestPair.b.rotation()));
        experiment.logLine(logWriter, "ref B = " + String(bestPair.b.reflection()));
        experiment.logLine(logWriter, "anchor B = " + String(bestPair.b.anchorSite()));
        experiment.logLine(logWriter, "observed pair of instances " + String(pairActs) + " times");
        experiment.logLine(logWriter, "observed first constituent " + String(actsI) + " times");
        experiment.logLine(logWriter, "observed second constituent " + String(actsJ) + " times");

        currFeatureSet = newFeatureSet;
        break;
      }
    }

    // Keep trying to add a reactive feature
    while (reactivePairs.length > 0) {
      const bestPair = reactivePairs.pop()!;
      const newFeatureSet = currFeatureSet.createExpandedFeatureSet(game, bestPair.combinedFeature);
      if (newFeatureSet !== null) {
        const actsI = mapGetOrZero(featurePairActivations, new CombinableFeatureInstancePair(game, bestPair.a, bestPair.a));
        const actsJ = mapGetOrZero(featurePairActivations, new CombinableFeatureInstancePair(game, bestPair.b, bestPair.b));
        const pair = new CombinableFeatureInstancePair(game, bestPair.a, bestPair.b);
        const pairActs = mapGetOrZero(featurePairActivations, pair);

        experiment.logLine(logWriter, "New reactive feature added!");
        experiment.logLine(logWriter, "new feature = " + String(newFeatureSet.spatialFeatures()[newFeatureSet.getNumSpatialFeatures() - 1]));
        experiment.logLine(logWriter, "active feature A = " + String(bestPair.a.feature()));
        experiment.logLine(logWriter, "rot A = " + String(bestPair.a.rotation()));
        experiment.logLine(logWriter, "ref A = " + String(bestPair.a.reflection()));
        experiment.logLine(logWriter, "anchor A = " + String(bestPair.a.anchorSite()));
        experiment.logLine(logWriter, "active feature B = " + String(bestPair.b.feature()));
        experiment.logLine(logWriter, "rot B = " + String(bestPair.b.rotation()));
        experiment.logLine(logWriter, "ref B = " + String(bestPair.b.reflection()));
        experiment.logLine(logWriter, "anchor B = " + String(bestPair.b.anchorSite()));
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

//-------------------------------------------------------------------------

/**
 * Fisher-Yates shuffle.
 * @java java.util.Collections.shuffle(List)
 */
function shuffleArray<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; --i) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
}
