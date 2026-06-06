// @java AI/src/optimisers/DeepmindRMSProp.java

/**
 * A variant of RMSProp that, as far as we're able to tell, DeepMind tends
 * to use more often than standard RMSProp (for example in the original
 * DQN Lua code).
 *
 * The primary differences in comparison to regular RMSProp are:
 *   1) Usage of plain (not Nesterov) momentum
 *   2) Centering by subtracting moving average of gradients in denominator.
 *   This means that gradients are normalized by the estimated variance of
 *   gradient, rather than the uncentered second moment (according to comments
 *   in TensorFlow implementation).
 *
 * This implementation specifically follows Equations (38) - (41) from
 * https://arxiv.org/abs/1308.0850, which seems to be one of the only
 * (if not the only) published sources for this particular variant of RMSProp.
 *
 * @java optimisers.DeepmindRMSProp
 * @author Dennis Soemers
 */

import { FVector } from "../../../Common/src/main/collections/FVector.js";
import { Optimiser } from "./Optimiser.js";

// ---------------------------------------------------------------------------

/**
 * A variant of RMSProp (DeepMind-style).
 *
 * @java optimisers.DeepmindRMSProp
 */
export class DeepmindRMSProp extends Optimiser {

  // -------------------------------------------------------------------------

  /**
   * Momentum term.
   * "Velocity" of previous update is scaled by this value and added to
   * subsequent update.
   */
  protected readonly momentum: number;

  /**
   * Decay factor used in updates of moving averages of (squared) gradients.
   */
  protected readonly decay: number;

  /** Small constant added to denominator */
  protected readonly epsilon: number;

  /**
   * Last "velocity" vector. Used for momentum.
   */
  private lastVelocity: FVector | null = null;

  /** Moving average of gradients */
  private movingAvgGradients: FVector | null = null;

  /** Moving average of squared gradients */
  private movingAvgSquaredGradients: FVector | null = null;

  // -------------------------------------------------------------------------

  /**
   * Constructor (default parameters)
   * @java DeepmindRMSProp()
   */
  public constructor();
  /**
   * Constructor
   *
   * @param baseStepSize
   * @java DeepmindRMSProp(float)
   */
  public constructor(baseStepSize: number);
  /**
   * Constructor
   *
   * @param baseStepSize
   * @param momentum
   * @param decay
   * @param epsilon
   * @java DeepmindRMSProp(float, float, float, float)
   */
  public constructor(baseStepSize: number, momentum: number, decay: number, epsilon: number);
  public constructor(
    baseStepSize = 0.05,
    momentum = 0.9,
    decay = 0.9,
    epsilon = 1.0e-8
  ) {
    super(baseStepSize);
    this.momentum = momentum;
    this.decay = decay;
    this.epsilon = epsilon;
  }

  // -------------------------------------------------------------------------

  /**
   * @java DeepmindRMSProp.maximiseObjective(FVector, FVector)
   */
  public override maximiseObjective(params: FVector, gradients: FVector): void {
    const velocity = gradients.copy();
    velocity.mult(this.baseStepSize / velocity.dim());

    if (this.movingAvgGradients === null) {
      // need to initialize vectors for moving averages
      this.movingAvgGradients = new FVector(gradients.dim());
      this.movingAvgSquaredGradients = new FVector(gradients.dim());
    } else {
      // may have to grow moving average vectors if feature set grew
      while (this.movingAvgGradients.dim() < gradients.dim()) {
        this.movingAvgGradients = this.movingAvgGradients.append(0.0);
        this.movingAvgSquaredGradients = this.movingAvgSquaredGradients!.append(0.0);
      }
    }

    // update moving averages
    this.movingAvgGradients.mult(this.decay);
    this.movingAvgGradients.addScaled(gradients, 1.0 - this.decay);
    const gradientsSquared = gradients.copy();
    gradientsSquared.hadamardProduct(gradientsSquared);
    this.movingAvgSquaredGradients!.mult(this.decay);
    this.movingAvgSquaredGradients!.addScaled(gradientsSquared, 1.0 - this.decay);

    // use them to divide the new velocity
    const denominator = this.movingAvgSquaredGradients!.copy();
    const temp = this.movingAvgGradients.copy();
    temp.hadamardProduct(temp);
    denominator.subtract(temp);
    denominator.add(this.epsilon);
    denominator.sqrt();

    velocity.elementwiseDivision(denominator);

    // add momentum
    if (this.momentum > 0.0 && this.lastVelocity !== null) {
      while (this.lastVelocity.dim() < velocity.dim()) {
        // feature set has grown, so also need to grow the lastVelocity vector
        this.lastVelocity = this.lastVelocity.append(0.0);
      }

      velocity.addScaled(this.lastVelocity, this.momentum);
    }

    params.add(velocity);
    this.lastVelocity = velocity;
  }

  // -------------------------------------------------------------------------

  /**
   * @param lines
   * @return Constructs an RMSProp object from instructions in the given array of lines
   * @java DeepmindRMSProp.fromLines(String[])
   */
  public static fromLines(lines: string[]): DeepmindRMSProp {
    let baseStepSize = 0.005;
    let momentum = 0.9;
    let decay = 0.9;
    let epsilon = 1.0e-8;

    for (const line of lines) {
      const lineParts = line.split(",");

      // -----------------------------------------------------------------------
      // main parts
      // -----------------------------------------------------------------------
      const part0 = lineParts[0]!;
      if (part0.toLowerCase().startsWith("basestepsize=")) {
        baseStepSize = parseFloat(part0.substring("basestepsize=".length));
      } else if (part0.toLowerCase().startsWith("momentum=")) {
        momentum = parseFloat(part0.substring("momentum=".length));
      } else if (part0.toLowerCase().startsWith("decay=")) {
        decay = parseFloat(part0.substring("decay=".length));
      } else if (part0.toLowerCase().startsWith("epsilon=")) {
        epsilon = parseFloat(part0.substring("epsilon=".length));
      }
    }

    return new DeepmindRMSProp(baseStepSize, momentum, decay, epsilon);
  }

  // -------------------------------------------------------------------------

  /**
   * @java DeepmindRMSProp.writeToFile(String)
   */
  public override writeToFile(filepath: string): void {
    // Binary serialization is not available in browser/Node ESM context.
    // Stub implementation.
    console.warn("DeepmindRMSProp.writeToFile: not supported in TS port, filepath=" + filepath);
  }

  // -------------------------------------------------------------------------
}
