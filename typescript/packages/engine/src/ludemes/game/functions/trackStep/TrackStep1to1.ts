/**
 * TrackStep1to1.ts
 * @java game/functions/trackStep/TrackStep.java
 * @java game/functions/trackStep/TrackStepFunction.java
 * @java game/functions/trackStep/BaseTrackStepFunction.java
 *
 * Faithful 1:1 port of Java TrackStep / TrackStepFunction.
 *
 * A track step entry holds exactly one of:
 *  - a DimFunction (dim, i.e. a static integer) — represents an integer step count
 *  - a CompassDirection string — represents a directional step
 *  - a TrackStepType ("Off" | "End" | "Repeat") — represents a special step
 *
 * Java's TrackStep.eval(context) returns itself (precomputed or this).
 * In TS we mirror that: eval() returns the same TrackStep1to1 instance.
 *
 * NOT registered in any 1:1 registry — wired structurally by callers.
 */

import type { Context } from "../../../../context.js";
import type { EvalScratch } from "../../../base.js";
import type { DimFunction1to1 } from "../dim/DimConstant1to1.js";
import type { TrackStepType } from "../../types/board/TrackStepType.js";
import { CompassDirection } from "../../util/directions/CompassDirection.js";

/**
 * Interface mirroring Java's TrackStepFunction.
 * @java game/functions/trackStep/TrackStepFunction.java
 */
export interface TrackStepFunction1to1 {
  eval(ctx: Context & EvalScratch): TrackStep1to1;
  readonly dim: DimFunction1to1 | null;
  readonly dirn: CompassDirection | null;
  readonly step: TrackStepType | null;
}

/**
 * Returns a track step entry.
 * @java game/functions/trackStep/TrackStep.java
 */
export class TrackStep1to1 implements TrackStepFunction1to1 {
  public readonly dim: DimFunction1to1 | null;
  public readonly dirn: CompassDirection | null;
  public readonly step: TrackStepType | null;

  /**
   * @java game/functions/trackStep/TrackStep.java — constructor(@Or dim, @Or dirn, @Or step)
   * Exactly one of the three parameters must be non-null.
   */
  constructor(
    dim: DimFunction1to1 | null,
    dirn: CompassDirection | null,
    step: TrackStepType | null,
  ) {
    const numNonNull = (dim != null ? 1 : 0) + (dirn != null ? 1 : 0) + (step != null ? 1 : 0);
    if (numNonNull !== 1) {
      throw new Error("TrackStep1to1: exactly one parameter must be non-null.");
    }
    this.dim  = dim;
    this.dirn = dirn;
    this.step = step;
  }

  /** @java game/functions/trackStep/TrackStep.java — eval(Context) returns this */
  public eval(_ctx: Context & EvalScratch): TrackStep1to1 {
    return this;
  }

  public toString(): string {
    let str = "[";
    if (this.dim  != null) str += String(this.dim.eval());
    if (this.dirn != null) str += CompassDirection[this.dirn];
    if (this.step != null) str += this.step;
    str += "]";
    return str;
  }
}
