// @java Evaluation/src/metrics/single/complexity/StateSpaceComplexity.java

/**
 * Estimate of the total number of possible game board states.
 * https://www.pipmodern.com/post/complexity-state-space-game-tree
 *
 * @java metrics/single/complexity/StateSpaceComplexity.java
 * @author matthew.stephenson
 */

import { Metric } from "../../Metric.js";

/** @java main/Constants.INFINITY */
const CONSTANTS_INFINITY = 1000000000;

/** @java main/Constants.MAX_STACK_HEIGHT */
const CONSTANTS_MAX_STACK_HEIGHT = 32;

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

/** @java other/concept/Concept.StateTreeComplexity */
const ConceptStateTreeComplexity: Concept = "StateTreeComplexity" as unknown as Concept;

//-----------------------------------------------------------------------------

/**
 * Estimate of the total number of possible game board states.
 *
 * @java metrics/single/complexity/StateSpaceComplexity.java
 */
export class StateSpaceComplexity extends Metric {

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java StateSpaceComplexity()
   */
  public constructor() {
    super(
      "State Space Complexity",
      "Estimate of the total number of possible game board states.",
      0.0,
      CONSTANTS_INFINITY,
      ConceptStateTreeComplexity,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java StateSpaceComplexity.apply(Game, Evaluation, Trial[], RandomProviderState[])
   */
  public apply(
    game: Game,
    _evaluation: Evaluation,
    _trials: Trial[],
    _randomProviderStates: RandomProviderState[],
  ): number | null {
    const g = game as unknown as {
      hasSubgames(): boolean;
      isSimultaneousMoveGame(): boolean;
      numComponents(): number;
      isStacking(): boolean;
      requiresCount(): boolean;
      maxCount(): number;
      requiresLocalState(): boolean;
      maximalLocalStates(): number;
      requiresRotation(): boolean;
      maximalRotationStates(): number;
      requiresPieceValue(): boolean;
      maximalValue(): number;
      hiddenInformation(): boolean;
      board(): {
        topology(): {
          getAllUsedGraphElements(game: Game): { size(): number } | { length: number };
        };
      };
    };

    if (g.hasSubgames() || g.isSimultaneousMoveGame())
      return null;

    let maxStatePossibilites = g.numComponents() + 1;
    if (g.isStacking())
      maxStatePossibilites *= CONSTANTS_MAX_STACK_HEIGHT;
    else if (g.requiresCount())
      maxStatePossibilites *= g.maxCount();
    if (g.requiresLocalState())
      maxStatePossibilites *= g.maximalLocalStates();
    if (g.requiresRotation())
      maxStatePossibilites *= g.maximalRotationStates();
    if (g.requiresPieceValue())
      maxStatePossibilites *= g.maximalValue();
    if (g.hiddenInformation())
      maxStatePossibilites *= Math.pow(2, 7);

    const allUsed = g.board().topology().getAllUsedGraphElements(game);
    const numSites: number = typeof (allUsed as { size?: () => number }).size === "function"
      ? (allUsed as { size(): number }).size()
      : (allUsed as unknown as unknown[]).length;

    return numSites * Math.log10(maxStatePossibilites);
  }

  //-------------------------------------------------------------------------

  /**
   * @java StateSpaceComplexity.startNewTrial(Context, Trial)
   */
  public startNewTrial(_context: Context, _fullTrial: Trial): void {
    // Do nothing
  }

  /**
   * @java StateSpaceComplexity.observeNextState(Context)
   */
  public observeNextState(_context: Context): void {
    // Do nothing
  }

  /**
   * @java StateSpaceComplexity.observeFinalState(Context)
   */
  public observeFinalState(_context: Context): void {
    // Do nothing
  }

  /**
   * @java StateSpaceComplexity.finaliseMetric(Game, int)
   */
  public finaliseMetric(game: Game, _numTrials: number): number {
    return this.apply(game, null, null!, null!) as number;
  }

  //-------------------------------------------------------------------------
}
