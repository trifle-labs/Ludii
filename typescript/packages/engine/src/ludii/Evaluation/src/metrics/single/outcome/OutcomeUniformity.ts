// @java Evaluation/src/metrics/single/outcome/OutcomeUniformity.java

/**
 * Inverse of the per-player variance in outcomes over all trials, averaged over all players.
 *
 * @java metrics/single/outcome/OutcomeUniformity.java
 * @author Dennis Soemers
 */

import { Metric } from "../../Metric.js";
import { Stats } from "../../../../../Common/src/main/math/statistics/Stats.js";
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

/** @java other/concept/Concept.OutcomeUniformity */
const ConceptOutcomeUniformity: Concept = "OutcomeUniformity" as unknown as Concept;

//-----------------------------------------------------------------------------
// Escape-hatch stubs for metrics.Utils (not yet ported)
//-----------------------------------------------------------------------------

function utils_setupTrialContext(_game: Game, _rngState: RandomProviderState, _trial: Trial): Context {
  return null as unknown as Context;
}

//-----------------------------------------------------------------------------

/**
 * Inverse of the per-player variance in outcomes over all trials, averaged over all players.
 *
 * @java metrics/single/outcome/OutcomeUniformity.java
 */
export class OutcomeUniformity extends Metric {

  //-------------------------------------------------------------------------

  /** For incremental computation. @java OutcomeUniformity.playerStats */
  protected playerStats: (Stats | null)[] | null = null;

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java OutcomeUniformity()
   */
  public constructor() {
    super(
      "OutcomeUniformity",
      "Inverse of the per-player variance in outcomes over all trials, averaged over all players.",
      0.0,
      1.0,
      ConceptOutcomeUniformity,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java OutcomeUniformity.apply(Game, Evaluation, Trial[], RandomProviderState[])
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

    if (numPlayers < 1)
      return null;

    const playerStats: Stats[] = new Array(numPlayers + 1);
    for (let p = 1; p <= numPlayers; ++p) {
      playerStats[p] = new Stats();
    }

    for (let i = 0; i < trials.length; ++i) {
      const trial = trials[i];
      const rng = randomProviderStates[i];
      const context: Context = utils_setupTrialContext(game, rng, trial);

      const utils = RankUtils.agentUtilities(context as Parameters<typeof RankUtils.agentUtilities>[0]);

      for (let p = 1; p <= numPlayers; ++p) {
        playerStats[p]!.addSample(utils[p] ?? 0);
      }
    }

    let accum = 0.0;
    for (let p = 1; p <= numPlayers; ++p) {
      playerStats[p]!.measure();
      accum += playerStats[p]!.varnValue();
    }

    return 1.0 - (accum / numPlayers);
  }

  //-------------------------------------------------------------------------

  /**
   * @java OutcomeUniformity.startNewTrial(Context, Trial)
   */
  public startNewTrial(_context: Context, _fullTrial: Trial): void {
    // Do nothing
  }

  /**
   * @java OutcomeUniformity.observeNextState(Context)
   */
  public observeNextState(_context: Context): void {
    // Do nothing
  }

  /**
   * @java OutcomeUniformity.observeFinalState(Context)
   */
  public observeFinalState(context: Context): void {
    if (this.playerStats === null) {
      const ctx = context as unknown as {
        game(): { players(): { count(): number } };
      };
      const numPlayers = ctx.game().players().count();
      this.playerStats = new Array(numPlayers + 1).fill(null);
      for (let p = 1; p <= numPlayers; ++p) {
        this.playerStats[p] = new Stats();
      }
    }

    const utils = RankUtils.agentUtilities(context as Parameters<typeof RankUtils.agentUtilities>[0]);

    for (let p = 1; p < this.playerStats.length; ++p) {
      this.playerStats[p]!.addSample(utils[p] ?? 0);
    }
  }

  /**
   * @java OutcomeUniformity.finaliseMetric(Game, int)
   */
  public finaliseMetric(game: Game, _numTrials: number): number {
    const g = game as unknown as {
      players(): { count(): number };
    };
    const numPlayers = g.players().count();
    let accum = 0.0;
    for (let p = 1; p <= numPlayers; ++p) {
      this.playerStats![p]!.measure();
      accum += this.playerStats![p]!.varnValue();
    }

    return 1.0 - (accum / numPlayers);
  }

  //-------------------------------------------------------------------------
}
