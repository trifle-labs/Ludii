// @java AI/src/search/mcts/playout/RandomPlayout.java

import type { Context, Game, MCTS, PlayoutStrategy, Trial } from "./PlayoutStrategy.js";

/**
 * A completely random Play-out strategy (selects actions according
 * to a uniform distribution).
 *
 * @java search.mcts.playout.RandomPlayout
 * @author Dennis Soemers
 */
export class RandomPlayout implements PlayoutStrategy {

  //-------------------------------------------------------------------------

  /** Auto-end playouts in a draw if they take more turns than this */
  protected playoutTurnLimit: number = -1;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @java RandomPlayout()
   */
  public constructor();

  /**
   * Constructor
   * @param playoutTurnLimit
   * @java RandomPlayout(int)
   */
  public constructor(playoutTurnLimit: number);

  public constructor(playoutTurnLimit?: number) {
    if (playoutTurnLimit !== undefined) {
      this.playoutTurnLimit = playoutTurnLimit;
    } else {
      this.playoutTurnLimit = -1; // no limit
    }
  }

  //-------------------------------------------------------------------------

  /** @java RandomPlayout.runPlayout(MCTS, Context) */
  public runPlayout(mcts: MCTS, context: Context): Trial {
    void mcts;
    return (context as unknown as {
      game(): {
        playout(
          context: Context,
          agents: null,
          thinkTime: number,
          moveSelector: null,
          maxNumBiasedActions: number,
          maxNumPlayoutActions: number,
          rng: unknown
        ): Trial;
      };
    }).game().playout(context, null, 1.0, null, 0, this.playoutTurnLimit, Math.random);
  }

  /** @java RandomPlayout.backpropFlags() */
  public backpropFlags(): number {
    return 0;
  }

  //-------------------------------------------------------------------------

  /** @java RandomPlayout.playoutSupportsGame(Game) */
  public playoutSupportsGame(game: Game): boolean {
    if (game.isDeductionPuzzle()) {
      return this.playoutTurnLimit > 0;
    } else {
      return true;
    }
  }

  /** @java RandomPlayout.customise(String[]) */
  public customise(inputs: string[]): void {
    for (let i = 1; i < inputs.length; ++i) {
      const input = inputs[i] ?? "";

      if (input.toLowerCase().startsWith("playoutturnlimit=")) {
        this.playoutTurnLimit = parseInt(input.substring("playoutturnlimit=".length), 10);
      }
    }
  }

  /**
   * @return The turn limit we use in playouts
   * @java RandomPlayout.playoutTurnLimit()
   */
  public getPlayoutTurnLimit(): number {
    return this.playoutTurnLimit;
  }

  //-------------------------------------------------------------------------
}
