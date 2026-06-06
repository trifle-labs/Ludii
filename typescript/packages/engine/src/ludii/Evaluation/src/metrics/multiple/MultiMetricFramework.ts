// @java Evaluation/src/metrics/multiple/MultiMetricFramework.java

/**
 * Abstract base class for multi-metric framework metrics.
 *
 * @java metrics/multiple/MultiMetricFramework.java
 * @author matthew.stephenson
 */

import { Metric } from "../Metric.js";
import { LinearRegression } from "../../../../Common/src/main/math/LinearRegression.js";

/** Minimal escape-hatch types */
type Game = unknown;
type Trial = unknown;
type Context = unknown;
type RandomProviderState = unknown;
type Concept = unknown;
type Evaluation = unknown;

//-----------------------------------------------------------------------------

/**
 * Enum of aggregation methods for multi-metrics.
 * @java metrics/multiple/MultiMetricFramework.MultiMetricValue
 */
export enum MultiMetricValue {
  Average = "Average",
  Median = "Median",
  Max = "Max",
  Min = "Min",
  Variance = "Variance",

  ChangeAverage = "ChangeAverage",
  ChangeSign = "ChangeSign",
  ChangeLineBestFit = "ChangeLineBestFit",
  ChangeNumTimes = "ChangeNumTimes",

  MaxIncrease = "MaxIncrease",
  MaxDecrease = "MaxDecrease",
}

//-----------------------------------------------------------------------------

/**
 * Abstract base for metrics that produce a list of per-move values
 * then aggregate them with a MultiMetricValue strategy.
 *
 * @java metrics/multiple/MultiMetricFramework.java
 */
export abstract class MultiMetricFramework extends Metric {

  //-------------------------------------------------------------------------

  /** @java MultiMetricFramework.metricValueLists — For incremental computation */
  protected metricValueLists: Array<Array<number | null>> = [];

  /** @java MultiMetricFramework.currValueList — For incremental computation */
  protected currValueList: Array<number | null> = [];

  //-------------------------------------------------------------------------

  /**
   * @java MultiMetricFramework(String, String, double, double, Concept, MultiMetricValue)
   */
  public constructor(
    name: string,
    notes: string,
    min: number,
    max: number,
    concept: Concept,
    multiMetricValue: MultiMetricValue,
  ) {
    super(name, notes, min, max, concept, multiMetricValue as unknown);
  }

  //-------------------------------------------------------------------------

  /**
   * Get the list of metric values for a single trial.
   * @java MultiMetricFramework.getMetricValueList(Evaluation, Trial, Context)
   */
  public abstract getMetricValueList(
    evaluation: Evaluation,
    trial: Trial,
    context: Context,
  ): Array<number | null>;

  //-------------------------------------------------------------------------

  /**
   * Helper to set up a new context for a given RNG state.
   * Escape-hatch — delegates to the not-yet-ported Utils.setupNewContext.
   * @java metrics/Utils.setupNewContext(Game, RandomProviderState)
   */
  protected setupNewContext(game: Game, rngState: RandomProviderState): Context {
    // Not-yet-ported; callers must provide context externally.
    // This method is only called from getMetricValueLists which is overrideable.
    return (as_unknown_as_setupNewContext as unknown as { call: (g: Game, r: RandomProviderState) => Context }).call(game, rngState);
  }

  /**
   * @java MultiMetricFramework.getMetricValueLists(Game, Evaluation, Trial[], RandomProviderState[])
   */
  public getMetricValueLists(
    game: Game,
    evaluation: Evaluation,
    trials: Trial[],
    randomProviderStates: RandomProviderState[],
  ): number[][] {
    const metricValueLists: Array<Array<number | null>> = [];

    for (let trialIndex = 0; trialIndex < trials.length; trialIndex++) {
      const trial = trials[trialIndex] as Trial;
      const rngState = randomProviderStates[trialIndex] as RandomProviderState;
      // Escape hatch: call not-yet-ported Utils.setupNewContext
      const context = (as_unknown_as_setupNewContext as unknown as (g: Game, r: RandomProviderState) => Context)(game, rngState);
      metricValueLists.push(this.getMetricValueList(evaluation, trial, context));
    }

    // Convert to primitive double[][]
    const result: number[][] = new Array<number[]>(metricValueLists.length);
    for (let i = 0; i < metricValueLists.length; i++) {
      const src = metricValueLists[i] as Array<number | null>;
      const row = new Array<number>(src.length);
      for (let j = 0; j < src.length; j++) {
        const d = src[j];
        row[j] = d ?? 0;
      }
      result[i] = row;
    }

    return result;
  }

  //-------------------------------------------------------------------------
  // Aggregation methods
  //-------------------------------------------------------------------------

  /** @java MultiMetricFramework.metricAverage(double[][]) */
  public metricAverage(metricValues: number[][]): number {
    let metricAverageFinal = 0.0;
    for (const valueList of metricValues) {
      let metricAverage = 0.0;
      if (valueList.length > 0)
        for (const value of valueList)
          metricAverage += value / valueList.length;
      metricAverageFinal += metricAverage;
    }
    return metricAverageFinal / metricValues.length;
  }

  /** @java MultiMetricFramework.metricMedian(double[][]) */
  public metricMedian(metricValues: number[][]): number {
    let metricMedianFinal = 0.0;
    for (const valueList of metricValues) {
      let metricMedian = 0.0;
      if (valueList.length > 1) {
        const sorted = [...valueList].sort((a, b) => a - b);
        metricMedian = sorted[Math.floor(sorted.length / 2)] as number;
      }
      metricMedianFinal += metricMedian;
    }
    return metricMedianFinal / metricValues.length;
  }

  /** @java MultiMetricFramework.metricMax(double[][]) */
  public metricMax(metricValues: number[][]): number {
    let metricMaxFinal = 0.0;
    for (const valueList of metricValues) {
      let metricMax = 0.0;
      for (const value of valueList)
        metricMax = Math.max(metricMax, value);
      metricMaxFinal += metricMax;
    }
    return metricMaxFinal / metricValues.length;
  }

  /** @java MultiMetricFramework.metricMin(double[][]) */
  public metricMin(metricValues: number[][]): number {
    let metricMinFinal = 0.0;
    for (const valueList of metricValues) {
      let metricMin = 0.0;
      for (const value of valueList)
        metricMin = Math.min(metricMin, value);
      metricMinFinal += metricMin;
    }
    return metricMinFinal / metricValues.length;
  }

  /** @java MultiMetricFramework.metricVariance(double[][]) */
  public metricVariance(metricValues: number[][]): number {
    let metricVarianceFinal = 0.0;
    for (const valueList of metricValues) {
      let metricVariance = 0.0;
      if (valueList.length > 1) {
        let metricAverage = 0.0;
        for (const value of valueList)
          metricAverage += value / valueList.length;
        for (const value of valueList)
          metricVariance += Math.pow(value - metricAverage, 2) / valueList.length;
      }
      metricVarianceFinal += metricVariance;
    }
    return metricVarianceFinal / metricValues.length;
  }

  /** @java MultiMetricFramework.metricMaxIncrease(double[][]) */
  public metricMaxIncrease(metricValues: number[][]): number {
    let metricMaxFinal = 0.0;
    for (const valueList of metricValues) {
      let metricMax = 0.0;
      if (valueList.length > 1) {
        let lastValue = valueList[0] as number;
        for (const value of valueList) {
          const change = value - lastValue;
          metricMax = Math.max(metricMax, change);
          lastValue = value;
        }
      }
      metricMaxFinal += metricMax;
    }
    return metricMaxFinal / metricValues.length;
  }

  /** @java MultiMetricFramework.metricMaxDecrease(double[][]) */
  public metricMaxDecrease(metricValues: number[][]): number {
    let metricMaxFinal = 0.0;
    for (const valueList of metricValues) {
      let metricMax = 0.0;
      if (valueList.length > 1) {
        let lastValue = valueList[0] as number;
        for (const value of valueList) {
          const change = value - lastValue;
          metricMax = Math.min(metricMax, change);
          lastValue = value;
        }
      }
      metricMaxFinal += metricMax;
    }
    return metricMaxFinal / metricValues.length;
  }

  /**
   * The slope of the least squares line of best fit.
   * @java MultiMetricFramework.metricChangeLineBestFit(double[][])
   */
  public metricChangeLineBestFit(metricValues: number[][]): number {
    let metricChangeFinal = 0.0;
    for (const valueList of metricValues) {
      let linearRegressionSlope = 0.0;
      if (valueList.length > 1) {
        const xAxis = Array.from({ length: valueList.length }, (_, i) => i as number);
        const linearRegression = new LinearRegression(xAxis, valueList);
        linearRegressionSlope = linearRegression.getSlope();
      }
      metricChangeFinal += linearRegressionSlope;
    }
    return metricChangeFinal / metricValues.length;
  }

  /**
   * The average increase.
   * @java MultiMetricFramework.metricChangeAverage(double[][])
   */
  public metricChangeAverage(metricValues: number[][]): number {
    let metricChangeFinal = 0.0;
    for (const valueList of metricValues) {
      let metricChange = 0.0;
      if (valueList.length > 1) {
        const firstValue = valueList[0] as number;
        const lastValue = valueList[valueList.length - 1] as number;
        metricChange = (lastValue - firstValue) / (valueList.length - 1);
      }
      metricChangeFinal += metricChange;
    }
    return metricChangeFinal / metricValues.length;
  }

  /**
   * The average number of times the value increased versus decreased.
   * @java MultiMetricFramework.metricChangeSign(double[][])
   */
  public metricChangeSign(metricValues: number[][]): number {
    let metricChangeFinal = 0.0;
    for (const valueList of metricValues) {
      let metricChange = 0.0;
      if (valueList.length > 1) {
        let lastValue = valueList[0] as number;
        for (const value of valueList) {
          let change = value - lastValue;
          if (change > 0) change = 1;
          else if (change < 0) change = -1;
          else change = 0;
          metricChange += change / (valueList.length - 1);
          lastValue = value;
        }
      }
      metricChangeFinal += metricChange;
    }
    return metricChangeFinal / metricValues.length;
  }

  /**
   * The average number of times the direction changed.
   * @java MultiMetricFramework.metricChangeNumTimes(double[][])
   */
  public metricChangeNumTimes(metricValues: number[][]): number {
    let metricChangeFinal = 0.0;
    for (const valueList of metricValues) {
      let metricChange = 0.0;
      if (valueList.length > 1) {
        let valueChangeDirection = 0.0;
        let lastValue = valueList[0] as number;

        for (const value of valueList) {
          let direction = 0.0;
          if (value > lastValue) direction = 1.0;
          if (value < lastValue) direction = -1.0;
          if (direction !== 0.0 && valueChangeDirection !== direction)
            metricChange += 1 / (valueList.length - 1);
          valueChangeDirection = direction;
          lastValue = value;
        }
      }
      metricChangeFinal += metricChange;
    }
    return metricChangeFinal / metricValues.length;
  }

  //-------------------------------------------------------------------------

  /**
   * @java MultiMetricFramework.computeMultiMetric(double[][])
   */
  private computeMultiMetric(metricValues: number[][]): number | null {
    const mmv = this.multiMetricValue() as MultiMetricValue;
    switch (mmv) {
      case MultiMetricValue.Average: return this.metricAverage(metricValues);
      case MultiMetricValue.Median: return this.metricMedian(metricValues);
      case MultiMetricValue.Max: return this.metricMax(metricValues);
      case MultiMetricValue.Min: return this.metricMin(metricValues);
      case MultiMetricValue.Variance: return this.metricVariance(metricValues);

      case MultiMetricValue.ChangeAverage: return this.metricChangeAverage(metricValues);
      case MultiMetricValue.ChangeSign: return this.metricChangeSign(metricValues);
      case MultiMetricValue.ChangeLineBestFit: return this.metricChangeLineBestFit(metricValues);
      case MultiMetricValue.ChangeNumTimes: return this.metricChangeNumTimes(metricValues);

      case MultiMetricValue.MaxIncrease: return this.metricMaxIncrease(metricValues);
      case MultiMetricValue.MaxDecrease: return this.metricMaxDecrease(metricValues);

      default: return null;
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @java MultiMetricFramework.apply(Game, Evaluation, Trial[], RandomProviderState[])
   */
  public override apply(
    game: Game,
    evaluation: Evaluation,
    trials: Trial[],
    randomProviderStates: RandomProviderState[],
  ): number | null {
    // Zero player games cannot be computed.
    const g = game as unknown as {
      hasSubgames?: () => boolean;
      isSimultaneousMoveGame?: () => boolean;
      players?: () => { count: () => number };
    };
    if (
      (g.hasSubgames?.() ?? false) ||
      (g.isSimultaneousMoveGame?.() ?? false) ||
      (g.players?.().count() ?? 1) === 0
    ) {
      return null;
    }

    const metricValues = this.getMetricValueLists(game, evaluation, trials, randomProviderStates);
    return this.computeMultiMetric(metricValues);
  }

  //-------------------------------------------------------------------------

  /**
   * @java MultiMetricFramework.observeFinalState(Context)
   */
  public override observeFinalState(_context: Context): void {
    // We've finished building one list of values
    this.metricValueLists.push([...this.currValueList]);
    this.currValueList = [];
  }

  /**
   * @java MultiMetricFramework.finaliseMetric(Game, int)
   */
  public override finaliseMetric(_game: Game, _numTrials: number): number {
    const metricValues = this.metricValueLists;
    const primitives: number[][] = new Array<number[]>(metricValues.length);
    for (let i = 0; i < metricValues.length; i++) {
      const row = metricValues[i] as Array<number | null>;
      primitives[i] = new Array<number>(row.length);
      for (let j = 0; j < row.length; j++) {
        const v = row[j];
        (primitives[i] as number[])[j] = v == null ? NaN : v;
      }
    }
    return this.computeMultiMetric(primitives) ?? NaN;
  }

  //-------------------------------------------------------------------------
}

// Escape hatch: stub for not-yet-ported Utils.setupNewContext
// Called only from getMetricValueLists; real callers are expected to
// override getMetricValueLists or supply their own context.
function as_unknown_as_setupNewContext(_game: unknown, _rngState: unknown): unknown {
  throw new Error("Utils.setupNewContext not yet ported — override getMetricValueLists");
}
