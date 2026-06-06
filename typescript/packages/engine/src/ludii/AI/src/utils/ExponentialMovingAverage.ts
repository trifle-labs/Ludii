// @java AI/src/utils/ExponentialMovingAverage.java

/**
 * Utility class to incrementally keep track of exponential
 * moving averages.
 *
 * @java utils/ExponentialMovingAverage.java
 * @author Dennis Soemers
 */
export class ExponentialMovingAverage {

  //-------------------------------------------------------------------------

  /** Weight assigned to most recent point of data. 0 = all data points weighed equally */
  protected readonly alpha: number;

  /** Our running mean */
  protected runningMean: number = 0.0;

  /** Our denominator in running mean */
  protected denominator: number = 0.0;

  //-------------------------------------------------------------------------

  /**
   * Constructor (default alpha of 0.05)
   * @java ExponentialMovingAverage()
   */
  public constructor(alpha: number = 0.05) {
    this.alpha = alpha;
  }

  //-------------------------------------------------------------------------

  /**
   * @return Our (exponential) moving average
   * @java ExponentialMovingAverage.movingAvg()
   */
  public movingAvg(): number {
    return this.runningMean;
  }

  /**
   * Observe a new data point
   * @param data
   * @java ExponentialMovingAverage.observe(double)
   */
  public observe(data: number): void {
    this.denominator = (1 - this.alpha) * this.denominator + 1;
    this.runningMean += (1.0 / this.denominator) * (data - this.runningMean);
  }

  //-------------------------------------------------------------------------

  /**
   * Writes this tracker to a binary file (no-op in TypeScript)
   * @param filepath
   * @java ExponentialMovingAverage.writeToFile(String)
   */
  public writeToFile(filepath: string): void {
    // Java uses Java serialization; not applicable in TypeScript
    console.error("ExponentialMovingAverage.writeToFile() not supported in TypeScript: " + filepath);
  }

  //-------------------------------------------------------------------------
}
