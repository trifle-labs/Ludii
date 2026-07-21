// @java Core/src/other/context/TempContext.java TempContext
/**
 * Faithful 1:1 transliteration of other.context.TempContext.
 *
 * A temporary context that uses copy-on-write state and an invalidatable
 * move-sequence trial, intended only for short-lived search copies.
 *
 * Deferrals:
 *  - CopyOnWriteState: not ported; copyState() falls back to sharing the
 *    same state reference (matching "allowed to be invalidated" semantics).
 *  - TempTrial: not ported; copyTrial() also shares the reference.
 *
 * Java parity: other/context/TempContext.java
 */

import { Context, type IState, type ITrial } from "./Context.js";

export class TempContext extends Context {

  /**
   * @java public TempContext(final Context other)
   */
  constructor(other: Context) {
    // Delegate to the base copy-constructor path, then let _assignCopyFields
    // overwrite with the shared-reference versions.
    super(other.game(), other.trial(), other.rng(), other.parentContext());
    Context._assignCopyFields(this, other);
  }

  /**
   * @java protected State copyState(final State otherState)
   * In Java returns a CopyOnWriteState. Deferred: CopyOnWriteState not ported.
   * Shares the reference instead (valid for temp/short-lived use).
   */
  protected override copyState(otherState: IState | null): IState | null {
    // DEFERRED: CopyOnWriteState not ported
    return otherState;
  }

  /**
   * @java protected Trial copyTrial(final Trial otherTrial)
   * In Java returns a TempTrial (invalidatable MoveSequence). Deferred.
   * Shares the reference instead.
   */
  protected override copyTrial(otherTrial: ITrial): ITrial {
    // DEFERRED: TempTrial not ported
    return otherTrial;
  }
}
