// @java Evaluation/src/metrics/designer/IdealDuration.java

/**
 * Average number or turns in a game, based on an ideal range.
 *
 * @java metrics/designer/IdealDuration.java
 * @author matthew.stephenson
 */

import { Metric } from "../Metric.js";

/** Minimal escape-hatch for not-yet-ported Game */
type Game = unknown;

/** Minimal escape-hatch for not-yet-ported Trial */
interface Trial {
  numTurns(): number;
}

/** Minimal escape-hatch for not-yet-ported Context */
type Context = unknown;

/** Minimal escape-hatch for not-yet-ported RandomProviderState */
type RandomProviderState = unknown;

/** Minimal escape-hatch for not-yet-ported Evaluation */
type Evaluation = unknown;

//-----------------------------------------------------------------------------

/**
 * Average number or turns in a game, based on an ideal range.
 *
 * @java metrics/designer/IdealDuration.java
 */
export class IdealDuration extends Metric {

  /** @java IdealDuration.minTurn */
  private minTurn: number = 0;

  /** @java IdealDuration.maxTurn */
  private maxTurn: number = 1000;

  //-------------------------------------------------------------------------

  /**
   * @java IdealDuration()
   */
  public constructor() {
    super(
      "Ideal Duration",
      "Average number or turns in a game, based on an ideal range.",
      0.0,
      1.0,
      null,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java IdealDuration.apply(Game, Evaluation, Trial[], RandomProviderState[])
   *
   * Scoring:
   *
   * 1-      +-------+__
   *        /|       |  \__
   *       / |       |     \__
   *      /  |       |        \__
   *     /   |       |           \__
   * 0- +----+-------+--------------+---
   *    0   Min     Max           2*Max
   */
  public override apply(
    _game: Game,
    _evaluation: Evaluation,
    trials: Trial[],
    _randomProviderStates: RandomProviderState[],
  ): number | null {
    let tally = 0;
    for (const trial of trials) {
      const numTurns = trial.numTurns();
      let score = 1;

      if (numTurns < this.minTurn) {
        score = numTurns / this.minTurn;
      } else if (numTurns > this.maxTurn) {
        score = 1 - Math.min(1, (numTurns - this.maxTurn) / this.maxTurn);
      }

      tally += score;
    }

    return tally / trials.length;
  }

  //-------------------------------------------------------------------------

  /** @java IdealDuration.setMinTurn(double) */
  public setMinTurn(minTurn: number): void {
    this.minTurn = minTurn;
  }

  /** @java IdealDuration.setMaxTurn(double) */
  public setMaxTurn(maxTurn: number): void {
    this.maxTurn = maxTurn;
  }

  //-------------------------------------------------------------------------

  /** @java IdealDuration.startNewTrial(Context, Trial) */
  public override startNewTrial(_context: Context, _fullTrial: unknown): void {
    console.error("Incrementally computing metric not yet implemented for IdealDuration.");
  }

  /** @java IdealDuration.observeNextState(Context) */
  public override observeNextState(_context: Context): void {
    console.error("Incrementally computing metric not yet implemented for IdealDuration.");
  }

  /** @java IdealDuration.observeFinalState(Context) */
  public override observeFinalState(_context: Context): void {
    console.error("Incrementally computing metric not yet implemented for IdealDuration.");
  }

  /** @java IdealDuration.finaliseMetric(Game, int) */
  public override finaliseMetric(_game: Game, _numTrials: number): number {
    console.error("Incrementally computing metric not yet implemented for IdealDuration.");
    return NaN;
  }

  //-------------------------------------------------------------------------
}
