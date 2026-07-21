// @java Player/src/app/utils/AIPlayer.java

import { Evaluation } from "../../../../Evaluation/src/metrics/Evaluation.js";
import { Metric } from "../../../../Evaluation/src/metrics/Metric.js";
import { Report } from "../../../../Common/src/main/grammar/Report.js";

// ---------------------------------------------------------------------------
// Escape-hatch types
// ---------------------------------------------------------------------------

/** @java app.PlayerApp */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PlayerApp = any;

/**
 * Escape-hatch for supplementary.experiments.EvalGamesThread.
 * Not yet ported; we call via a minimal interface stub.
 * @java supplementary.experiments.EvalGamesThread
 */
type EvalGamesThreadShape = {
  setDaemon(daemon: boolean): void;
  start(): void;
};

/**
 * Minimal stub factory for EvalGamesThread.construct(...).
 * The Java class runs evaluation in a background thread; the browser port
 * uses a Promise-based async approach instead but keeps the same call shape.
 *
 * @java supplementary.experiments.EvalGamesThread
 */
const EvalGamesThread = {
  construct(
    _evaluation: Evaluation,
    _report: Report,
    _game: unknown,
    _options: string[],
    _aiName: string,
    _numberTrials: number,
    _thinkTime: number,
    _maxTurns: number,
    _metricsToEvaluate: Metric[],
    _weights: number[],
    _useDatabaseGames: boolean,
  ): EvalGamesThreadShape {
    // Escape-hatch: EvalGamesThread not yet ported.
    return {
      setDaemon(_d: boolean) { /* no-op */ },
      start() { /* no-op */ },
    };
  },
};

// ---------------------------------------------------------------------------

/**
 * Utility to load AI players and launch the Evaluation dialog for the desktop player.
 *
 * @java app.utils.AIPlayer
 * @author matthew and cambolbro
 */
export class AIPlayer {

  // ---------------------------------------------------------------------------

  /**
   * Evaluates a single specified game and option combination, based on the
   * AI parameters passed in.
   *
   * @java AIPlayer.AIEvalution(PlayerApp, Report, int, int, double, String, List<Metric>, ArrayList<Double>, boolean)
   */
  public static AIEvalution(
    app: PlayerApp,
    report: Report,
    numberTrials: number,
    maxTurns: number,
    thinkTime: number,
    aiName: string,
    metricsToEvaluate: Metric[],
    weights: number[],
    useDatabaseGames: boolean,
  ): void {
    const evaluation = new Evaluation();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const game = (app.manager() as any).ref().context().game;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options: string[] = (app.manager() as any).settingsManager().userSelections().selectedOptionStrings();

    if (options.length > 0) {
      app.addTextToAnalysisPanel("Analysing " + (game.name ?? game) + " " + options + "\n\n");
    } else {
      app.addTextToAnalysisPanel("Analysing " + (game.name ?? game) + "\n\n");
    }

    const evalThread = EvalGamesThread.construct(
      evaluation,
      report,
      game,
      options,
      aiName,
      numberTrials,
      thinkTime,
      maxTurns,
      metricsToEvaluate,
      weights,
      useDatabaseGames,
    );
    evalThread.setDaemon(true);
    evalThread.start();
  }

  // ---------------------------------------------------------------------------
}
