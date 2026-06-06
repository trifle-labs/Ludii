// @java AI/src/optimisers/AMSGrad.java

/**
 * AMSGrad optimizer, with the original bias corrections from Adam included again.
 *
 * @java optimisers.AMSGrad
 * @author Dennis Soemers
 */

import { FVector } from "../../../Common/src/main/collections/FVector.js";
import { Optimiser } from "./Optimiser.js";

// ---------------------------------------------------------------------------

/**
 * AMSGrad optimizer, with the original bias corrections from Adam included again.
 *
 * @java optimisers.AMSGrad
 */
export class AMSGrad extends Optimiser {

  // -------------------------------------------------------------------------

  /** beta_1 constant */
  protected readonly beta1: number;

  /** beta_2 constant */
  protected readonly beta2: number;

  /** Small constant added to denominator */
  protected readonly epsilon: number;

  /** Moving average of gradients */
  private movingAvgGradients: FVector | null = null;

  /** Moving average of squared gradients */
  private movingAvgSquaredGradients: FVector | null = null;

  /**
   * Vector of maximum values encountered for moving averages of
   * squared gradients
   */
  private maxMovingAvgSquaredGradients: FVector | null = null;

  // -------------------------------------------------------------------------

  /**
   * Constructor
   *
   * @param baseStepSize
   * @java AMSGrad(float)
   */
  public constructor(baseStepSize: number);
  /**
   * Constructor
   *
   * @param baseStepSize
   * @param beta1
   * @param beta2
   * @param epsilon
   * @java AMSGrad(float, float, float, float)
   */
  public constructor(baseStepSize: number, beta1: number, beta2: number, epsilon: number);
  public constructor(
    baseStepSize: number,
    beta1 = 0.9,
    beta2 = 0.999,
    epsilon = 1.0e-8
  ) {
    super(baseStepSize);
    this.beta1 = beta1;
    this.beta2 = beta2;
    this.epsilon = epsilon;
  }

  // -------------------------------------------------------------------------

  /**
   * @java AMSGrad.maximiseObjective(FVector, FVector)
   */
  public override maximiseObjective(params: FVector, gradients: FVector): void {
    if (this.movingAvgGradients === null) {
      // need to initialize vectors for moving averages
      this.movingAvgGradients = new FVector(gradients.dim());
      this.movingAvgSquaredGradients = new FVector(gradients.dim());
      this.maxMovingAvgSquaredGradients = new FVector(gradients.dim());
    } else {
      // may have to grow moving average vectors if feature set grew
      while (this.movingAvgGradients.dim() < gradients.dim()) {
        this.movingAvgGradients = this.movingAvgGradients.append(0.0);
        this.movingAvgSquaredGradients = this.movingAvgSquaredGradients!.append(0.0);
        this.maxMovingAvgSquaredGradients = this.maxMovingAvgSquaredGradients!.append(0.0);
      }
    }

    // update moving averages
    this.movingAvgGradients.mult(this.beta1);
    this.movingAvgGradients.addScaled(gradients, 1.0 - this.beta1);
    const gradientsSquared = gradients.copy();
    gradientsSquared.hadamardProduct(gradientsSquared);
    this.movingAvgSquaredGradients!.mult(this.beta2);
    this.movingAvgSquaredGradients!.addScaled(gradientsSquared, 1.0 - this.beta2);

    this.maxMovingAvgSquaredGradients = FVector.elementwiseMax(
      this.maxMovingAvgSquaredGradients!,
      this.movingAvgSquaredGradients!
    );

    // compute update
    const velocity = this.movingAvgGradients.copy();
    // division by 1 - beta1 is bias correction from Adam
    velocity.mult(this.baseStepSize / (1.0 - this.beta1));
    const denominator = this.maxMovingAvgSquaredGradients.copy();
    // another bias correction from Adam
    denominator.div(1.0 - this.beta2);
    denominator.sqrt();
    denominator.add(this.epsilon);
    velocity.elementwiseDivision(denominator);

    params.add(velocity);
  }

  // -------------------------------------------------------------------------

  /**
   * @param lines
   * @return Constructs an AMSGrad object from instructions in the given array of lines
   * @java AMSGrad.fromLines(String[])
   */
  public static fromLines(lines: string[]): AMSGrad {
    let baseStepSize = 3.0e-4;
    let beta1 = 0.9;
    let beta2 = 0.999;
    let epsilon = 1.0e-8;

    for (const line of lines) {
      const lineParts = line.split(",");

      // -----------------------------------------------------------------------
      // main parts
      // -----------------------------------------------------------------------
      if (lineParts[0]!.toLowerCase().startsWith("basestepsize=")) {
        baseStepSize = parseFloat(lineParts[0]!.substring("basestepsize=".length));
      } else if (lineParts[0]!.toLowerCase().startsWith("beta1=")) {
        beta1 = parseFloat(lineParts[0]!.substring("beta1=".length));
      } else if (lineParts[0]!.toLowerCase().startsWith("beta2=")) {
        beta2 = parseFloat(lineParts[0]!.substring("beta2=".length));
      } else if (lineParts[0]!.toLowerCase().startsWith("epsilon=")) {
        epsilon = parseFloat(lineParts[0]!.substring("epsilon=".length));
      }
    }

    return new AMSGrad(baseStepSize, beta1, beta2, epsilon);
  }

  // -------------------------------------------------------------------------

  /**
   * @java AMSGrad.writeToFile(String)
   */
  public override writeToFile(filepath: string): void {
    // Binary serialization is not available in browser/Node ESM context.
    // Stub implementation.
    console.warn("AMSGrad.writeToFile: not supported in TS port, filepath=" + filepath);
  }

  // -------------------------------------------------------------------------
}
