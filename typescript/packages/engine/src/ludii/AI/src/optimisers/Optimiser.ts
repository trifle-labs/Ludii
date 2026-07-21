// @java AI/src/optimisers/Optimiser.java

/**
 * Base class for optimizers. All optimizers are pretty much assumed to be
 * variants of Mini-Batch Gradient Descent.
 *
 * @java optimisers.Optimiser
 * @author Dennis Soemers
 */

import { FVector } from "../../../Common/src/main/collections/FVector.js";

// ---------------------------------------------------------------------------

/**
 * Base class for optimizers.
 *
 * @java optimisers.Optimiser
 */
export abstract class Optimiser {

  // -------------------------------------------------------------------------

  /** Base step-size (or learning rate) to use */
  protected readonly baseStepSize: number;

  // -------------------------------------------------------------------------

  /**
   * Constructor
   * @param baseStepSize
   * @java Optimiser(float)
   */
  public constructor(baseStepSize: number) {
    this.baseStepSize = baseStepSize;
  }

  // -------------------------------------------------------------------------

  /**
   * Should be implemented to adjust the given vector of parameters in an
   * attempt to maximise an objective function. The objective function is
   * implied by a vector of (estimates of) gradients of that objective
   * function with respect to the trainable parameters.
   *
   * @param params Parameters to train
   * @param gradients Vector of (estimates of) gradients of objective with respect to params.
   * @java Optimiser.maximiseObjective(FVector, FVector)
   */
  public abstract maximiseObjective(params: FVector, gradients: FVector): void;

  /**
   * Calls maximiseObjective() with negated gradients, in order to minimize
   * the objective.
   *
   * @param params
   * @param gradients
   * @java Optimiser.minimiseObjective(FVector, FVector)
   */
  public minimiseObjective(params: FVector, gradients: FVector): void {
    const negatedGrads = gradients.copy();
    negatedGrads.mult(-1.0);
    this.maximiseObjective(params, negatedGrads);
  }

  // -------------------------------------------------------------------------

  /**
   * Writes this optimiser's internal state to a binary file (stub for browser env).
   * @param filepath
   * @java Optimiser.writeToFile(String)
   */
  public abstract writeToFile(filepath: string): void;

  // -------------------------------------------------------------------------
}
