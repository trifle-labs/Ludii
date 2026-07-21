// @java Evaluation/src/metrics/multiple/metrics/Drama.java

/**
 * Difference between the winning player's state evaluation and the
 * maximum state evaluation of any player.
 *
 * @java metrics/multiple/metrics/Drama.java
 * @author matthew.stephenson
 */

import { MultiMetricFramework, MultiMetricValue } from "../MultiMetricFramework.js";
import { Evaluation } from "../../Evaluation.js";
import { Utils } from "../../Utils.js";

/** Minimal escape-hatch types */
type Trial = unknown;
type Context = unknown;
type Game = unknown;

/** Escape-hatch interface for Context (compatible with Utils) */
type ContextLike = Parameters<typeof Utils.highestRankedPlayers>[1];

interface TrialLike {
  generateRealMovesList(): MoveInterface[];
}

interface MoveInterface {
  [key: string]: unknown;
}

interface GameLike {
  apply(ctx: ContextLike, move: MoveInterface): void;
}

//-----------------------------------------------------------------------------

/**
 * Difference between the winning players state evaluation and the
 * maximum state evaluation of any player.
 *
 * @java metrics/multiple/metrics/Drama.java
 */
export class Drama extends MultiMetricFramework {

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java Drama(MultiMetricValue, Concept)
   */
  public constructor(multiMetricValue: MultiMetricValue, concept: unknown) {
    super(
      "Drama " + multiMetricValue,
      "Difference between the winning players state evaluation and the 'maximum state evaluation of any player.",
      0.0,
      1.0,
      concept,
      multiMetricValue,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java Drama.getMetricValueList(Evaluation, Trial, Context)
   */
  public override getMetricValueList(
    evaluation: unknown,
    trial: Trial,
    context: Context,
  ): Array<number | null> {
    const eval_ = evaluation as Evaluation;
    const ctx = context as unknown as ContextLike;
    const t = trial as unknown as TrialLike;
    const valueList: Array<number | null> = [];

    // Get the highest ranked players based on the final player rankings.
    const highestRankedPlayers = Utils.highestRankedPlayers(trial, ctx);

    if (highestRankedPlayers !== null && highestRankedPlayers.length > 0) {
      for (const m of t.generateRealMovesList()) {
        // Get the highest state evaluation for any player.
        const allPlayerStateEvaluations = Utils.allPlayerStateEvaluations(eval_, ctx);
        const highestStateEvaluation = Math.max(...allPlayerStateEvaluations);

        // Get the average difference between the winning player(s) and the highest state evaluation.
        let differenceBetweenWinnersAndMax = 0.0;
        for (const highestRankedPlayer of highestRankedPlayers) {
          const playerStateEvaluation = allPlayerStateEvaluations[highestRankedPlayer] ?? 0;
          differenceBetweenWinnersAndMax += (highestStateEvaluation - playerStateEvaluation) / highestRankedPlayers.length;
        }

        valueList.push(differenceBetweenWinnersAndMax);
        (ctx.game() as unknown as GameLike).apply(ctx, m);
      }
    } else {
      console.log("ERROR, highestRankedPlayers list is empty");
    }

    return valueList;
  }

  //-------------------------------------------------------------------------

  /**
   * @java Drama.startNewTrial(Context, Trial)
   */
  public override startNewTrial(_context: Context, _fullTrial: Trial): void {
    console.error("Incrementally computing metric not yet implemented for Drama.");
  }

  /**
   * @java Drama.observeNextState(Context)
   */
  public override observeNextState(_context: Context): void {
    console.error("Incrementally computing metric not yet implemented for Drama.");
  }

  //-------------------------------------------------------------------------
}
