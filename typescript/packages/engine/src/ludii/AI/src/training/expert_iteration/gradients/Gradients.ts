// @java AI/src/training/expert_iteration/gradients/Gradients.java

/**
 * Class with helper methods to compute gradients for self-play training
 * (and related stuff, like errors/losses)
 *
 * @java training.expert_iteration.gradients.Gradients
 * @author Dennis Soemers
 */

import type { FeatureVector } from "../../feature_discovery/FeatureSetExpander.js";
import type { ExItExperience } from "../ExItExperience.js";

//-------------------------------------------------------------------------

/** @java main.collections.FVector — extended escape hatch for gradient ops */
type FVector = {
  get(i: number): number;
  set(i: number, v: number): void;
  copy(): FVector;
  abs(): void;
  sum(): number;
  min(): number;
  max(): number;
  softmax(temp: number): void;
  normalise(): void;
  sampleFromDistribution(): number;
  updateSoftmaxInvalidate(idx: number): void;
  dim(): number;
  subtract(other: FVector): void;
  add(other: FVector): void;
  mult(scalar: number): void;
  div(scalar: number): void;
  sign(): void;
};

//-------------------------------------------------------------------------

/** @java policies.softmax.SoftmaxPolicyLinear — escape hatch */
type SoftmaxPolicyLinear = {
  computeDistribution(featureVectors: FeatureVector[], mover: number): FVector;
};

/** @java metadata.ai.heuristics.Heuristics — escape hatch */
type Heuristics = {
  paramsVector(): FVector;
};

/** @java optimisers.Optimiser — escape hatch */
type Optimiser = {
  minimiseObjective(params: FVector, gradients: FVector): void;
  maximiseObjective(params: FVector, gradients: FVector): void;
};

/** @java gnu.trove.list.array.TIntArrayList — escape hatch */
type TIntArrayList = {
  size(): number;
  getQuick(i: number): number;
  add(v: number): void;
  containsKey?(key: unknown): boolean;
};

//-------------------------------------------------------------------------

/**
 * Class with static helper methods to compute gradients for self-play training.
 *
 * @java training.expert_iteration.gradients.Gradients
 */
export class Gradients {

  //-------------------------------------------------------------------------

  /**
   * Don't need a constructor for this class
   * @java Gradients() — private
   */
  private constructor() {
    // Do nothing
  }

  //-------------------------------------------------------------------------

  /**
   * @param estimatedDistribution
   * @param targetDistribution
   * @return Vector of errors for estimated distribution in comparison to
   * target distribution (simply estimated - target)
   * @java Gradients.computeDistributionErrors(FVector, FVector)
   */
  public static computeDistributionErrors(
    estimatedDistribution: FVector,
    targetDistribution: FVector,
  ): FVector {
    const errors = estimatedDistribution.copy();
    errors.subtract(targetDistribution);
    return errors;
  }

  //-------------------------------------------------------------------------

  /**
   * @java Gradients.computeCrossEntropyErrors(SoftmaxPolicyLinear, FVector, FeatureVector[], int, boolean)
   */
  public static computeCrossEntropyErrors(
    policy: SoftmaxPolicyLinear,
    expertDistribution: FVector,
    featureVectors: FeatureVector[],
    p: number,
    handleAliasing: boolean,
  ): FVector {
    const apprenticePolicy = policy.computeDistribution(featureVectors, p);
    let expertPolicy: FVector;

    if (handleAliasing) {
      // Need to handle aliased moves
      const movesPerFeatureVector = new Map<FeatureVector, number[]>();
      for (let moveIdx = 0; moveIdx < featureVectors.length; ++moveIdx) {
        const featureVector = featureVectors[moveIdx]!;
        if (!movesPerFeatureVector.has(featureVector)) {
          movesPerFeatureVector.set(featureVector, []);
        }
        movesPerFeatureVector.get(featureVector)!.push(moveIdx);
      }

      expertPolicy = expertDistribution.copy(); // Don't want to permanently modify the original

      const alreadyUpdatedValue = new Array<boolean>(expertPolicy.dim()).fill(false);
      for (let moveIdx = 0; moveIdx < expertPolicy.dim(); ++moveIdx) {
        if (alreadyUpdatedValue[moveIdx]) continue;

        const aliasedMoves = movesPerFeatureVector.get(featureVectors[moveIdx]!);
        if (aliasedMoves !== undefined && aliasedMoves.length > 1) {
          let maxVal = 0;
          for (let i = 0; i < aliasedMoves.length; ++i) {
            const val = expertPolicy.get(aliasedMoves[i]!);
            if (val > maxVal) maxVal = val;
          }

          // Set all aliased moves to the max probability
          for (let i = 0; i < aliasedMoves.length; ++i) {
            expertPolicy.set(aliasedMoves[i]!, maxVal);
            alreadyUpdatedValue[aliasedMoves[i]!] = true;
          }
        }
      }

      // Renormalise the expert policy
      expertPolicy.normalise();
    } else {
      expertPolicy = expertDistribution;
    }

    return Gradients.computeDistributionErrors(apprenticePolicy, expertPolicy);
  }

  //-------------------------------------------------------------------------

  /**
   * @param valueFunction
   * @param p
   * @param sample
   * @return Vector of value function gradients, or null if value function is null or player is invalid.
   * @java Gradients.computeValueGradients(Heuristics, int, ExItExperience)
   */
  public static computeValueGradients(
    valueFunction: Heuristics | null,
    p: number,
    sample: ExItExperience,
  ): FVector | null {
    if (valueFunction !== null && p > 0) {
      // Compute gradients for value function
      const valueFunctionParams = valueFunction.paramsVector();
      // stateFeatureVector() is FVector from FeatureSetExpander — same Java class, cast needed
      const stateFeatureVec = sample.stateFeatureVector()! as unknown as FVector;
      const predictedValue = Math.tanh(
        (valueFunctionParams as unknown as { dot(v: FVector): number }).dot(stateFeatureVec),
      );
      const gameOutcome = sample.playerOutcomes()![
        (sample.gameState() as unknown as { mover(): number }).mover()
      ]!;

      const valueError = predictedValue - gameOutcome;
      // FVector constructor — escape hatch for the not-yet-ported FVector class constructor
      const valueGradients = FVectorCtor(valueFunctionParams.dim());

      // Need to multiply this by feature value to compute gradient per feature
      const gradDivFeature = 2 * valueError * (1 - predictedValue * predictedValue);

      for (let i = 0; i < valueGradients.dim(); ++i) {
        valueGradients.set(i, gradDivFeature * stateFeatureVec.get(i));
      }
      // Note: Java method returns null here despite the computation above (bug in Java source)
    }

    return null;
  }

  //-------------------------------------------------------------------------

  /**
   * @param gradientVectors
   * @return Mean vector of gradients, or null if there are no vectors of gradients.
   * @java Gradients.meanGradients(List<FVector>)
   */
  public static meanGradients(gradientVectors: FVector[]): FVector | null {
    if (gradientVectors.length > 0) {
      return (FVectorUtils as unknown as { mean(vectors: FVector[]): FVector }).mean(
        gradientVectors,
      );
    }
    return null;
  }

  /**
   * @param gradientVectors
   * @param sumImportanceSamplingWeights
   * @return A single vector of gradients computed using Weighted Importance Sampling,
   *   or null if there are no vectors of gradients.
   * @java Gradients.wisGradients(List<FVector>, float)
   */
  public static wisGradients(
    gradientVectors: FVector[],
    sumImportanceSamplingWeights: number,
  ): FVector | null {
    if (gradientVectors.length === 0) return null;

    const wisGradients = gradientVectors[0]!.copy();
    for (let i = 1; i < gradientVectors.length; ++i) {
      wisGradients.add(gradientVectors[i]!);
    }

    if (sumImportanceSamplingWeights > 0.0) {
      wisGradients.div(sumImportanceSamplingWeights);
    }

    return wisGradients;
  }

  //-------------------------------------------------------------------------

  /**
   * Runs a gradient descent step + weight decay to minimise some loss for
   * which the gradients are provided.
   *
   * @java Gradients.minimise(Optimiser, FVector, FVector, float)
   */
  public static minimise(
    optimiser: Optimiser,
    params: FVector,
    gradients: FVector,
    weightDecayLambda: number,
  ): void {
    // new FVector(params) — copy of params vector
    const weightDecayVector = FVectorCopyOf(params);
    weightDecayVector.mult(weightDecayLambda);
    optimiser.minimiseObjective(params, gradients);
    params.subtract(weightDecayVector);
  }

  /**
   * Runs a gradient ascent step + weight decay to maximise some objective for
   * which the gradients are provided.
   *
   * @java Gradients.maximise(Optimiser, FVector, FVector, float)
   */
  public static maximise(
    optimiser: Optimiser,
    params: FVector,
    gradients: FVector,
    weightDecayLambda: number,
  ): void {
    // new FVector(params) — copy of params vector
    const weightDecayVector = FVectorCopyOf(params);
    weightDecayVector.mult(weightDecayLambda);
    optimiser.maximiseObjective(params, gradients);
    params.subtract(weightDecayVector);
  }

  //-------------------------------------------------------------------------

}

//-------------------------------------------------------------------------

/** @java main.collections.FVector — escape hatch for static methods */
const FVectorUtils = null as unknown as {
  mean(vectors: FVector[]): FVector;
};

/** @java new FVector(int) — escape hatch for constructing an FVector of given dim */
const FVectorCtor = null as unknown as (dim: number) => FVector;

/** @java new FVector(FVector) — escape hatch for copy-constructing an FVector from another */
const FVectorCopyOf = null as unknown as (source: FVector) => FVector;
