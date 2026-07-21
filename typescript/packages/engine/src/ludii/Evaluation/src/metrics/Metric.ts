// @java Evaluation/src/metrics/Metric.java

/**
 * Base class for game metrics.
 *
 * @java metrics/Metric.java
 * @author cambolbro and matthew.stephenson
 */

/** Minimal escape-hatch for not-yet-ported Game */
type Game = unknown;

/** Minimal escape-hatch for not-yet-ported Trial */
type Trial = unknown;

/** Minimal escape-hatch for not-yet-ported Context */
type Context = unknown;

/** Minimal escape-hatch for not-yet-ported RandomProviderState */
type RandomProviderState = unknown;

/** Minimal escape-hatch for not-yet-ported Concept */
type Concept = unknown;

/** Minimal escape-hatch for not-yet-ported MultiMetricValue */
type MultiMetricValue = unknown;

/** Minimal escape-hatch for not-yet-ported Evaluation */
type Evaluation = unknown;

/**
 * Simple generic range holding min and max.
 * @java metrics/Range.java
 */
class Range<E1, E2> {
  /** @java Range.min */
  private readonly _min: E1;
  /** @java Range.max */
  private readonly _max: E2;

  public constructor(min: E1, max: E2) {
    this._min = min;
    this._max = max;
  }

  /** @java Range.min() */
  public min(): E1 { return this._min; }

  /** @java Range.max() */
  public max(): E2 { return this._max; }
}

//-----------------------------------------------------------------------------

/**
 * Base class for game metrics.
 *
 * @java metrics/Metric.java
 */
export abstract class Metric {

  //-----------------------------------------

  /** @java Metric.name — Unique name for this metric. */
  private readonly _name: string;

  /** @java Metric.notes — Brief description of what this metric measures. */
  private readonly _notes: string;

  /** @java Metric.range — Range of possible values. */
  private readonly _range: Range<number, number>;

  /** @java Metric.concept — Concept associated with this Metric. */
  private readonly _concept: Concept;

  /** @java Metric.multiMetricValue — Process for calculating the metric value, if a multi-metric. Otherwise null. */
  private readonly _multiMetricValue: MultiMetricValue | null;

  //-------------------------------------------------------------------------

  /**
   * @java Metric(String, String, double, double, Concept)
   */
  public constructor(
    name: string,
    notes: string,
    min: number,
    max: number,
    concept: Concept,
    multiMetricValue?: MultiMetricValue | null,
  ) {
    this._name = name;
    this._notes = notes;
    this._range = new Range<number, number>(min, max);
    this._concept = concept;
    this._multiMetricValue = multiMetricValue ?? null;
  }

  //-------------------------------------------------------------------------

  /** @java Metric.name() */
  public name(): string { return this._name; }

  /** @java Metric.notes() */
  public notes(): string { return this._notes; }

  /** @java Metric.min() */
  public min(): number { return this._range.min(); }

  /** @java Metric.max() */
  public max(): number { return this._range.max(); }

  /** @java Metric.concept() */
  public concept(): Concept { return this._concept; }

  /** @java Metric.multiMetricValue() */
  public multiMetricValue(): MultiMetricValue | null { return this._multiMetricValue; }

  //-------------------------------------------------------------------------

  /**
   * Apply this metric.
   * @param game The game to run.
   * @param evaluation The evaluation object.
   * @param trials At least one trial to be measured, may be multiple trials.
   * @param randomProviderStates RNG states for each trial.
   * @return Evaluation of the specified trial(s) according to this metric.
   * @java Metric.apply(Game, Evaluation, Trial[], RandomProviderState[])
   */
  public abstract apply(
    game: Game,
    evaluation: Evaluation,
    trials: Trial[],
    randomProviderStates: RandomProviderState[],
  ): number | null;

  /**
   * Start processing a new trial.
   * @param context Initial state.
   * @param fullTrial The complete trial.
   * @java Metric.startNewTrial(Context, Trial)
   */
  public abstract startNewTrial(context: Context, fullTrial: Trial): void;

  /**
   * Observe the next state for incrementally computing metrics.
   * @param context
   * @java Metric.observeNextState(Context)
   */
  public abstract observeNextState(context: Context): void;

  /**
   * Observe the final state for incrementally computing metrics.
   * @param context
   * @java Metric.observeFinalState(Context)
   */
  public abstract observeFinalState(context: Context): void;

  /**
   * Finalise incremental computation of metric.
   * @param game
   * @param numTrials
   * @return The metric value.
   * @java Metric.finaliseMetric(Game, int)
   */
  public abstract finaliseMetric(game: Game, numTrials: number): number;

  //-------------------------------------------------------------------------
}
