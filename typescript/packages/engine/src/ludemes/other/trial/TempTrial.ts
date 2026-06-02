// @java Core/src/other/trial/TempTrial.java TempTrial
/**
 * Faithful 1:1 transliteration of other.trial.TempTrial.
 *
 * A temporary Trial whose MoveSequence is allowed to be invalidated
 * (shared/aliased rather than deep-copied). Intended only for short-lived
 * search copies.
 *
 * Java parity: other/trial/TempTrial.java
 */

import { Trial } from "./Trial.js";
import type { IMove } from "../context/Context.js";

export class TempTrial extends Trial {

  /**
   * @java public TempTrial(final Trial other)
   */
  constructor(other: Trial) {
    super(other);
  }

  /**
   * @java protected MoveSequence copyMoveSequence(final MoveSequence otherSequence)
   *
   * In Java, this returns `new MoveSequence(otherSequence, true)` where the
   * second argument signals that the sequence may be invalidated.  In TS we
   * share the same array reference instead of copying it, which matches the
   * "allowed to be invalidated" semantics.
   */
  protected override copyMoveSequence(other: IMove[]): IMove[] {
    return other; // intentional shared reference (TempTrial semantics)
  }
}
