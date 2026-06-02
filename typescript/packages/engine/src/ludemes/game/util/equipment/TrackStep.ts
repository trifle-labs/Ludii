// @java Core/src/game/util/equipment/TrackStep.java
//
// Defines a single step within a track. Exactly one of dim, dirn, step
// is non-null — validated at construction. Matches Java's @Or semantics.

import { type CompassDirection } from "../directions/CompassDirection.js";
import { type TrackStepType } from "./TrackStepType.js";

/**
 * Defines a step within a track.
 * Track steps may be a number, a compass direction, or a constant (Off/End/Repeat).
 *
 * @java game.util.equipment.TrackStep
 */
export class TrackStep {
  /** Dim function or integer. @java TrackStep.dim */
  public readonly dim: number | null;

  /** Compass direction. @java TrackStep.dirn */
  public readonly dirn: CompassDirection | null;

  /** Constant value: Off/End/Repeat. @java TrackStep.step */
  public readonly step: TrackStepType | null;

  /**
   * Constructor — exactly one parameter must be non-null.
   * @java TrackStep(@Or Integer dim, @Or CompassDirection dirn, @Or TrackStepType step)
   */
  public constructor(
    dim: number | null,
    dirn: CompassDirection | null,
    step: TrackStepType | null,
  ) {
    const numNonNull = (dim !== null ? 1 : 0) + (dirn !== null ? 1 : 0) + (step !== null ? 1 : 0);
    if (numNonNull !== 1) {
      throw new Error("TrackStep: exactly one parameter must be non-null.");
    }
    this.dim = dim;
    this.dirn = dirn;
    this.step = step;
  }

  /** @java TrackStep.hashCode() */
  public hashCode(): number {
    if (this.dim !== null) return this.dim;
    if (this.dirn !== null) return this.dirn;
    if (this.step !== null) return this.step;
    return 0;
  }

  /** @java TrackStep.equals(Object) */
  public equals(other: TrackStep): boolean {
    return (
      ((this.dim === null && other.dim === null) || this.dim === other.dim) &&
      ((this.dirn === null && other.dirn === null) || this.dirn === other.dirn) &&
      ((this.step === null && other.step === null) || this.step === other.step)
    );
  }

  /** @java TrackStep.toString() */
  public toString(): string {
    return "A TrackStep...";
  }
}
