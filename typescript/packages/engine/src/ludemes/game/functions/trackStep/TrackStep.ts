// @java Core/src/game/functions/trackStep/TrackStep.java

import type { Context } from "../../../../context.js";
import type { DimFunction } from "../dim/DimFunction.js";
import { CompassDirection } from "../../util/directions/CompassDirection.js";
import type { TrackStepType } from "../../types/board/TrackStepType.js";

/**
 * Returns a track step entry.
 *
 * Java parity: final class extending BaseTrackStepFunction.
 * eval(context) returns itself (or the precomputed track step).
 * Stores exactly one of: a DimFunction, a CompassDirection, or a TrackStepType.
 *
 * @java game.functions.trackStep.TrackStep
 * @author cambolbro
 */
export class TrackStep {
  /** Dim function (includes positive integers). @java BaseTrackStepFunction.dim */
  public readonly dim: DimFunction | null;

  /** Compass direction. @java BaseTrackStepFunction.dirn */
  public readonly dirn: CompassDirection | null;

  /** Constant value: Off/End/Repeat. @java BaseTrackStepFunction.step */
  public readonly step: TrackStepType | null;

  /** Precompute once and cache if possible. @java BaseTrackStepFunction.precomputedTrackStep */
  protected precomputedTrackStep: TrackStep | null = null;

  /**
   * Constructor defining either a number, a direction or a step type.
   * Exactly one of the three parameters must be non-null.
   *
   * @java TrackStep(@Or DimFunction dim, @Or CompassDirection dirn, @Or TrackStepType step)
   * @param dim  Dim function or integer.
   * @param dirn Compass direction.
   * @param step Track step type: Off/End/Repeat.
   */
  public constructor(
    dim: DimFunction | null,
    dirn: CompassDirection | null,
    step: TrackStepType | null,
  ) {
    this.dim  = dim;
    this.dirn = dirn;
    this.step = step;

    let numNonNull = 0;
    if (dim != null)  numNonNull++;
    if (dirn != null) numNonNull++;
    if (step != null) numNonNull++;

    if (numNonNull !== 1) {
      throw new Error("TrackStep(): Exactly one parameter must be non-null.");
    }
  }

  /**
   * @java TrackStep.eval(Context)
   *
   * Returns the precomputed track step if available, otherwise this.
   */
  public eval(_context: Context): TrackStep {
    if (this.precomputedTrackStep !== null)
      return this.precomputedTrackStep;

    return this;
  }

  /**
   * @java TrackStep.isStatic()
   */
  public isStatic(): boolean {
    return (
      (this.dim != null && ((this.dim as { isStatic?(): boolean }).isStatic?.() ?? true))
      ||
      this.dirn != null   // always static
      ||
      this.step != null   // always static
    );
  }

  /**
   * @java TrackStep.gameFlags(Game)
   */
  public gameFlags(game: unknown): number {
    let flags = 0;

    if (this.dim != null)
      flags |= ((this.dim as { gameFlags?(g: unknown): number }).gameFlags?.(game) ?? 0);

    // TODO: dirn and step gameFlags not yet implemented in Java (commented out)

    return flags;
  }

  /**
   * @java TrackStep.concepts(Game)
   */
  public concepts(_game: unknown): Set<number> {
    const concepts = new Set<number>();

    // TODO: all commented out in Java source

    return concepts;
  }

  /**
   * @java TrackStep.missingRequirement(Game)
   */
  public missingRequirement(_game: unknown): boolean {
    let missingRequirement = false;

    // TODO: all commented out in Java source

    return missingRequirement;
  }

  /**
   * @java TrackStep.willCrash(Game)
   */
  public willCrash(_game: unknown): boolean {
    let willCrash = false;

    // TODO: all commented out in Java source

    return willCrash;
  }

  /**
   * @java TrackStep.preprocess(Game)
   */
  public preprocess(game: unknown): void {
    if (this.dim != null)
      (this.dim as { preprocess?(g: unknown): void }).preprocess?.(game);

    // TODO: dirn and step preprocess not yet implemented in Java (commented out)

    if (this.isStatic())
      this.precomputedTrackStep = this.eval(null as unknown as Context);
  }

  /**
   * @java TrackStep.toString()
   */
  public toString(): string {
    let str = "[";

    if (this.dim  != null) str += this.dim.toString?.() ?? "";
    if (this.dirn != null) str += CompassDirection[this.dirn];
    if (this.step != null) str += this.step;

    str += "]";
    return str;
  }
}
