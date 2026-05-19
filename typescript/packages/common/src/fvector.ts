export class FVector {
  private readonly floats: Float32Array;

  public constructor(size: number, fillValue?: number);
  public constructor(values: ArrayLike<number>);
  public constructor(sizeOrValues: number | ArrayLike<number>, fillValue = 0) {
    if (typeof sizeOrValues === "number") {
      if (!Number.isInteger(sizeOrValues) || sizeOrValues < 0) {
        throw new RangeError("Vector size must be a non-negative integer.");
      }

      this.floats = new Float32Array(sizeOrValues);

      if (fillValue !== 0) {
        this.floats.fill(Math.fround(fillValue));
      }

      return;
    }

    this.floats = Float32Array.from(sizeOrValues);
  }

  private static fromRaw(values: Float32Array): FVector {
    const vector = Object.create(FVector.prototype) as FVector;
    vector.floats = values;
    return vector;
  }

  public static ones(dimension: number): FVector {
    const vector = new FVector(dimension);
    vector.fill(0, dimension, 1);
    return vector;
  }

  public static zeros(dimension: number): FVector {
    return new FVector(dimension);
  }

  public static wrap(values: Float32Array | ArrayLike<number>): FVector {
    return FVector.fromRaw(
      values instanceof Float32Array ? values : Float32Array.from(values),
    );
  }

  public static linspace(
    start: number,
    stop: number,
    num: number,
    endInclusive: boolean,
  ): FVector {
    if (!Number.isInteger(num) || num < 0) {
      throw new RangeError("num must be a non-negative integer.");
    }

    const result = new FVector(num);

    if (num === 0) {
      return result;
    }

    if (num === 1) {
      result.set(0, start);
      return result;
    }

    const step = endInclusive
      ? (stop - start) / (num - 1)
      : (stop - start) / num;

    for (let i = 0; i < num; i += 1) {
      result.set(i, start + i * step);
    }

    return result;
  }

  public copy(): FVector {
    return new FVector(this.floats);
  }

  public dim(): number {
    return this.floats.length;
  }

  public get(entry: number): number {
    return this.floats[entry] ?? Number.NaN;
  }

  public set(entry: number, value: number): void {
    this.floats[entry] = Math.fround(value);
  }

  public fill(
    startInclusive: number,
    endExclusive: number,
    value: number,
  ): void {
    this.floats.fill(Math.fround(value), startInclusive, endExclusive);
  }

  public sum(): number {
    let total = 0;

    for (const value of this.floats) {
      total += value;
    }

    return total;
  }

  public mean(): number {
    return this.floats.length === 0
      ? Number.NaN
      : this.sum() / this.floats.length;
  }

  public norm(): number {
    let sumSquares = 0;

    for (const value of this.floats) {
      sumSquares += value * value;
    }

    return Math.sqrt(sumSquares);
  }

  public max(): number {
    let max = Number.NEGATIVE_INFINITY;

    for (const value of this.floats) {
      max = Math.max(max, value);
    }

    return max;
  }

  public min(): number {
    let min = Number.POSITIVE_INFINITY;

    for (const value of this.floats) {
      min = Math.min(min, value);
    }

    return min;
  }

  public toArray(): number[] {
    return Array.from(this.floats);
  }
}
