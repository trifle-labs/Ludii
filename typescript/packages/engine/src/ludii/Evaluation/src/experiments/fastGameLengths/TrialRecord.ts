// @java Evaluation/src/experiments/fastGameLengths/TrialRecord.java

/**
 * Record of a trial result for evaluation experiments.
 *
 * @java experiments/fastGameLengths/TrialRecord.java
 * @author cambolbro
 */

/** Minimal escape-hatch for not-yet-ported Trial */
type Trial = unknown;

//-----------------------------------------------------------------------------

/**
 * Record of a trial result for evaluation experiments.
 *
 * @java experiments/fastGameLengths/TrialRecord.java
 */
export class TrialRecord {

  /** @java TrialRecord.starter */
  private readonly _starter: number;

  /** @java TrialRecord.trial */
  private readonly _trial: Trial;

  //-------------------------------------------------------------------------

  /**
   * @java TrialRecord(int, Trial)
   */
  public constructor(starter: number, trial: Trial) {
    this._starter = starter;
    this._trial = trial;
  }

  //-------------------------------------------------------------------------

  /** @java TrialRecord.starter() */
  public starter(): number {
    return this._starter;
  }

  /** @java TrialRecord.trial() */
  public trial(): Trial {
    return this._trial;
  }

  //-------------------------------------------------------------------------
}
