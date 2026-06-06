// @java Evaluation/src/experiments/strategicDimension/FutureTrialAB.java

/**
 * Thread for running AB version of SD trial.
 *
 * @java experiments/strategicDimension/FutureTrialAB.java
 * @author cambolbro
 */

import { FutureTrial } from "./FutureTrial.js";

/** Minimal escape-hatch for not-yet-ported Game */
interface Game {
  players(): { count(): number };
  start(context: Context): void;
  apply(context: Context, move: Move): void;
  moves(context: Context): unknown;
}

/** Minimal escape-hatch for not-yet-ported Trial */
interface Trial {
  over(): boolean;
  status(): { winner(): number };
}

/** Minimal escape-hatch for not-yet-ported Context */
interface Context {
  trial(): Trial;
  state(): { mover(): number };
}

/** Minimal escape-hatch for not-yet-ported Move */
type Move = unknown;

/** Minimal escape-hatch for not-yet-ported AI */
interface AI {
  initAI(game: Game, playerID: number): void;
  selectAction(
    game: Game,
    context: Context,
    maxSeconds: number,
    maxIterations: number,
    maxDepth: number
  ): Move;
}

/** Minimal escape-hatch for not-yet-ported Status */
type Status = unknown;

// Escape-hatch stubs for not-yet-ported Java dependencies
const AlphaBetaSearch = {} as unknown as { new(): AI };

//-----------------------------------------------------------------------------

/**
 * Thread for running AB version of SD trial.
 *
 * @java experiments/strategicDimension/FutureTrialAB.java
 */
export class FutureTrialAB implements FutureTrial {

  //-------------------------------------------------------------------------

  /**
   * @param game    The single game object, shared across threads.
   * @param trialId The index of this trial within its epoch.
   * @param lower   Lower iteration count of this epoch for inferior agent.
   * @param upper   Upper iteration count of this epoch for superior agent.
   * @return Result of trial relative to superior agent (0=loss, 0.5=draw, 1=win).
   * @java FutureTrialAB.runTrial(Game, int, int, int)
   */
  public runTrial(
    game: Game,
    trialId: number,
    lower: number,
    upper: number,
  ): Promise<number> {
    return new Promise<number>((resolve) => {
      //console.log("Submitted id=" + id + ", lower=" + lower + ", upper=" + upper + ".");

      const numPlayers = game.players().count();

      const pidHigher = 1 + trialId % numPlayers;  // alternate between players

      const trial = {} as unknown as Trial;
      const context = {} as unknown as Context;

      game.start(context);

      // Set up AIs
      const agents: (AI | null)[] = [];
      agents.push(null);  // null player 0
      for (let pid = 1; pid < numPlayers + 1; pid++) {
        const ai = new AlphaBetaSearch();
        ai.initAI(game, pid);
        agents.push(ai);
      }

      while (!context.trial().over()) {
        const mover = context.state().mover();

        if (mover < 1 || mover > numPlayers) {
          console.log("** Bad mover index: " + mover);
        }

        const agent = agents[mover]!;

        const move = agent.selectAction(
          game,
          new (context.constructor as unknown as { new(c: Context): Context })(context),
          -1,
          -1,
          (mover === pidHigher ? upper : lower),
        );
        game.apply(context, move);

        //if (trial.numberOfTurns() % 10 == 0)
        //	console.log(".");
      }
      //console.log(trialId + ": " + context.trial().status() + " (P" + pidHigher + " is superior).");

      const status = context.trial().status();
      process.stdout.write(String(status.winner()));

      if (status.winner() === 0) {
        resolve(0.5);  // is a draw
      } else if (status.winner() === pidHigher) {
        resolve(1);  // superior player wins
      } else {
        resolve(0);  // superior player does not win
      }

      void trial; void lower; void upper;
    });
  }

  //-------------------------------------------------------------------------
}
