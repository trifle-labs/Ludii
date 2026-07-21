// @java AI/src/optimisers/SGD.java

/**
 * A standard Stochastic Gradient Descent optimiser, with optional support
 * for a simple momentum term.
 *
 * @java optimisers.SGD
 * @author Dennis Soemers
 */

import { FVector } from "../../../Common/src/main/collections/FVector.js";
import { Optimiser } from "./Optimiser.js";

// ---------------------------------------------------------------------------

/**
 * A standard Stochastic Gradient Descent optimiser, with optional support
 * for a simple momentum term.
 *
 * @java optimisers.SGD
 */
export class SGD extends Optimiser {

  // -------------------------------------------------------------------------

  /**
   * Momentum term.
   * "Velocity" of previous update is scaled by this value and added to
   * subsequent update.
   */
  protected readonly momentum: number;

  /**
   * Last "velocity" vector. Used for momentum.
   */
  private lastVelocity: FVector | null = null;

  // -------------------------------------------------------------------------

  /**
   * Constructor
   *
   * @param baseStepSize
   * @java SGD(float)
   */
  public constructor(baseStepSize: number);
  /**
   * Constructor with momentum
   *
   * @param baseStepSize
   * @param momentum
   * @java SGD(float, float)
   */
  public constructor(baseStepSize: number, momentum: number);
  public constructor(baseStepSize: number, momentum = 0.0) {
    super(baseStepSize);
    this.momentum = momentum;
  }

  // -------------------------------------------------------------------------

  /**
   * @java SGD.maximiseObjective(FVector, FVector)
   */
  public override maximiseObjective(params: FVector, gradients: FVector): void {
    const velocity = gradients.copy();
    velocity.mult(this.baseStepSize);

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
   * @return Constructs an SGD object from instructions in the given array of lines
   * @java SGD.fromLines(String[])
   */
  public static fromLines(lines: string[]): SGD {
    let baseStepSize = 0.05;
    let momentum = 0.0;

    for (const line of lines) {
      const lineParts = line.split(",");

      // -----------------------------------------------------------------------
      // main parts
      // -----------------------------------------------------------------------
      if (lineParts[0]!.toLowerCase().startsWith("basestepsize=")) {
        baseStepSize = parseFloat(lineParts[0]!.substring("basestepsize=".length));
      } else if (lineParts[0]!.toLowerCase().startsWith("momentum=")) {
        momentum = parseFloat(lineParts[0]!.substring("momentum=".length));
      }
    }

    return new SGD(baseStepSize, momentum);
  }

  // -------------------------------------------------------------------------

  /**
   * @java SGD.writeToFile(String)
   */
  public override writeToFile(filepath: string): void {
    // Binary serialization is not available in browser/Node ESM context.
    // Stub implementation.
    console.warn("SGD.writeToFile: not supported in TS port, filepath=" + filepath);
  }

  // -------------------------------------------------------------------------
}
