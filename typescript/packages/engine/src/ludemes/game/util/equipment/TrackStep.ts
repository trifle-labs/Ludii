// @java Core/src/game/util/equipment/TrackStep.java
//
// Defines a single step within a track. Exactly one of dim, dirn, step
// is non-null, matching Java's @Or constructor semantics.

import { type TrackStepType } from "../../types/board/TrackStepType.js";

export type CompassDirectionName =
  | "N" | "NNE" | "NE" | "ENE" | "E" | "ESE" | "SE" | "SSE"
  | "S" | "SSW" | "SW" | "WSW" | "W" | "WNW" | "NW" | "NNW";

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
  public readonly dirn: CompassDirectionName | null;

  /** Constant value: Off/End/Repeat. @java TrackStep.step */
  public readonly step: TrackStepType | null;

  /**
   * Constructor defining either a number, a direction or a step type.
   * Exactly one parameter must be non-null.
   *
   * @java TrackStep(@Or Integer dim, @Or CompassDirection dirn, @Or TrackStepType step)
   * @param dim  Dim function or integer.
   * @param dirn Compass direction.
   * @param step Track step type: Off/End/Repeat.
   */
  public constructor(
    dim: number | null,
    dirn: CompassDirectionName | null,
    step: TrackStepType | null,
  ) {
    const numNonNull =
      (dim !== null ? 1 : 0) +
      (dirn !== null ? 1 : 0) +
      (step !== null ? 1 : 0);
    if (numNonNull !== 1) {
      throw new Error("TrackStep(): Exactly one parameter must be non-null.");
    }
    this.dim = dim;
    this.dirn = dirn;
    this.step = step;
  }

  /** @java TrackStep.hashCode() */
  public hashCode(): number {
    if (this.dim !== null) return this.dim;
    if (this.dirn !== null) return hashString(this.dirn);
    if (this.step !== null) return hashString(this.step);
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

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  return hash;
}
