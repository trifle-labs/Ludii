// @java Common/src/main/math/statistics/Stats.java

/**
 * Basic statistics of a list of (double) samples.
 *
 * @java main/math/statistics/Stats.java
 * @author Cameron Browne, Dennis Soemers
 */
export class Stats {

  //-------------------------------------------------------------------------

  /** Description of what these statistics describe. @java Stats.label */
  protected label: string = "?";

  /** Samples. @java Stats.samples */
  protected samples: number[] = [];

  /** CI constant (95%). @java Stats.ci */
  protected readonly ci: number = 1.95996;

  /** Minimum value. @java Stats.min */
  protected min: number = 0;

  /** Maximum value. @java Stats.max */
  protected max: number = 0;

  /** Sum. @java Stats.sum */
  protected sum: number = 0;

  /** Mean. @java Stats.mean */
  protected mean: number = 0;

  /** Sample variance. @java Stats.varn */
  protected varn: number = 0;

  /** Sample standard deviation. @java Stats.stdDevn */
  protected stdDevn: number = 0;

  /** Standard error. @java Stats.stdError */
  protected stdError: number = 0;

  /** Confidence interval. @java Stats.confInterval */
  protected confInterval: number = 0;

  //-------------------------------------------------------------------------

  /**
   * Default constructor.
   * @java Stats()
   */
  public constructor();
  /**
   * Constructor with label.
   * @param str Label.
   * @java Stats(String)
   */
  public constructor(str: string);
  public constructor(str?: string) {
    this.label = str ?? "Unnamed";
  }

  //-------------------------------------------------------------------------

  /**
   * @return What these statistics describe.
   * @java Stats.label()
   */
  public getLabel(): string {
    return this.label;
  }

  /**
   * @param lbl Description of these statistics.
   * @java Stats.setLabel(String)
   */
  public setLabel(lbl: string): void {
    this.label = lbl;
  }

  /**
   * Add a sample.
   * @param val Sample to add.
   * @java Stats.addSample(double)
   */
  public addSample(val: number): void {
    this.samples.push(val);
  }

  /**
   * @param index Sample to get.
   * @return Specified sample.
   * @java Stats.get(int)
   */
  public get(index: number): number {
    return this.samples[index] as number;
  }

  /**
   * @return Number of samples.
   * @java Stats.n()
   */
  public n(): number {
    return this.samples.length;
  }

  /**
   * @return Sum.
   * @java Stats.sum()
   */
  public getSum(): number {
    return this.sum;
  }

  /**
   * @return Mean.
   * @java Stats.mean()
   */
  public getMean(): number {
    return this.mean;
  }

  /**
   * @return Sample variance.
   * @java Stats.varn()
   */
  public varnValue(): number {
    return this.varn;
  }

  /**
   * @return Standard deviation.
   * @java Stats.sd()
   */
  public sd(): number {
    return this.stdDevn;
  }

  /**
   * @return Standard error.
   * @java Stats.se()
   */
  public se(): number {
    return this.stdError;
  }

  /**
   * @return Confidence interval (95%).
   * @java Stats.ci()
   */
  public getCi(): number {
    return this.confInterval;
  }

  /**
   * @return Minimum value.
   * @java Stats.min()
   */
  public getMin(): number {
    return this.min;
  }

  /**
   * @return Maximum value.
   * @java Stats.max()
   */
  public getMax(): number {
    return this.max;
  }

  /**
   * @return Range of values.
   * @java Stats.range()
   */
  public range(): number {
    return this.getMax() - this.getMin();
  }

  /**
   * @param list Sample list.
   * @java Stats.set(TDoubleArrayList)
   */
  public set(list: number[]): void {
    this.samples = list;
  }

  //-------------------------------------------------------------------------

  /**
   * Clears this set of statistics.
   * @java Stats.clear()
   */
  public clear(): void {
    this.samples = [];
    this.sum = 0.0;
    this.mean = 0.0;
    this.varn = 0.0;
    this.stdDevn = 0.0;
    this.stdError = 0.0;
    this.confInterval = 0.0;
    this.min = 0.0;
    this.max = 0.0;
  }

  //-------------------------------------------------------------------------

  /**
   * Measures stats from samples.
   * @java Stats.measure()
   */
  public measure(): void {
    this.sum = 0.0;
    this.mean = 0.0;
    this.varn = 0.0;
    this.stdDevn = 0.0;
    this.stdError = 0.0;
    this.confInterval = 0.0;
    this.min = 0.0;
    this.max = 0.0;

    const n = this.samples.length;

    if (n === 0)
      return;

    this.min = Infinity;
    this.max = -Infinity;

    // Calculate mean
    for (let i = 0; i < n; ++i) {
      const val = this.samples[i] as number;
      this.sum += val;

      if (val < this.min)
        this.min = val;
      else if (val > this.max)
        this.max = val;
    }

    this.mean = this.sum / n;

    // We require sample size of at least 2 for sample variance, sample STD, CIs, etc.
    if (n > 1) {
      // Variance
      for (let i = 0; i < n; ++i) {
        const val = this.samples[i] as number;
        const diff = val - this.mean;
        this.varn += diff * diff;
      }

      // N - 1 for sample variance instead of population variance
      this.varn /= (n - 1);

      // Standard deviation
      this.stdDevn = Math.sqrt(this.varn);

      // Standard error
      this.stdError = this.stdDevn / Math.sqrt(n);

      // Confidence interval
      this.confInterval = this.ci * this.stdDevn / Math.sqrt(n);
    }
  }

  //-------------------------------------------------------------------------

  /**
   * Shows stats.
   * @java Stats.show()
   */
  public show(): void {
    process.stdout.write(this.toString());
  }

  /**
   * Shows full stats.
   * @java Stats.showFull()
   */
  public showFull(): void {
    const str =
      "N=" + this.samples.length + ", " +
      "mean=" + this.mean.toFixed(6) + " " +
      "(+/-" + this.confInterval.toFixed(6) + "), " +
      "sd=" + this.stdDevn.toFixed(6) + ", " +
      "se=" + this.stdError.toFixed(6) + ", " +
      "min=" + this.min.toFixed(6) + ", " +
      "max=" + this.max.toFixed(6) + ".";
    console.log(str);
  }

  /** @java Stats.toString() */
  public toString(): string {
    const str =
      "N=" + this.samples.length + ", " +
      "mean=" + this.mean.toFixed(6) + " " +
      "(+/-" + this.confInterval.toFixed(6) + ").";
    return str;
  }

  /**
   * @java Stats.exportPS()
   */
  public exportPS(): string {
    return (
      "[ (" + this.label + ") " + this.samples.length + " " + this.mean.toFixed(3) +
      " " + this.min.toFixed(3) + " " + this.max.toFixed(3) +
      " " + this.stdDevn.toFixed(3) + " " + this.stdError.toFixed(3) + " " + this.ci.toFixed(3) +
      " ]"
    );
  }

  //-------------------------------------------------------------------------
}
