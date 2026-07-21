// @java Evaluation/src/metrics/single/boardCoverage/BoardCoverageUsed.java

/**
 * Percentage of used board sites (detected automatically based on the games rule description) which a piece was placed on at some point.
 *
 * @java metrics/single/boardCoverage/BoardCoverageUsed.java
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

/** @java other/concept/Concept.BoardCoverageUsed */
const ConceptBoardCoverageUsed: Concept = "BoardCoverageUsed" as unknown as Concept;

//-----------------------------------------------------------------------------
// Escape-hatch stubs for metrics.Utils (not yet ported)
//-----------------------------------------------------------------------------

function utils_setupNewContext(_game: Game, _rngState: RandomProviderState): Context {
  return null as unknown as Context;
}

function utils_boardUsedSitesCovered(_context: Context): TopologyElement[] {
  return (null as unknown as { boardUsedSitesCovered(ctx: Context): TopologyElement[] }).boardUsedSitesCovered(_context);
}

//-----------------------------------------------------------------------------

/**
 * Percentage of used board sites (detected automatically based on the games rule description) which a piece was placed on at some point.
 *
 * @java metrics/single/boardCoverage/BoardCoverageUsed.java
 */
export class BoardCoverageUsed extends Metric {

  //-------------------------------------------------------------------------

  /** For incremental computation. @java BoardCoverageUsed.numSitesCovered */
  protected numSitesCovered: number = 0.0;

  /** For incremental computation. @java BoardCoverageUsed.sitesCovered */
  protected sitesCovered: Set<TopologyElement> | null = null;

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java BoardCoverageUsed()
   */
  public constructor() {
    super(
      "Board Coverage Used",
      "Percentage of used board sites (detected automatically based on the games rule description) which a piece was placed on at some point.",
      0.0,
      1.0,
      ConceptBoardCoverageUsed,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java BoardCoverageUsed.apply(Game, Evaluation, Trial[], RandomProviderState[])
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

      for (const el of utils_boardUsedSitesCovered(context))
        sitesCovered.add(el);

      for (const m of trial.generateRealMovesList()) {
        g.apply(context, m);
        for (const el of utils_boardUsedSitesCovered(context))
          sitesCovered.add(el);
      }

      const ctx = context as unknown as {
        board(): {
          topology(): {
            getAllUsedGraphElements(g: Game): { size(): number } | unknown[];
          };
        };
        game(): Game;
      };
      const allUsedElements = ctx.board().topology().getAllUsedGraphElements(ctx.game());
      const numUsed: number = typeof (allUsedElements as { size?: () => number }).size === "function"
        ? (allUsedElements as { size(): number }).size()
        : (allUsedElements as unknown[]).length;

      numSitesCovered += sitesCovered.size / numUsed;
    }

    return numSitesCovered / trials.length;
  }

  //-------------------------------------------------------------------------

  /**
   * @java BoardCoverageUsed.startNewTrial(Context, Trial)
   */
  public startNewTrial(context: Context, _fullTrial: Trial): void {
    this.sitesCovered = new Set<TopologyElement>();
    for (const el of utils_boardUsedSitesCovered(context))
      this.sitesCovered.add(el);
  }

  /**
   * @java BoardCoverageUsed.observeNextState(Context)
   */
  public observeNextState(context: Context): void {
    for (const el of utils_boardUsedSitesCovered(context))
      this.sitesCovered!.add(el);
  }

  /**
   * @java BoardCoverageUsed.observeFinalState(Context)
   */
  public observeFinalState(context: Context): void {
    const ctx = context as unknown as {
      board(): {
        topology(): {
          getAllUsedGraphElements(g: Game): { size(): number } | unknown[];
        };
      };
      game(): Game;
    };
    const allUsedElements = ctx.board().topology().getAllUsedGraphElements(ctx.game());
    const numUsed: number = typeof (allUsedElements as { size?: () => number }).size === "function"
      ? (allUsedElements as { size(): number }).size()
      : (allUsedElements as unknown[]).length;

    this.numSitesCovered += this.sitesCovered!.size / numUsed;
  }

  /**
   * @java BoardCoverageUsed.finaliseMetric(Game, int)
   */
  public finaliseMetric(_game: Game, numTrials: number): number {
    return this.numSitesCovered / numTrials;
  }

  //-------------------------------------------------------------------------
}
