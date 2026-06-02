/**
 * TrackStep1to1.ts
 * @java game/util/equipment/TrackStep.java
 *
 * Defines a step within a track.
 * Track steps may be specified by number, compass direction or constant attribute
 * (End/Off/Repeat).
 *
 * This is a data class — no eval(ctx).
 */

/**
 * Compass direction names (mirrors Java's CompassDirection enum).
 * @java game/util/directions/CompassDirection.java
 */
export type CompassDirection1to1 =
  | "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW"
  | "NNE" | "ENE" | "ESE" | "SSE" | "SSW" | "WSW" | "WNW" | "NNW";

/**
 * Track step type constants (mirrors Java's TrackStepType enum).
 * @java game/types/board/TrackStepType.java
 */
export type TrackStepType1to1 = "Off" | "End" | "Repeat";

/**
 * Defines a step within a track.
 * @java game/util/equipment/TrackStep.java
 * @remarks Track steps may be specified by number, dim function, compass direction
 *          or constant attribute (End/Off/Repeat).
 */
export class TrackStep1to1 {
  /** @java TrackStep.dim — dim function or integer. */
  private readonly dim: number | null;

  /** @java TrackStep.dirn — compass direction. */
  private readonly dirn: CompassDirection1to1 | null;

  /** @java TrackStep.step — constant value: Off/End/Repeat. */
  private readonly step: TrackStepType1to1 | null;

  /**
   * @java game/util/equipment/TrackStep.java — constructor
   * Exactly one of dim, dirn, step must be non-null (Java asserts this).
   */
  public constructor(opts: {
    dim?: number | null;
    dirn?: CompassDirection1to1 | null;
    step?: TrackStepType1to1 | null;
  }) {
    this.dim = opts.dim ?? null;
    this.dirn = opts.dirn ?? null;
    this.step = opts.step ?? null;
  }

  /** @java TrackStep.dim() — integer value or dim function. */
  public getDim(): number | null {
    return this.dim;
  }

  /** @java TrackStep.dirn() — compass direction. */
  public getDirn(): CompassDirection1to1 | null {
    return this.dirn;
  }

  /** @java TrackStep.step() — track step type: Off/End/Repeat. */
  public getStep(): TrackStepType1to1 | null {
    return this.step;
  }
}
