// @java Evaluation/src/metrics/single/outcome/Balance.java

/**
 * Similarity between player win-rates. Draws and multi-player results calculated as partial wins.
 *
 * @java metrics/single/outcome/Balance.java
 * @author cambolbro and matthew.stephenson
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

/** @java other/concept/Concept.Balance */
const ConceptBalance: Concept = "Balance" as unknown as Concept;

//-----------------------------------------------------------------------------
// Escape-hatch stubs for metrics.Utils (not yet ported)
//-----------------------------------------------------------------------------

function utils_setupTrialContext(_game: Game, _rngState: RandomProviderState, _trial: Trial): Context {
  return null as unknown as Context;
}

//-----------------------------------------------------------------------------

/**
 * Similarity between player win-rates. Draws and multi-player results calculated as partial wins.
 *
 * @java metrics/single/outcome/Balance.java
 */
export class Balance extends Metric {

  //-------------------------------------------------------------------------

  /** For incremental computation. @java Balance.wins */
  protected wins: number[] | null = null;

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java Balance()
   */
  public constructor() {
    super(
      "Balance",
      "Similarity between player win-rates. Draws and multi-player results calculated as partial wins.",
      0.0,
      1.0,
      ConceptBalance,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java Balance.apply(Game, Evaluation, Trial[], RandomProviderState[])
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

    // Count number of wins per player
    const wins: number[] = new Array(numPlayers + 1).fill(0);
    for (let i = 0; i < trials.length; i++) {
      const trial = trials[i];
      const rng = randomProviderStates[i];
      const context: Context = utils_setupTrialContext(game, rng, trial);

      const agentUtils = RankUtils.agentUtilities(context as Parameters<typeof RankUtils.agentUtilities>[0]);

      for (let p = 1; p <= numPlayers; p++)
        wins[p] = (wins[p] ?? 0) + ((agentUtils[p] ?? 0) + 1.0) / 2.0;
    }

    // Get mean win rate over all players
    const rate: number[] = new Array(numPlayers + 1).fill(0);
    for (let p = 1; p <= numPlayers; p++)
      rate[p] = wins[p]! / trials.length;

    // Find maximum discrepancy
    let maxDisc = 0.0;
    for (let pa = 1; pa <= numPlayers; pa++) {
      for (let pb = pa + 1; pb <= numPlayers; pb++) {
        const disc = Math.abs(rate[pa]! - rate[pb]!);
        if (disc > maxDisc)
          maxDisc = disc;
      }
    }

    return 1.0 - maxDisc;
  }

  //-------------------------------------------------------------------------

  /**
   * @java Balance.startNewTrial(Context, Trial)
   */
  public startNewTrial(_context: Context, _fullTrial: Trial): void {
    // Do nothing
  }

  /**
   * @java Balance.observeNextState(Context)
   */
  public observeNextState(_context: Context): void {
    // Do nothing
  }

  /**
   * @java Balance.observeFinalState(Context)
   */
  public observeFinalState(context: Context): void {
    if (this.wins === null) {
      const ctx = context as unknown as {
        game(): { players(): { count(): number } };
      };
      this.wins = new Array(ctx.game().players().count() + 1).fill(0);
    }

    const agentUtils = RankUtils.agentUtilities(context as Parameters<typeof RankUtils.agentUtilities>[0]);

    for (let p = 1; p < this.wins.length; p++)
      this.wins[p] = (this.wins[p] ?? 0) + ((agentUtils[p] ?? 0) + 1.0) / 2.0;
  }

  /**
   * @java Balance.finaliseMetric(Game, int)
   */
  public finaliseMetric(game: Game, numTrials: number): number {
    // Get mean win rate over all players
    const g = game as unknown as {
      players(): { count(): number };
    };
    const numPlayers = g.players().count();
    const rate: number[] = new Array(numPlayers + 1).fill(0);
    for (let p = 1; p <= numPlayers; p++)
      rate[p] = this.wins![p]! / numTrials;

    // Find maximum discrepancy
    let maxDisc = 0.0;
    for (let pa = 1; pa <= numPlayers; pa++) {
      for (let pb = pa + 1; pb <= numPlayers; pb++) {
        const disc = Math.abs(rate[pa]! - rate[pb]!);
        if (disc > maxDisc)
          maxDisc = disc;
      }
    }

    return 1.0 - maxDisc;
  }

  //-------------------------------------------------------------------------
}
