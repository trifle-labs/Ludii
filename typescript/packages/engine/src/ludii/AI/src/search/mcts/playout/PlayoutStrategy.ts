// @java AI/src/search/mcts/playout/PlayoutStrategy.java

/**
 * Interface for Play-out strategies for MCTS
 *
 * @java search.mcts.playout.PlayoutStrategy
 * @author Dennis Soemers
 */

// Escape-hatch types for not-yet-ported dependencies

/** @java game.Game */
export interface Game {
  isDeductionPuzzle(): boolean;
}

/** @java other.trial.Trial */
export interface Trial {
  over(): boolean;
}

/** @java other.context.Context */
export interface Context {
  game(): Game;
  trial(): Trial;
}

/** @java search.mcts.MCTS */
export interface MCTS {
  __mcts: true;
}

//-------------------------------------------------------------------------

/**
 * Interface for Play-out strategies for MCTS
 *
 * @java search.mcts.playout.PlayoutStrategy
 */
export interface PlayoutStrategy {

  /**
   * Runs full play-out
   *
   * @param mcts
   * @param context
   * @return Trial object at end of playout.
   * @java PlayoutStrategy.runPlayout(MCTS, Context)
   */
  runPlayout(mcts: MCTS, context: Context): Trial;

  /**
   * Allows a Playout strategy to tell Ludii whether or not it can support playing
   * any given game.
   *
   * @param game
   * @return False if the playout strategy cannot be used in a given game
   * @java PlayoutStrategy.playoutSupportsGame(Game)
   */
  playoutSupportsGame(game: Game): boolean;

  /**
   * @return Flags indicating stats that should be backpropagated
   * @java PlayoutStrategy.backpropFlags()
   */
  backpropFlags(): number;

  /**
   * Customise the play-out strategy based on a list of given string inputs.
   *
   * @param inputs
   * @java PlayoutStrategy.customise(String[])
   */
  customise(inputs: string[]): void;
}

//-------------------------------------------------------------------------

/**
 * Static factory helpers (mirrors Java static interface methods)
 * @java PlayoutStrategy.fromJson(JSONObject)
 */
export function playoutStrategyFromJson(json: Record<string, unknown>): PlayoutStrategy | null {
  const strategy = json["strategy"] as string;

  if (typeof strategy === "string" && strategy.toLowerCase() === "random") {
    // Import avoided to prevent circular deps; caller must import RandomPlayout
    // Return null here; callers that need this should use constructPlayoutStrategy
    return null;
  }

  return null;
}

/**
 * @param inputs
 * @return A play-out strategy constructed based on an array of inputs
 * @java PlayoutStrategy.constructPlayoutStrategy(String[])
 */
export function constructPlayoutStrategy(inputs: string[]): PlayoutStrategy | null {
  // Deferred; callers import concrete strategies directly
  void inputs;
  return null;
}

//-------------------------------------------------------------------------
