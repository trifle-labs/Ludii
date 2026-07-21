// @java Core/src/other/trial/MatchTrial.java MatchTrial
/**
 * Faithful 1:1 transliteration of other.trial.MatchTrial.
 *
 * Records a complete multi-game match as a list of per-instance Trials.
 *
 * Java parity: other/trial/MatchTrial.java
 */

import { Trial } from "./Trial.js";

export class MatchTrial {

  // @java protected final List<Trial> trials = new ArrayList<Trial>();
  protected readonly _trials: Trial[] = [];

  // -------------------------------------------------------------------------

  /**
   * @java public MatchTrial(final Trial trial)
   */
  constructor(trial: Trial) {
    this._trials.push(trial);
  }

  // -------------------------------------------------------------------------

  /** @java public List<Trial> trials() */
  trials(): Trial[] { return this._trials; }

  // -------------------------------------------------------------------------

  /** @java public void clear() */
  clear(): void { this._trials.length = 0; }

  // -------------------------------------------------------------------------

  /**
   * @java public Trial currentTrial()
   * @return Current episode being played, or null if empty.
   */
  currentTrial(): Trial | null {
    return this._trials.length === 0 ? null : (this._trials[this._trials.length - 1] ?? null);
  }
}
