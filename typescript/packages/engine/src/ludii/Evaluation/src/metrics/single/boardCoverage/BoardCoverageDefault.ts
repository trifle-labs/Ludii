// @java Evaluation/src/metrics/single/boardCoverage/BoardCoverageDefault.java

/**
 * Percentage of default board sites which a piece was placed on at some point.
 *
 * @java metrics/single/boardCoverage/BoardCoverageDefault.java
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

/** @java other/concept/Concept.BoardCoverageDefault */
const ConceptBoardCoverageDefault: Concept = "BoardCoverageDefault" as unknown as Concept;

//-----------------------------------------------------------------------------
// Escape-hatch stubs for metrics.Utils (not yet ported)
//-----------------------------------------------------------------------------

function utils_setupNewContext(_game: Game, _rngState: RandomProviderState): Context {
  return null as unknown as Context;
}

function utils_boardDefaultSitesCovered(_context: Context): TopologyElement[] {
  return (null as unknown as { boardDefaultSitesCovered(ctx: Context): TopologyElement[] }).boardDefaultSitesCovered(_context);
}

//-----------------------------------------------------------------------------

/**
 * Percentage of default board sites which a piece was placed on at some point.
 *
 * @java metrics/single/boardCoverage/BoardCoverageDefault.java
 */
export class BoardCoverageDefault extends Metric {

  //-------------------------------------------------------------------------

  /** For incremental computation. @java BoardCoverageDefault.numSitesCovered */
  protected numSitesCovered: number = 0.0;

  /** For incremental computation. @java BoardCoverageDefault.sitesCovered */
  protected sitesCovered: Set<TopologyElement> | null = null;

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java BoardCoverageDefault()
   */
  public constructor() {
    super(
      "Board Coverage Default",
      "Percentage of default board sites which a piece was placed on at some point.",
      0.0,
      1.0,
      ConceptBoardCoverageDefault,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java BoardCoverageDefault.apply(Game, Evaluation, Trial[], RandomProviderState[])
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

      for (const el of utils_boardDefaultSitesCovered(context))
        sitesCovered.add(el);

      for (const m of trial.generateRealMovesList()) {
        g.apply(context, m);
        for (const el of utils_boardDefaultSitesCovered(context))
          sitesCovered.add(el);
      }

      const ctx = context as unknown as {
        board(): {
          topology(): {
            getGraphElements(siteType: unknown): { size(): number } | unknown[];
          };
          defaultSite(): unknown;
        };
      };
      const defaultElements = ctx.board().topology().getGraphElements(ctx.board().defaultSite());
      const numDefault: number = typeof (defaultElements as { size?: () => number }).size === "function"
        ? (defaultElements as { size(): number }).size()
        : (defaultElements as unknown[]).length;

      numSitesCovered += sitesCovered.size / numDefault;
    }

    return numSitesCovered / trials.length;
  }

  //-------------------------------------------------------------------------

  /**
   * @java BoardCoverageDefault.startNewTrial(Context, Trial)
   */
  public startNewTrial(context: Context, _fullTrial: Trial): void {
    this.sitesCovered = new Set<TopologyElement>();
    for (const el of utils_boardDefaultSitesCovered(context))
      this.sitesCovered.add(el);
  }

  /**
   * @java BoardCoverageDefault.observeNextState(Context)
   */
  public observeNextState(context: Context): void {
    for (const el of utils_boardDefaultSitesCovered(context))
      this.sitesCovered!.add(el);
  }

  /**
   * @java BoardCoverageDefault.observeFinalState(Context)
   */
  public observeFinalState(context: Context): void {
    const ctx = context as unknown as {
      board(): {
        topology(): {
          getGraphElements(siteType: unknown): { size(): number } | unknown[];
        };
        defaultSite(): unknown;
      };
    };
    const defaultElements = ctx.board().topology().getGraphElements(ctx.board().defaultSite());
    const numDefault: number = typeof (defaultElements as { size?: () => number }).size === "function"
      ? (defaultElements as { size(): number }).size()
      : (defaultElements as unknown[]).length;

    this.numSitesCovered += this.sitesCovered!.size / numDefault;
  }

  /**
   * @java BoardCoverageDefault.finaliseMetric(Game, int)
   */
  public finaliseMetric(_game: Game, numTrials: number): number {
    return this.numSitesCovered / numTrials;
  }

  //-------------------------------------------------------------------------
}
