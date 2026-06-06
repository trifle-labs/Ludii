// @java AI/src/training/feature_discovery/CorrelationErrorSignExpander.java

/**
 * Correlation-based Feature Set Expander. Only uses signs of errors,
 * not the magnitudes of errors.
 *
 * @java training/feature_discovery/CorrelationErrorSignExpander.java
 * @author Dennis Soemers
 */

import {
  type FeatureSetExpander,
  type BaseFeatureSet,
  type SoftmaxPolicyLinear,
  type Game,
  type ExperienceSample,
  type FeatureDiscoveryParams,
  type ObjectiveParams,
  type TDoubleArrayList,
  type PrintWriter,
  type InterruptableExperiment,
  type FeatureInstance,
  ScoredFeatureInstancePair,
  CombinableFeatureInstancePair,
} from "./FeatureSetExpander.js";

type GradientsT = {
  computeDistributionErrors(apprenticePolicy: unknown, expertDistribution: unknown): FVectorT;
};

type FVectorT = {
  get(i: number): number;
  set(i: number, v: number): void;
  copy(): FVectorT;
  abs(): void;
  sum(): number;
  sign(): void;
};

type FeatureUtilsT = {
  fromPos(move: unknown): number;
  toPos(move: unknown): number;
};

const Gradients = null as unknown as GradientsT;
const FeatureUtils = null as unknown as FeatureUtilsT;

class ObjIntMap {
  private map: Map<number, Array<{ key: CombinableFeatureInstancePair; value: number }>> = new Map();

  get(key: CombinableFeatureInstancePair): number {
    const bucket = this.map.get(key.hashCode());
    if (!bucket) return 0;
    for (const entry of bucket) {
      if (entry.key.equals(key)) return entry.value;
    }
    return 0;
  }

  adjustOrPutValue(key: CombinableFeatureInstancePair, delta: number, putValue: number): void {
    const h = key.hashCode();
    let bucket = this.map.get(h);
    if (!bucket) { bucket = []; this.map.set(h, bucket); }
    for (const entry of bucket) {
      if (entry.key.equals(key)) { entry.value += delta; return; }
    }
    bucket.push({ key, value: putValue });
  }

  keySet(): CombinableFeatureInstancePair[] {
    const result: CombinableFeatureInstancePair[] = [];
    for (const bucket of this.map.values()) {
      for (const entry of bucket) result.push(entry.key);
    }
    return result;
  }
}

class ObjDoubleMap {
  private map: Map<number, Array<{ key: CombinableFeatureInstancePair; value: number }>> = new Map();

  get(key: CombinableFeatureInstancePair): number {
    const bucket = this.map.get(key.hashCode());
    if (!bucket) return 0.0;
    for (const entry of bucket) {
      if (entry.key.equals(key)) return entry.value;
    }
    return 0.0;
  }

  adjustOrPutValue(key: CombinableFeatureInstancePair, delta: number, putValue: number): void {
    const h = key.hashCode();
    let bucket = this.map.get(h);
    if (!bucket) { bucket = []; this.map.set(h, bucket); }
    for (const entry of bucket) {
      if (entry.key.equals(key)) { entry.value += delta; return; }
    }
    bucket.push({ key, value: putValue });
  }
}

class CombinablePairSet {
  private map: Map<number, CombinableFeatureInstancePair[]> = new Map();

  add(pair: CombinableFeatureInstancePair): boolean {
    const h = pair.hashCode();
    let bucket = this.map.get(h);
    if (!bucket) { bucket = []; this.map.set(h, bucket); }
    for (const p of bucket) { if (p.equals(pair)) return false; }
    bucket.push(pair);
    return true;
  }

  contains(pair: CombinableFeatureInstancePair): boolean {
    const bucket = this.map.get(pair.hashCode());
    if (!bucket) return false;
    for (const p of bucket) { if (p.equals(pair)) return true; }
    return false;
  }

  size(): number {
    let n = 0;
    for (const bucket of this.map.values()) n += bucket.length;
    return n;
  }
}

class ScoredPairPriorityQueue {
  private heap: ScoredFeatureInstancePair[] = [];

  add(item: ScoredFeatureInstancePair): void {
    this.heap.push(item);
    this.heap.sort((a, b) => b.score - a.score);
  }

  poll(): ScoredFeatureInstancePair | undefined {
    return this.heap.shift();
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }
}

/**
 * Correlation-based Feature Set Expander. Only uses signs of errors,
 * not the magnitudes of errors.
 *
 * @java training.feature_discovery.CorrelationErrorSignExpander
 */
export class CorrelationErrorSignExpander implements FeatureSetExpander {

  /**
   * @java CorrelationErrorSignExpander.expandFeatureSet(...)
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
    experiment: InterruptableExperiment
  ): BaseFeatureSet | null {
    let numCases = 0;

    // this is our C_f matrix
    const featurePairActivations = new ObjIntMap();

    // this is our C_e matrix
    const errorSums = new ObjDoubleMap();

    // these are our S and SS scalars
    let sumErrors = 0.0;
    let sumSquaredErrors = 0.0;

    // Create a Set of features already in Feature Set
    const existingFeatures = new Set<string>();
    for (const feature of featureSet.spatialFeatures()) {
      existingFeatures.add(feature.toString());
    }

    // For every sample in batch, first compute apprentice policies, errors, and sum of absolute errors
    const apprenticePolicies: unknown[] = new Array(batch.length);
    const errorVectors: FVectorT[] = new Array(batch.length);
    const absErrorSums: number[] = new Array(batch.length);

    const errorsPerActiveFeature: number[][] = [];
    for (let i = 0; i < featureSet.getNumSpatialFeatures(); ++i) {
      errorsPerActiveFeature.push([]);
    }
    let avgActionError = 0.0;

    for (let i = 0; i < batch.length; ++i) {
      const sample = batch[i]!;

      const featureVectors = sample.generateFeatureVectors(featureSet);

      const apprenticePolicy = policy.computeDistribution(featureVectors, sample.gameState().mover());
      const errors = Gradients.computeDistributionErrors(
        apprenticePolicy,
        sample.expertDistribution()
      );

      // This is used just for sorting, don't want to lose magnitudes and only keep signs here
      const absErrors = errors.copy();
      absErrors.abs();

      // In errors vector, only preserve signs
      errors.sign();

      for (let a = 0; a < featureVectors.length; ++a) {
        const actionError = errors.get(a);
        const sparseFeatureVector = featureVectors[a]!.activeSpatialFeatureIndices();
        sparseFeatureVector.sort();
        let sparseIdx = 0;

        for (let featureIdx = 0; featureIdx < featureSet.getNumSpatialFeatures(); ++featureIdx) {
          if (sparseIdx < sparseFeatureVector.size() && sparseFeatureVector.getQuick(sparseIdx) === featureIdx) {
            errorsPerActiveFeature[featureIdx]!.push(actionError);
            ++sparseIdx;
          }
        }

        avgActionError += (actionError - avgActionError) / (numCases + 1);
        ++numCases;
      }

      apprenticePolicies[i] = apprenticePolicy;
      errorVectors[i] = errors;
      absErrorSums[i] = absErrors.sum();
    }

    // For every feature, compute expectation of absolute value of error given that feature is active
    const expectedAbsErrorGivenFeature: number[] = new Array(featureSet.getNumSpatialFeatures()).fill(0.0);

    for (let fIdx = 0; fIdx < featureSet.getNumSpatialFeatures(); ++fIdx) {
      const errorsWhenActive = errorsPerActiveFeature[fIdx]!;

      for (let i = 0; i < errorsWhenActive.length; ++i) {
        const error = errorsWhenActive[i]!;
        expectedAbsErrorGivenFeature[fIdx]! += (Math.abs(error) - expectedAbsErrorGivenFeature[fIdx]!) / (i + 1);
      }
    }

    // Create list of indices sorted in descending order of sums of absolute errors
    const batchIndices: number[] = [];
    for (let i = 0; i < batch.length; ++i) batchIndices.push(i);
    batchIndices.sort((o1, o2) => {
      const delta = absErrorSums[o1]! - absErrorSums[o2]!;
      if (delta > 0.0) return -1;
      else if (delta < 0.0) return 1;
      else return 0;
    });

    const preservedInstances = new CombinablePairSet();
    const discardedInstances = new CombinablePairSet();

    for (let bi = 0; bi < batchIndices.length; ++bi) {
      const batchIndex = batchIndices[bi]!;
      const sample = batch[batchIndex]!;
      const errors = errorVectors[batchIndex]!;
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
        unsortedActionIndices.splice(r, 1);
        sortedActionIndices.push(a);
      }

      for (let aIdx = 0; aIdx < sortedActionIndices.length; ++aIdx) {
        const a = sortedActionIndices[aIdx]!;

        const observedCasePairs = new CombinablePairSet();

        const activeInstancesSet = new Set<FeatureInstance>(
          featureSet.getActiveSpatialFeatureInstances(
            sample.gameState(),
            sample.lastFromPos(),
            sample.lastToPos(),
            FeatureUtils.fromPos(moves.get(a)),
            FeatureUtils.toPos(moves.get(a)),
            moves.get(a).mover()
          )
        );
        const activeInstances: FeatureInstance[] = Array.from(activeInstancesSet);
        const origActiveInstances: FeatureInstance[] = [...activeInstances];

        const instancesToKeep: FeatureInstance[] = [];
        const activeInstancesCombinedSelfs: CombinableFeatureInstancePair[] = [];
        const instancesToKeepCombinedSelfs: CombinableFeatureInstancePair[] = [];

        for (let i = 0; i < activeInstances.length; /* */) {
          const instance = activeInstances[i]!;
          const combinedSelf = new CombinableFeatureInstancePair(game, instance, instance);

          if (preservedInstances.contains(combinedSelf)) {
            instancesToKeepCombinedSelfs.push(combinedSelf);
            instancesToKeep.push(instance);
            activeInstances.splice(i, 1);
          } else if (discardedInstances.contains(combinedSelf)) {
            activeInstances.splice(i, 1);
          } else if (featureActiveRatios.getQuick(instance.feature().spatialFeatureSetIndex()) === 1.0) {
            activeInstances.splice(i, 1);
          } else {
            activeInstancesCombinedSelfs.push(combinedSelf);
            ++i;
          }
        }

        let numInstancesAllowedThisAction = Math.min(
          Math.min(50, featureDiscoveryMaxNumFeatureInstances - preservedInstances.size()),
          activeInstances.length
        );

        if (numInstancesAllowedThisAction > 0) {
          const distr: number[] = new Array(activeInstances.length);
          for (let i = 0; i < activeInstances.length; ++i) {
            const fIdx = activeInstances[i]!.feature().spatialFeatureSetIndex();
            distr[i] = expectedAbsErrorGivenFeature[fIdx]!;
          }

          // Softmax with temperature 2.0
          const maxVal = Math.max(...distr);
          let sumExp = 0.0;
          for (let i = 0; i < distr.length; ++i) {
            distr[i] = Math.exp((distr[i]! - maxVal) * 2.0);
            sumExp += distr[i]!;
          }
          for (let i = 0; i < distr.length; ++i) distr[i] = distr[i]! / sumExp;

          for (let i = 0; i < activeInstances.length; ++i) {
            const fIdx = activeInstances[i]!.feature().spatialFeatureSetIndex();
            let featureCount = 0;
            for (let j = 0; j < origActiveInstances.length; ++j) {
              if (origActiveInstances[j]!.feature().spatialFeatureSetIndex() === fIdx) ++featureCount;
            }
            distr[i] = distr[i]! / featureCount;
          }

          let distrSum = 0.0;
          for (const v of distr) distrSum += v;
          for (let i = 0; i < distr.length; ++i) distr[i] = distrSum > 0 ? distr[i]! / distrSum : 1.0 / distr.length;

          const invalid = new Array(distr.length).fill(false) as boolean[];

          while (numInstancesAllowedThisAction > 0) {
            let cumulative = 0.0;
            const r = Math.random();
            let sampledIdx = distr.length - 1;
            for (let i = 0; i < distr.length; ++i) {
              if (!invalid[i]) {
                cumulative += distr[i]!;
                if (r <= cumulative) { sampledIdx = i; break; }
              }
            }

            const combinedSelf = activeInstancesCombinedSelfs[sampledIdx]!;
            const keepInstance = activeInstances[sampledIdx]!;
            instancesToKeep.push(keepInstance);
            instancesToKeepCombinedSelfs.push(combinedSelf);
            preservedInstances.add(combinedSelf);
            invalid[sampledIdx] = true;
            distr[sampledIdx] = 0.0;
            --numInstancesAllowedThisAction;

            for (let i = 0; i < distr.length; ++i) {
              if (!invalid[i]) {
                if (combinedSelf.equals(activeInstancesCombinedSelfs[i]!)) {
                  instancesToKeep.push(activeInstances[i]!);
                  instancesToKeepCombinedSelfs.push(activeInstancesCombinedSelfs[i]!);
                  invalid[i] = true;
                  distr[i] = 0.0;
                  --numInstancesAllowedThisAction;
                }
              }
            }
          }
        }

        for (let i = 0; i < activeInstances.length; ++i) {
          const combinedSelf = new CombinableFeatureInstancePair(game, activeInstances[i]!, activeInstances[i]!);
          if (!preservedInstances.contains(combinedSelf)) {
            discardedInstances.add(combinedSelf);
          }
        }

        const numActiveInstances = instancesToKeep.length;
        const error = errors.get(a);

        sumErrors += error;
        sumSquaredErrors += error * error;

        for (let i = 0; i < numActiveInstances; ++i) {
          const instanceI = instancesToKeep[i]!;
          const combinedSelf = instancesToKeepCombinedSelfs[i]!;

          if (observedCasePairs.add(combinedSelf)) {
            featurePairActivations.adjustOrPutValue(combinedSelf, 1, 1);
            errorSums.adjustOrPutValue(combinedSelf, error, error);
          }

          for (let j = i + 1; j < numActiveInstances; ++j) {
            const instanceJ = instancesToKeep[j]!;
            const combined = new CombinableFeatureInstancePair(game, instanceI, instanceJ);

            if (!existingFeatures.has(combined.combinedFeature.toString())) {
              if (observedCasePairs.add(combined)) {
                featurePairActivations.adjustOrPutValue(combined, 1, 1);
                errorSums.adjustOrPutValue(combined, error, error);
              }
            }
          }
        }
      }
    }

    if (sumErrors === 0.0 || sumSquaredErrors === 0.0) {
      return null;
    }

    const proactivePairs = new ScoredPairPriorityQueue();
    const reactivePairs = new ScoredPairPriorityQueue();

    const requiredSampleSize = 3 + Math.floor(Math.random() * 3);

    for (const pair of featurePairActivations.keySet()) {
      if (!pair.a.equals(pair.b)) {
        const pairActs = featurePairActivations.get(pair);
        if (pairActs === numCases || numCases < 4) continue;
        if (pairActs < requiredSampleSize) continue;

        const actsI = featurePairActivations.get(new CombinableFeatureInstancePair(game, pair.a, pair.a));
        const actsJ = featurePairActivations.get(new CombinableFeatureInstancePair(game, pair.b, pair.b));

        if (actsI === numCases || actsJ === numCases || pairActs === actsI || pairActs === actsJ) continue;

        const pairErrorSum = errorSums.get(pair);

        const errorCorr = (
          (numCases * pairErrorSum - pairActs * sumErrors)
          /
          (
            Math.sqrt(pairActs * (numCases - pairActs)) *
            Math.sqrt(numCases * sumSquaredErrors - sumErrors * sumErrors)
          )
        );

        const errorCorrZ = 0.5 * Math.log((1.0 + errorCorr) / (1.0 - errorCorr));
        const stdErrorCorrZ = Math.sqrt(1.0 / (numCases - 3));
        const lbErrorCorrZ = errorCorrZ - featureDiscoveryParams.criticalValueCorrConf * stdErrorCorrZ;
        const lbErrorCorr = (Math.exp(2.0 * lbErrorCorrZ) - 1.0) / (Math.exp(2.0 * lbErrorCorrZ) + 1.0);
        const ubErrorCorrZ = errorCorrZ + featureDiscoveryParams.criticalValueCorrConf * stdErrorCorrZ;
        const ubErrorCorr = (Math.exp(2.0 * ubErrorCorrZ) - 1.0) / (Math.exp(2.0 * ubErrorCorrZ) + 1.0);

        const featureCorrI = (
          (pairActs * (numCases - actsI))
          /
          (
            Math.sqrt(pairActs * (numCases - pairActs)) *
            Math.sqrt(actsI * (numCases - actsI))
          )
        );

        const featureCorrJ = (
          (pairActs * (numCases - actsJ))
          /
          (
            Math.sqrt(pairActs * (numCases - pairActs)) *
            Math.sqrt(actsJ * (numCases - actsJ))
          )
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
          reactivePairs.add(new ScoredFeatureInstancePair(pair, score));
        } else {
          proactivePairs.add(new ScoredFeatureInstancePair(pair, score));
        }
      }
    }

    let currFeatureSet: BaseFeatureSet = featureSet;

    while (!proactivePairs.isEmpty()) {
      const bestPair = proactivePairs.poll()!;
      const newFeatureSet = currFeatureSet.createExpandedFeatureSet(game, bestPair.pair.combinedFeature);

      if (newFeatureSet !== null) {
        const actsI = featurePairActivations.get(new CombinableFeatureInstancePair(game, bestPair.pair.a, bestPair.pair.a));
        const actsJ = featurePairActivations.get(new CombinableFeatureInstancePair(game, bestPair.pair.b, bestPair.pair.b));
        const pair = new CombinableFeatureInstancePair(game, bestPair.pair.a, bestPair.pair.b);
        const pairActs = featurePairActivations.get(pair);
        const pairErrorSum = errorSums.get(pair);

        const errorCorr = (numCases * pairErrorSum - pairActs * sumErrors) /
          (Math.sqrt(numCases * pairActs - pairActs * pairActs) * Math.sqrt(numCases * sumSquaredErrors - sumErrors * sumErrors));
        const errorCorrZ = 0.5 * Math.log((1.0 + errorCorr) / (1.0 - errorCorr));
        const stdErrorCorrZ = Math.sqrt(1.0 / (numCases - 3));
        const lbErrorCorrZ = errorCorrZ - 1.64 * stdErrorCorrZ;
        const lbErrorCorr = (Math.exp(2.0 * lbErrorCorrZ) - 1.0) / (Math.exp(2.0 * lbErrorCorrZ) + 1.0);
        const ubErrorCorrZ = errorCorrZ + 1.64 * stdErrorCorrZ;
        const ubErrorCorr = (Math.exp(2.0 * ubErrorCorrZ) - 1.0) / (Math.exp(2.0 * ubErrorCorrZ) + 1.0);
        const featureCorrI = (numCases * pairActs - pairActs * actsI) /
          (Math.sqrt(numCases * pairActs - pairActs * pairActs) * Math.sqrt(numCases * actsI - actsI * actsI));
        const featureCorrJ = (numCases * pairActs - pairActs * actsJ) /
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

    while (!reactivePairs.isEmpty()) {
      const bestPair = reactivePairs.poll()!;
      const newFeatureSet = currFeatureSet.createExpandedFeatureSet(game, bestPair.pair.combinedFeature);

      if (newFeatureSet !== null) {
        const actsI = featurePairActivations.get(new CombinableFeatureInstancePair(game, bestPair.pair.a, bestPair.pair.a));
        const actsJ = featurePairActivations.get(new CombinableFeatureInstancePair(game, bestPair.pair.b, bestPair.pair.b));
        const pair = new CombinableFeatureInstancePair(game, bestPair.pair.a, bestPair.pair.b);
        const pairActs = featurePairActivations.get(pair);
        const pairErrorSum = errorSums.get(pair);

        const errorCorr = (numCases * pairErrorSum - pairActs * sumErrors) /
          (Math.sqrt(numCases * pairActs - pairActs * pairActs) * Math.sqrt(numCases * sumSquaredErrors - sumErrors * sumErrors));
        const errorCorrZ = 0.5 * Math.log((1.0 + errorCorr) / (1.0 - errorCorr));
        const stdErrorCorrZ = Math.sqrt(1.0 / (numCases - 3));
        const lbErrorCorrZ = errorCorrZ - 1.64 * stdErrorCorrZ;
        const lbErrorCorr = (Math.exp(2.0 * lbErrorCorrZ) - 1.0) / (Math.exp(2.0 * lbErrorCorrZ) + 1.0);
        const ubErrorCorrZ = errorCorrZ + 1.64 * stdErrorCorrZ;
        const ubErrorCorr = (Math.exp(2.0 * ubErrorCorrZ) - 1.0) / (Math.exp(2.0 * ubErrorCorrZ) + 1.0);
        const featureCorrI = (numCases * pairActs - pairActs * actsI) /
          (Math.sqrt(numCases * pairActs - pairActs * pairActs) * Math.sqrt(numCases * actsI - actsI * actsI));
        const featureCorrJ = (numCases * pairActs - pairActs * actsJ) /
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
}
