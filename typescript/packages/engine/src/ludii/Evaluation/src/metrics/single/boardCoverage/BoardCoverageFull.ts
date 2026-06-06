// @java Evaluation/src/metrics/single/boardCoverage/BoardCoverageFull.java

/**
 * Percentage of all board sites (cell, vertex and edge) which a piece was placed on at some point.
 *
 * @java metrics/single/boardCoverage/BoardCoverageFull.java
 * @author matthew.stephenson
 */

import { Metric } from "../../Metric.js";

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

/** Minimal opaque type for not-yet-ported Move */
type Move = unknown;

/** Minimal opaque type for not-yet-ported TopologyElement */
type TopologyElement = unknown;

/** @java other/concept/Concept.BoardCoverageFull */
const ConceptBoardCoverageFull: Concept = "BoardCoverageFull" as unknown as Concept;

//-----------------------------------------------------------------------------
// Escape-hatch stubs for metrics.Utils (not yet ported)
//-----------------------------------------------------------------------------

function utils_setupNewContext(_game: Game, _rngState: RandomProviderState): Context {
  return null as unknown as Context;
}

function utils_boardAllSitesCovered(_context: Context): TopologyElement[] {
  return (null as unknown as { boardAllSitesCovered(ctx: Context): TopologyElement[] }).boardAllSitesCovered(_context);
}

//-----------------------------------------------------------------------------

/**
 * Percentage of all board sites (cell, vertex and edge) which a piece was placed on at some point.
 *
 * @java metrics/single/boardCoverage/BoardCoverageFull.java
 */
export class BoardCoverageFull extends Metric {

  //-------------------------------------------------------------------------

  /** For incremental computation. @java BoardCoverageFull.numSitesCovered */
  protected numSitesCovered: number = 0.0;

  /** For incremental computation. @java BoardCoverageFull.sitesCovered */
  protected sitesCovered: Set<TopologyElement> | null = null;

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java BoardCoverageFull()
   */
  public constructor() {
    super(
      "Board Coverage Full",
      "Percentage of all board sites (cell, vertex and edge) which a piece was placed on at some point.",
      0.0,
      1.0,
      ConceptBoardCoverageFull,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java BoardCoverageFull.apply(Game, Evaluation, Trial[], RandomProviderState[])
   */
  public apply(
    game: Game,
    _evaluation: Evaluation,
    trials: Trial[],
    randomProviderStates: RandomProviderState[],
  ): number | null {
    const g = game as unknown as {
      apply(ctx: Context, m: Move): void;
    };

    let numSitesCovered = 0;
    for (let trialIndex = 0; trialIndex < trials.length; trialIndex++) {
      // Get trial and RNG information
      const trial = trials[trialIndex] as unknown as {
        generateRealMovesList(): Move[];
      };
      const rngState = randomProviderStates[trialIndex];

      // Setup a new instance of the game
      const context: Context = utils_setupNewContext(game, rngState);

      // Record all sites covered in this trial.
      const sitesCovered = new Set<TopologyElement>();

      for (const el of utils_boardAllSitesCovered(context))
        sitesCovered.add(el);

      for (const m of trial.generateRealMovesList()) {
        g.apply(context, m);
        for (const el of utils_boardAllSitesCovered(context))
          sitesCovered.add(el);
      }

      const ctx = context as unknown as {
        board(): {
          topology(): {
            getAllGraphElements(): { size(): number } | unknown[];
          };
        };
      };
      const allElements = ctx.board().topology().getAllGraphElements();
      const numAll: number = typeof (allElements as { size?: () => number }).size === "function"
        ? (allElements as { size(): number }).size()
        : (allElements as unknown[]).length;

      numSitesCovered += sitesCovered.size / numAll;
    }

    return numSitesCovered / trials.length;
  }

  //-------------------------------------------------------------------------

  /**
   * @java BoardCoverageFull.startNewTrial(Context, Trial)
   */
  public startNewTrial(context: Context, _fullTrial: Trial): void {
    this.sitesCovered = new Set<TopologyElement>();
    for (const el of utils_boardAllSitesCovered(context))
      this.sitesCovered.add(el);
  }

  /**
   * @java BoardCoverageFull.observeNextState(Context)
   */
  public observeNextState(context: Context): void {
    for (const el of utils_boardAllSitesCovered(context))
      this.sitesCovered!.add(el);
  }

  /**
   * @java BoardCoverageFull.observeFinalState(Context)
   */
  public observeFinalState(context: Context): void {
    const ctx = context as unknown as {
      board(): {
        topology(): {
          getAllGraphElements(): { size(): number } | unknown[];
        };
      };
    };
    const allElements = ctx.board().topology().getAllGraphElements();
    const numAll: number = typeof (allElements as { size?: () => number }).size === "function"
      ? (allElements as { size(): number }).size()
      : (allElements as unknown[]).length;

    this.numSitesCovered += this.sitesCovered!.size / numAll;
  }

  /**
   * @java BoardCoverageFull.finaliseMetric(Game, int)
   */
  public finaliseMetric(_game: Game, numTrials: number): number {
    return this.numSitesCovered / numTrials;
  }

  //-------------------------------------------------------------------------
}
