// @java Evaluation/src/metrics/single/outcome/Drawishness.java

/**
 * Percentage of games which end in a draw (not including timeouts).
 *
 * @java metrics/single/outcome/Drawishness.java
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

/** @java other/concept/Concept.Drawishness */
const ConceptDrawishness: Concept = "Drawishness" as unknown as Concept;

//-----------------------------------------------------------------------------
// Escape-hatch stubs for metrics.Utils (not yet ported)
//-----------------------------------------------------------------------------

function utils_setupTrialContext(_game: Game, _rngState: RandomProviderState, _trial: Trial): Context {
  return null as unknown as Context;
}

//-----------------------------------------------------------------------------

/**
 * Percentage of games which end in a draw (not including timeouts).
 *
 * @java metrics/single/outcome/Drawishness.java
 */
export class Drawishness extends Metric {

  //-------------------------------------------------------------------------

  /** For incremental computation. @java Drawishness.naturalDraws */
  protected naturalDraws: number = 0.0;

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java Drawishness()
   */
  public constructor() {
    super(
      "Drawishness",
      "Percentage of games which end in a draw (not including timeouts).",
      0.0,
      1.0,
      ConceptDrawishness,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java Drawishness.apply(Game, Evaluation, Trial[], RandomProviderState[])
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

    const numPlayers = g.players().count();
    if (numPlayers <= 1)
      return null;

    // Count number of draws
    let naturalDraws = 0.0;
    for (let i = 0; i < trials.length; i++) {
      const trial = trials[i];
      const rng = randomProviderStates[i];
      const context: Context = utils_setupTrialContext(game, rng, trial);

      const agentUtils = RankUtils.agentUtilities(context as Parameters<typeof RankUtils.agentUtilities>[0]);

      // No players have won/lost.
      let allRankingZero = true;
      for (let j = 1; j < agentUtils.length; j++) {
        if (agentUtils[j] !== 0.0) {
          allRankingZero = false;
          break;
        }
      }

      if (allRankingZero)
        naturalDraws++;
    }

    return naturalDraws / trials.length;
  }

  //-------------------------------------------------------------------------

  /**
   * @java Drawishness.startNewTrial(Context, Trial)
   */
  public startNewTrial(_context: Context, _fullTrial: Trial): void {
    // Do nothing
  }

  /**
   * @java Drawishness.observeNextState(Context)
   */
  public observeNextState(_context: Context): void {
    // Do nothing
  }

  /**
   * @java Drawishness.observeFinalState(Context)
   */
  public observeFinalState(context: Context): void {
    const agentUtils = RankUtils.agentUtilities(context as Parameters<typeof RankUtils.agentUtilities>[0]);

    let allRankingZero = true;
    for (let j = 1; j < agentUtils.length; j++) {
      if (agentUtils[j] !== 0.0) {
        allRankingZero = false;
        break;
      }
    }

    if (allRankingZero)
      this.naturalDraws++;
  }

  /**
   * @java Drawishness.finaliseMetric(Game, int)
   */
  public finaliseMetric(_game: Game, numTrials: number): number {
    return this.naturalDraws / numTrials;
  }

  //-------------------------------------------------------------------------
}
