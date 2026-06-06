// @java Evaluation/src/metrics/MetricsTracker.java

/**
 * Lets us incrementally track and update many different metrics at the same time as
 * we're walking through multiple trials.
 *
 * @java metrics/MetricsTracker.java
 * @author Dennis Soemers
 */

import { Metric } from "./Metric.js";

/** Minimal escape-hatch for not-yet-ported Game */
type Game = unknown;

/** Minimal escape-hatch for not-yet-ported Context */
type Context = unknown;

/** Minimal escape-hatch for not-yet-ported Trial */
type Trial = unknown;

//-----------------------------------------------------------------------------

/**
 * Lets us incrementally track and update many different metrics at the same time as
 * we're walking through multiple trials.
 *
 * @java metrics/MetricsTracker.java
 */
export class MetricsTracker {

  //-------------------------------------------------------------------------

  /** @java MetricsTracker.metrics — The metrics we want to track */
  private readonly metrics: Metric[];

  //-------------------------------------------------------------------------

  /**
   * @java MetricsTracker(List<Metric>)
   */
  public constructor(metrics: Metric[]) {
    this.metrics = metrics;
  }

  //-------------------------------------------------------------------------

  /**
   * Inform all the metrics that we're now starting to walk through a new trial.
   * @param context The initial state.
   * @param fullTrial The complete trial (not just the stage we're at with stepping through it).
   * @java MetricsTracker.startNewTrial(Context, Trial)
   */
  public startNewTrial(context: Context, fullTrial: Trial): void {
    for (const metric of this.metrics) {
      metric.startNewTrial(context, fullTrial);
    }
  }

  /**
   * Let all the metrics observe a new state.
   * @param context
   * @java MetricsTracker.observeNextState(Context)
   */
  public observeNextState(context: Context): void {
    for (const metric of this.metrics) {
      metric.observeNextState(context);
    }
  }

  /**
   * Let all the metrics observe the final state of a trial.
   * @param context
   * @java MetricsTracker.observeFinalState(Context)
   */
  public observeFinalState(context: Context): void {
    for (const metric of this.metrics) {
      metric.observeFinalState(context);
    }
  }

  /**
   * Finalise computation of all metrics.
   * @param game
   * @param numTrials
   * @return Mapping from concept names to metric values.
   * @java MetricsTracker.finaliseMetrics(Game, int)
   */
  public finaliseMetrics(game: Game, numTrials: number): Map<string, number> {
    const metricsMap = new Map<string, number>();

    for (const metric of this.metrics) {
      const conceptName = (metric.concept() as unknown as { name?: () => string })?.name?.() ?? "";
      metricsMap.set(conceptName, metric.finaliseMetric(game, numTrials));
    }

    return metricsMap;
  }

  //-------------------------------------------------------------------------
}
