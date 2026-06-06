// @java Evaluation/src/metrics/single/outcome/AdvantageP1.java

/**
 * Percentage of games where player 1 won. Draws and multi-player results calculated as partial wins.
 *
 * @java metrics/single/outcome/AdvantageP1.java
 * @author matthew.stephenson
 */

import { Metric } from "../../Metric.js";
import { RankUtils } from "../../../../../../ludemes/other/RankUtils.js";

/** Minimal opaque type for not-yet-ported Game */
type Game = unknown;

/** Minimal opaque type for not-yet-ported Evaluation */
type Evaluation = unknown;

/** Minimal opaque type for not-yet-ported Trial */
type Trial = unknown;

/** Minimal opaque type for not-yet-ported RandomProviderState */
type RandomProviderState = unknown;

/** Minimal opaque type for not-yet-ported Context */
type Context = unknown;

/** Minimal opaque type for not-yet-ported Concept */
type Concept = unknown;

/** @java other/concept/Concept.AdvantageP1 */
const ConceptAdvantageP1: Concept = "AdvantageP1" as unknown as Concept;

//-----------------------------------------------------------------------------
// Escape-hatch stubs for metrics.Utils (not yet ported)
//-----------------------------------------------------------------------------

function utils_setupTrialContext(_game: Game, _rngState: RandomProviderState, _trial: Trial): Context {
  return null as unknown as Context;
}

//-----------------------------------------------------------------------------

/**
 * Percentage of games where player 1 won. Draws and multi-player results calculated as partial wins.
 *
 * @java metrics/single/outcome/AdvantageP1.java
 */
export class AdvantageP1 extends Metric {

  //-------------------------------------------------------------------------

  /** For incremental computation. @java AdvantageP1.p1Wins */
  protected p1Wins: number = 0.0;

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java AdvantageP1()
   */
  public constructor() {
    super(
      "AdvantageP1",
      "Percentage of games where player 1 won. Draws and multi-player results calculated as partial wins.",
      0.0,
      1.0,
      ConceptAdvantageP1,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java AdvantageP1.apply(Game, Evaluation, Trial[], RandomProviderState[])
   */
  public apply(
    game: Game,
    _evaluation: Evaluation,
    trials: Trial[],
    randomProviderStates: RandomProviderState[],
  ): number | null {
    const g = game as unknown as {
      players(): { count(): number };
    };

    if (g.players().count() <= 1)
      return null;

    let p1Wins = 0.0;

    for (let i = 0; i < trials.length; i++) {
      const trial = trials[i];
      const rng = randomProviderStates[i];
      const context: Context = utils_setupTrialContext(game, rng, trial);
      p1Wins += (RankUtils.agentUtilities(context as Parameters<typeof RankUtils.agentUtilities>[0])[1]! + 1.0) / 2.0;
    }

    return p1Wins / trials.length;
  }

  //-------------------------------------------------------------------------

  /**
   * @java AdvantageP1.startNewTrial(Context, Trial)
   */
  public startNewTrial(_context: Context, _fullTrial: Trial): void {
    // Do nothing
  }

  /**
   * @java AdvantageP1.observeNextState(Context)
   */
  public observeNextState(_context: Context): void {
    // Do nothing
  }

  /**
   * @java AdvantageP1.observeFinalState(Context)
   */
  public observeFinalState(context: Context): void {
    this.p1Wins += (RankUtils.agentUtilities(context as Parameters<typeof RankUtils.agentUtilities>[0])[1]! + 1.0) / 2.0;
  }

  /**
   * @java AdvantageP1.finaliseMetric(Game, int)
   */
  public finaliseMetric(_game: Game, numTrials: number): number {
    return this.p1Wins / numTrials;
  }

  //-------------------------------------------------------------------------
}
