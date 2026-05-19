function toFloat32(value: number): number {
  return Math.fround(value);
}

function toFloat32Array(values: ArrayLike<number>): Float32Array {
  return values instanceof Float32Array
    ? new Float32Array(values)
    : Float32Array.from(values);
}

function randomIndex(upperExclusive: number): number {
  return Math.floor(Math.random() * upperExclusive);
}

export class FVector {
  private floats: Float32Array;

  public constructor(size: number, fillValue?: number);
  public constructor(values: ArrayLike<number>);
  public constructor(sizeOrValues: number | ArrayLike<number>, fillValue = 0) {
    if (typeof sizeOrValues === "number") {
      if (!Number.isInteger(sizeOrValues) || sizeOrValues < 0) {
        throw new RangeError("Vector size must be a non-negative integer.");
      }

      this.floats = new Float32Array(sizeOrValues);

      if (fillValue !== 0) {
        this.floats.fill(toFloat32(fillValue));
      }

      return;
    }

    this.floats = toFloat32Array(sizeOrValues);
  }

  private static fromRaw(values: Float32Array): FVector {
    const vector = Object.create(FVector.prototype) as FVector;
    vector.floats = values;
    return vector;
  }

  private static resolveValues(
    values: FVector | ArrayLike<number>,
  ): Float32Array {
    return values instanceof FVector
      ? values.floats
      : values instanceof Float32Array
        ? values
        : Float32Array.from(values);
  }

  private static requireNonEmpty(vectors: readonly FVector[]): void {
    if (vectors.length === 0) {
      throw new RangeError("At least one vector is required.");
    }
  }

  private valueAt(index: number): number {
    return this.floats[index] ?? Number.NaN;
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

  public static concat(a: FVector, b: FVector): FVector {
    const result = new Float32Array(a.dim() + b.dim());
    result.set(a.floats, 0);
    result.set(b.floats, a.dim());
    return FVector.wrap(result);
  }

  public static crossEntropy(trueDist: FVector, estDist: FVector): number {
    let result = 0;

    for (let index = 0; index < trueDist.dim(); index += 1) {
      result -= trueDist.valueAt(index) * Math.log(estDist.valueAt(index));
    }

    return result;
  }

  public static elementwiseMax(a: FVector, b: FVector): FVector {
    const result = new Float32Array(a.dim());

    for (let index = 0; index < result.length; index += 1) {
      result[index] = toFloat32(Math.max(a.valueAt(index), b.valueAt(index)));
    }

    return FVector.wrap(result);
  }

  public static klDivergence(trueDist: FVector, estDist: FVector): number {
    let result = 0;

    for (let index = 0; index < trueDist.dim(); index += 1) {
      const trueValue = trueDist.valueAt(index);

      if (trueValue !== 0) {
        result -= trueValue * Math.log(estDist.valueAt(index) / trueValue);
      }
    }

    return result;
  }

  public static mean(vectors: readonly FVector[]): FVector {
    FVector.requireNonEmpty(vectors);
    const firstVector = vectors[0];

    if (firstVector === undefined) {
      throw new RangeError("At least one vector is required.");
    }

    const means = new Float32Array(firstVector.dim());

    for (const vector of vectors) {
      for (let index = 0; index < means.length; index += 1) {
        means[index] = toFloat32(
          (means[index] ?? Number.NaN) + vector.valueAt(index),
        );
      }
    }

    const meanVector = FVector.wrap(means);
    meanVector.mult(1 / vectors.length);
    return meanVector;
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

    for (let index = 0; index < num; index += 1) {
      result.set(index, start + index * step);
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
    return this.valueAt(entry);
  }

  public set(entry: number, value: number): void {
    this.floats[entry] = toFloat32(value);
  }

  public argMax(): number {
    let max = Number.NEGATIVE_INFINITY;
    let maxIndex = -1;

    for (let index = 0; index < this.floats.length; index += 1) {
      const value = this.valueAt(index);

      if (value > max) {
        max = value;
        maxIndex = index;
      }
    }

    return maxIndex;
  }

  public argMaxRand(): number {
    let max = Number.NEGATIVE_INFINITY;
    let maxIndex = -1;
    let numMaxFound = 0;

    for (let index = 0; index < this.floats.length; index += 1) {
      const value = this.valueAt(index);

      if (value > max) {
        max = value;
        maxIndex = index;
        numMaxFound = 1;
      } else if (value === max && randomIndex(++numMaxFound) === 0) {
        maxIndex = index;
      }
    }

    return maxIndex;
  }

  public argMin(): number {
    let min = Number.POSITIVE_INFINITY;
    let minIndex = -1;

    for (let index = 0; index < this.floats.length; index += 1) {
      const value = this.valueAt(index);

      if (value < min) {
        min = value;
        minIndex = index;
      }
    }

    return minIndex;
  }

  public argMinRand(): number {
    let min = Number.POSITIVE_INFINITY;
    let minIndex = -1;
    let numMinFound = 0;

    for (let index = 0; index < this.floats.length; index += 1) {
      const value = this.valueAt(index);

      if (value < min) {
        min = value;
        minIndex = index;
        numMinFound = 1;
      } else if (value === min && randomIndex(++numMinFound) === 0) {
        minIndex = index;
      }
    }

    return minIndex;
  }

  public fill(
    startInclusive: number,
    endExclusive: number,
    value: number,
  ): void {
    this.floats.fill(toFloat32(value), startInclusive, endExclusive);
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

  public abs(): void {
    for (let index = 0; index < this.floats.length; index += 1) {
      this.floats[index] = toFloat32(Math.abs(this.valueAt(index)));
    }
  }

  public add(value: number | ArrayLike<number> | FVector): void {
    if (typeof value === "number") {
      for (let index = 0; index < this.floats.length; index += 1) {
        this.floats[index] = toFloat32(this.valueAt(index) + value);
      }

      return;
    }

    const values = FVector.resolveValues(value);

    for (let index = 0; index < this.floats.length; index += 1) {
      this.floats[index] = toFloat32(
        this.valueAt(index) + (values[index] ?? Number.NaN),
      );
    }
  }

  public addToEntry(entry: number, value: number): void {
    this.floats[entry] = toFloat32(this.valueAt(entry) + value);
  }

  public addScaled(other: FVector, scalar: number): void {
    for (let index = 0; index < this.floats.length; index += 1) {
      this.floats[index] = toFloat32(
        this.valueAt(index) + other.valueAt(index) * scalar,
      );
    }
  }

  public div(scalar: number): void {
    const multiplier = 1 / scalar;

    for (let index = 0; index < this.floats.length; index += 1) {
      this.floats[index] = toFloat32(this.valueAt(index) * multiplier);
    }
  }

  public elementwiseDivision(other: FVector): void {
    for (let index = 0; index < this.floats.length; index += 1) {
      this.floats[index] = toFloat32(
        this.valueAt(index) / other.valueAt(index),
      );
    }
  }

  public hadamardProduct(other: FVector): void {
    for (let index = 0; index < this.floats.length; index += 1) {
      this.floats[index] = toFloat32(
        this.valueAt(index) * other.valueAt(index),
      );
    }
  }

  public log(): void {
    for (let index = 0; index < this.floats.length; index += 1) {
      this.floats[index] = toFloat32(Math.log(this.valueAt(index)));
    }
  }

  public mult(scalar: number): void {
    for (let index = 0; index < this.floats.length; index += 1) {
      this.floats[index] = toFloat32(this.valueAt(index) * scalar);
    }
  }

  public raiseToPower(power: number): void {
    for (let index = 0; index < this.floats.length; index += 1) {
      this.floats[index] = toFloat32(this.valueAt(index) ** power);
    }
  }

  public normalise(): void {
    const sum = this.sum();

    if (sum === 0) {
      if (this.floats.length === 0) {
        return;
      }

      this.floats.fill(toFloat32(1 / this.floats.length));
      return;
    }

    const scalar = 1 / sum;

    for (let index = 0; index < this.floats.length; index += 1) {
      this.floats[index] = toFloat32(this.valueAt(index) * scalar);
    }
  }

  public sign(): void {
    for (let index = 0; index < this.floats.length; index += 1) {
      const value = this.valueAt(index);
      this.floats[index] = value > 0 ? 1 : value < 0 ? -1 : 0;
    }
  }

  public softmax(temperature = 1): void {
    const max = this.max();
    let sumExponents = 0;

    for (let index = 0; index < this.floats.length; index += 1) {
      const exponent = Math.exp((this.valueAt(index) - max) / temperature);
      sumExponents += exponent;
      this.floats[index] = toFloat32(exponent);
    }

    this.div(sumExponents);
  }

  public updateSoftmaxInvalidate(invalidEntry: number): void {
    const invalidProbability = this.floats[invalidEntry] ?? 0;
    this.floats[invalidEntry] = 0;

    if (invalidProbability < 1) {
      const scalar = 1 / (1 - invalidProbability);

      for (let index = 0; index < this.floats.length; index += 1) {
        this.floats[index] = toFloat32(this.valueAt(index) * scalar);
      }
    }
  }

  public sqrt(): void {
    for (let index = 0; index < this.floats.length; index += 1) {
      this.floats[index] = toFloat32(Math.sqrt(this.valueAt(index)));
    }
  }

  public subtract(value: number | ArrayLike<number> | FVector): void {
    if (typeof value === "number") {
      for (let index = 0; index < this.floats.length; index += 1) {
        this.floats[index] = toFloat32(this.valueAt(index) - value);
      }

      return;
    }

    const values = FVector.resolveValues(value);

    for (let index = 0; index < this.floats.length; index += 1) {
      this.floats[index] = toFloat32(
        this.valueAt(index) - (values[index] ?? Number.NaN),
      );
    }
  }

  public sampleFromDistribution(): number {
    const random = Math.random();
    let accumulated = 0;

    for (let index = 0; index < this.floats.length; index += 1) {
      accumulated += this.valueAt(index);

      if (random < accumulated) {
        return index;
      }
    }

    for (let index = this.floats.length - 1; index > 0; index -= 1) {
      if (this.valueAt(index) > 0) {
        return index;
      }
    }

    return 0;
  }

  public sampleProportionally(): number {
    const sum = this.sum();

    if (sum === 0) {
      return randomIndex(this.floats.length);
    }

    const random = Math.random();
    let accumulated = 0;

    for (let index = 0; index < this.floats.length; index += 1) {
      accumulated += this.valueAt(index) / sum;

      if (random < accumulated) {
        return index;
      }
    }

    return this.floats.length - 1;
  }

  public dot(other: FVector): number {
    let sum = 0;

    for (let index = 0; index < this.floats.length; index += 1) {
      sum += this.valueAt(index) * other.valueAt(index);
    }

    return sum;
  }

  public dotSparse(sparseBinary: ArrayLike<number>, offset = 0): number {
    let sum = 0;

    for (let index = 0; index < sparseBinary.length; index += 1) {
      sum += this.floats[(sparseBinary[index] ?? Number.NaN) + offset] ?? 0;
    }

    return sum;
  }

  public normalisedEntropy(): number {
    const dimension = this.dim();

    if (dimension <= 1) {
      return 0;
    }

    let entropy = 0;

    for (let index = 0; index < dimension; index += 1) {
      const probability = this.valueAt(index);

      if (probability > 0) {
        entropy -= probability * Math.log(probability);
      }
    }

    return entropy / Math.log(dimension);
  }

  public containsNaN(): boolean {
    return this.floats.some((value) => Number.isNaN(value));
  }

  public copyFrom(
    src: FVector,
    srcPos: number,
    destPos: number,
    length: number,
  ): void {
    this.floats.set(src.floats.subarray(srcPos, srcPos + length), destPos);
  }

  public range(fromInclusive: number, toExclusive: number): FVector {
    return FVector.wrap(this.floats.slice(fromInclusive, toExclusive));
  }

  public append(newValue: number): FVector {
    const next = new Float32Array(this.floats.length + 1);
    next.set(this.floats, 0);
    next[this.floats.length] = toFloat32(newValue);
    return FVector.wrap(next);
  }

  public cut(entry: number): FVector;
  public cut(startEntryInclusive: number, endEntryExclusive: number): FVector;
  public cut(
    startEntryInclusive: number,
    endEntryExclusive = startEntryInclusive + 1,
  ): FVector {
    const result = new Float32Array(
      this.floats.length - (endEntryExclusive - startEntryInclusive),
    );
    result.set(this.floats.subarray(0, startEntryInclusive), 0);
    result.set(this.floats.subarray(endEntryExclusive), startEntryInclusive);
    return FVector.wrap(result);
  }

  public insert(index: number, value: number): FVector;
  public insert(index: number, values: ArrayLike<number>): FVector;
  public insert(
    index: number,
    valueOrValues: number | ArrayLike<number>,
  ): FVector {
    const values =
      typeof valueOrValues === "number"
        ? Float32Array.of(toFloat32(valueOrValues))
        : toFloat32Array(valueOrValues);
    const result = new Float32Array(this.floats.length + values.length);
    result.set(this.floats.subarray(0, index), 0);
    result.set(values, index);
    result.set(this.floats.subarray(index), index + values.length);
    return FVector.wrap(result);
  }

  public toArray(): number[] {
    return Array.from(this.floats);
  }

  public toLine(): string {
    return this.toArray().join(",");
  }

  public hashCode(): number {
    const view = new DataView(
      this.floats.buffer,
      this.floats.byteOffset,
      this.floats.byteLength,
    );
    let innerHash = 1;

    for (let index = 0; index < this.floats.length; index += 1) {
      const bits = view.getInt32(index * 4, true);
      innerHash = (Math.imul(31, innerHash) + bits) | 0;
    }

    return (Math.imul(31, 1) + innerHash) | 0;
  }

  public equals(other: unknown): boolean {
    if (!(other instanceof FVector) || other.dim() !== this.dim()) {
      return false;
    }

    return this.floats.every((value, index) => value === other.floats[index]);
  }

  public toString(): string {
    return `[${this.toLine()}]`;
  }
}
