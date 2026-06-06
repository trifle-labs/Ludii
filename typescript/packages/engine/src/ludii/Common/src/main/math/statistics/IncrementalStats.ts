// @java Common/src/main/math/statistics/IncrementalStats.java

/**
 * Object that can compute some statistics of data incrementally (online). In
 * contrast to our Stats class, this one does not have to retain all observations
 * in memory (and can more quickly return aggregates because it no longer requires
 * any loops through all observations).
 *
 * Uses algorithm found by Welford, as described here:
 * https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Welford's_online_algorithm
 *
 * @java main/math/statistics/IncrementalStats.java
 * @author Dennis Soemers
 */

/** Java parity: Constants.EPSILON = 0.0000001 */
const EPSILON = 0.0000001;

export class IncrementalStats {

  //-------------------------------------------------------------------------

  /** Number of observations. @java IncrementalStats.n */
  private n: number;

  /** Mean of observations. @java IncrementalStats.mean */
  private mean: number;

  /** Sum of squared differences from mean. @java IncrementalStats.sumSquaredDifferences */
  private sumSquaredDifferences: number;

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java IncrementalStats()
   */
  public constructor();
  /**
   * Copy constructor.
   * @param other
   * @java IncrementalStats(IncrementalStats)
   */
  public constructor(other: IncrementalStats);
  public constructor(other?: IncrementalStats) {
    if (other !== undefined) {
      this.n = other.getNumObservations();
      this.mean = other.getMean();
      this.sumSquaredDifferences = other.getSumSquaredDifferences();
    } else {
      this.n = 0;
      this.mean = 0.0;
      this.sumSquaredDifferences = 0.0;
    }
  }

  //-------------------------------------------------------------------------

  /**
   * Returns the mean of all observations so far.
   * @java IncrementalStats.getMean()
   */
  public getMean(): number {
    return this.mean;
  }

  /**
   * Returns the number of observations processed so far.
   * @java IncrementalStats.getNumObservations()
   */
  public getNumObservations(): number {
    return this.n;
  }

  /**
   * @return Sample standard deviation (biased if n = 1)
   * @java IncrementalStats.getStd()
   */
  public getStd(): number {
    return Math.sqrt(this.getVariance());
  }

  /**
   * @return Sum of squared differences
   * @java IncrementalStats.getSumSquaredDifferences()
   */
  public getSumSquaredDifferences(): number {
    return this.sumSquaredDifferences;
  }

  /**
   * Returns the sample variance, except for the case where that would be exactly 0.0.
   * In that case, it instead returns a value that decreases as we get more observations.
   * @java IncrementalStats.getNonZeroVariance()
   */
  public getNonZeroVariance(): number {
    if (this.sumSquaredDifferences === 0.0) {
      return 1.0 / (this.n + EPSILON);
    }
    return this.getVariance();
  }

  /**
   * Returns the sample variance of all observations so far (biased if n = 1).
   * @java IncrementalStats.getVariance()
   */
  public getVariance(): number {
    if (this.n > 1)
      return (this.sumSquaredDifferences / (this.n - 1));
    return (this.sumSquaredDifferences / this.n);
  }

  //-------------------------------------------------------------------------

  /**
   * Initialises the data with some initial values.
   * @param newN
   * @param newMean
   * @param newSumSquaredDifferences
   * @java IncrementalStats.init(int, double, double)
   */
  public init(newN: number, newMean: number, newSumSquaredDifferences: number): void {
    this.n = newN;
    this.mean = newMean;
    this.sumSquaredDifferences = newSumSquaredDifferences;
  }

  /**
   * Initialise from another object.
   * @param other
   * @java IncrementalStats.initFrom(IncrementalStats)
   */
  public initFrom(other: IncrementalStats): void {
    this.n = other.getNumObservations();
    this.mean = other.getMean();
    this.sumSquaredDifferences = other.getSumSquaredDifferences();
  }

  /**
   * Add a new observation.
   * @param observation
   * @java IncrementalStats.observe(double)
   */
  public observe(observation: number): void {
    ++this.n;
    const delta = observation - this.mean;
    this.mean += delta / this.n;
    this.sumSquaredDifferences += delta * (observation - this.mean);
  }

  /**
   * Opposite of observing, we'll forget about a previously made observation.
   * @param observation
   * @java IncrementalStats.unobserve(double)
   */
  public unobserve(observation: number): void {
    const wrongN = this.n;
    const wrongMean = this.mean;
    const wrongSsd = this.sumSquaredDifferences;

    --this.n;
    this.mean = (wrongN * wrongMean - observation) / this.n;
    const delta = observation - this.mean;
    this.sumSquaredDifferences = wrongSsd - delta * (observation - wrongMean);
  }

  //-------------------------------------------------------------------------

  /**
   * Merges two sets of incrementally collected stats, using Chan et al.'s method as described on
   * https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Parallel_algorithm
   *
   * @param a
   * @param b
   * @java IncrementalStats.merge(IncrementalStats, IncrementalStats)
   */
  public static merge(a: IncrementalStats, b: IncrementalStats): IncrementalStats {
    const meanA = a.getMean();
    const meanB = b.getMean();
    const nA = a.getNumObservations();
    const nB = b.getNumObservations();

    const delta = meanA - meanB;
    const sumN = nA + nB;

    const newMean = meanA + delta * (nB / sumN);

    const newSumSquaredDifferences = (sumN === 0) ? 0.0 :
      a.getSumSquaredDifferences() + b.getSumSquaredDifferences() +
      delta * delta * ((nA * nB) / sumN);

    const mergedStats = new IncrementalStats();
    mergedStats.init(sumN, newMean, newSumSquaredDifferences);
    return mergedStats;
  }

  //-------------------------------------------------------------------------

  /** @java IncrementalStats.toString() */
  public toString(): string {
    return "[n = " + this.n + ", mean = " + this.mean + ", std = " + this.getStd() + "]";
  }

  //-------------------------------------------------------------------------
}
