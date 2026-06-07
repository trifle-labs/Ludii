// @java Core/src/game/util/equipment/TrackStep.java
//
// Defines a single step within a track. Exactly one of dim, dirn, step
// is non-null — validated at construction. Matches Java's @Or semantics.

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
   * Constructor — exactly one parameter must be non-null.
   * @java TrackStep(@Or Integer dim, @Or CompassDirection dirn, @Or TrackStepType step)
   */
  public constructor(
    dim: number | null | undefined,
    dirn: CompassDirectionName | null | undefined,
    step: TrackStepType | null | undefined,
  ) {
    const dimOrNull = dim ?? null;
    const dirnOrNull = dirn ?? null;
    const stepOrNull = step ?? null;
    const numNonNull =
      (dimOrNull !== null ? 1 : 0) +
      (dirnOrNull !== null ? 1 : 0) +
      (stepOrNull !== null ? 1 : 0);
    if (numNonNull !== 1) {
      throw new Error("TrackStep: exactly one parameter must be non-null.");
    }
    this.dim = dimOrNull;
    this.dirn = dirnOrNull;
    this.step = stepOrNull;
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
