// @java Common/src/main/collections/FVector.java

/**
 * Wrapper around an array of floats, with various "vectorised" methods.
 *
 * @java main.collections.FVector
 * @author Dennis Soemers
 */
export class FVector {
  // -------------------------------------------------------------------------

  /** Our raw array of floats */
  protected readonly floats: Float32Array;

  // -------------------------------------------------------------------------

  /**
   * Creates a new vector of dimensionality d (filled with 0s)
   * @java FVector(int)
   */
  public constructor(d: number);
  /**
   * Creates a new vector of dimensionality d filled with the given value
   * @java FVector(int, float)
   */
  public constructor(d: number, fillValue: number);
  /**
   * Creates a new vector with a copy of the given array of floats as data.
   * @java FVector(float[])
   */
  public constructor(floats: Float32Array);
  /**
   * Copy constructor
   * @java FVector(FVector)
   */
  public constructor(other: FVector);
  /**
   * Creates a new vector that "steals" the given array of floats if steal = true.
   * @java FVector(float[], boolean)
   */
  public constructor(floats: Float32Array, steal: boolean);
  public constructor(arg: number | Float32Array | FVector, arg2?: number | boolean) {
    if (typeof arg === "number") {
      this.floats = new Float32Array(arg);
      if (arg2 !== undefined && arg2 !== false) {
        this.floats.fill(arg2 as number);
      }
    } else if (arg instanceof FVector) {
      this.floats = new Float32Array(arg.floats);
    } else if (arg instanceof Float32Array) {
      if (arg2 === true) {
        // steal
        this.floats = arg;
      } else {
        this.floats = new Float32Array(arg);
      }
    } else {
      throw new Error("Invalid constructor args");
    }
  }

  /**
   * @return A copy of this vector
   * @java FVector.copy()
   */
  public copy(): FVector {
    return new FVector(this);
  }

  // -------------------------------------------------------------------------

  /**
   * @param d Dimensionality
   * @return A vector filled with 1s of the given dimensionality
   * @java FVector.ones(int)
   */
  public static ones(d: number): FVector {
    const ones = new FVector(d);
    ones.fill(0, d, 1.0);
    return ones;
  }

  /**
   * @param d Dimensionality
   * @return A vector filled with 0s of the given dimensionality
   * @java FVector.zeros(int)
   */
  public static zeros(d: number): FVector {
    return new FVector(d);
  }

  /**
   * Note that this method will "steal" the array it is given.
   * @java FVector.wrap(float[])
   */
  public static wrap(floats: Float32Array): FVector {
    return new FVector(floats, true);
  }

  // -------------------------------------------------------------------------

  /**
   * @return Index of the maximum value in this vector
   * @java FVector.argMax()
   */
  public argMax(): number {
    let max = -Infinity;
    const d = this.floats.length;
    let maxIdx = -1;
    for (let i = 0; i < d; ++i) {
      if (this.floats[i]! > max) {
        max = this.floats[i]!;
        maxIdx = i;
      }
    }
    return maxIdx;
  }

  /**
   * @return Index of the maximum value in this vector, with random tie-breaking
   * @java FVector.argMaxRand()
   */
  public argMaxRand(): number {
    let max = -Infinity;
    const d = this.floats.length;
    let maxIdx = -1;
    let numMaxFound = 0;
    for (let i = 0; i < d; ++i) {
      const val = this.floats[i]!;
      if (val > max) {
        max = val;
        maxIdx = i;
        numMaxFound = 1;
      } else if (val === max && Math.random() * ++numMaxFound < 1) {
        maxIdx = i;
      }
    }
    return maxIdx;
  }

  /**
   * @return Index of the minimum value in this vector
   * @java FVector.argMin()
   */
  public argMin(): number {
    let min = Infinity;
    const d = this.floats.length;
    let minIdx = -1;
    for (let i = 0; i < d; ++i) {
      if (this.floats[i]! < min) {
        min = this.floats[i]!;
        minIdx = i;
      }
    }
    return minIdx;
  }

  /**
   * @return Index of the minimum value in this vector, with random tie-breaking
   * @java FVector.argMinRand()
   */
  public argMinRand(): number {
    let min = Infinity;
    const d = this.floats.length;
    let minIdx = -1;
    let numMinFound = 0;
    for (let i = 0; i < d; ++i) {
      const val = this.floats[i]!;
      if (val < min) {
        min = val;
        minIdx = i;
        numMinFound = 1;
      } else if (val === min && Math.random() * ++numMinFound < 1) {
        minIdx = i;
      }
    }
    return minIdx;
  }

  /**
   * @return Dimensionality of the vector
   * @java FVector.dim()
   */
  public dim(): number {
    return this.floats.length;
  }

  /**
   * @param entry
   * @return Entry at given index
   * @java FVector.get(int)
   */
  public get(entry: number): number {
    return this.floats[entry]!;
  }

  /**
   * @return Maximum value in this vector
   * @java FVector.max()
   */
  public max(): number {
    let max = -Infinity;
    const d = this.floats.length;
    for (let i = 0; i < d; ++i) {
      if (this.floats[i]! > max) {
        max = this.floats[i]!;
      }
    }
    return max;
  }

  /**
   * @return Minimum value in this vector
   * @java FVector.min()
   */
  public min(): number {
    let min = Infinity;
    const d = this.floats.length;
    for (let i = 0; i < d; ++i) {
      if (this.floats[i]! < min) {
        min = this.floats[i]!;
      }
    }
    return min;
  }

  /**
   * @return Mean of all the entries in this vector
   * @java FVector.mean()
   */
  public mean(): number {
    return this.sum() / this.floats.length;
  }

  /**
   * @return The norm (L2-norm) of the vector
   * @java FVector.norm()
   */
  public norm(): number {
    let sumSquares = 0.0;
    const d = this.floats.length;
    for (let i = 0; i < d; ++i) {
      sumSquares += this.floats[i]! * this.floats[i]!;
    }
    return Math.sqrt(sumSquares);
  }

  /**
   * Sets the given entry to the given value
   * @java FVector.set(int, float)
   */
  public set(entry: number, value: number): void {
    this.floats[entry] = value;
  }

  /**
   * @return Sum of the values in this vector
   * @java FVector.sum()
   */
  public sum(): number {
    let sum = 0.0;
    const d = this.floats.length;
    for (let i = 0; i < d; ++i) {
      sum += this.floats[i]!;
    }
    return sum;
  }

  // -------------------------------------------------------------------------

  /**
   * Replaces every entry in the vector with the absolute value of that entry.
   * @java FVector.abs()
   */
  public abs(): void {
    const d = this.floats.length;
    for (let i = 0; i < d; ++i) {
      this.floats[i] = Math.abs(this.floats[i]!);
    }
  }

  /**
   * Adds the given value to all entries.
   * @java FVector.add(float)
   */
  public add(value: number): void;
  /**
   * Adds the entries in the given array to the corresponding entries.
   * @java FVector.add(float[])
   */
  public add(toAdd: Float32Array): void;
  /**
   * Adds the given other vector to this one.
   * @java FVector.add(FVector)
   */
  public add(other: FVector): void;
  public add(arg: number | Float32Array | FVector): void {
    if (typeof arg === "number") {
      const d = this.floats.length;
      for (let i = 0; i < d; ++i) this.floats[i] = this.floats[i]! + arg;
    } else if (arg instanceof FVector) {
      this.add(arg.floats);
    } else {
      const d = this.floats.length;
      for (let i = 0; i < d; ++i) this.floats[i] = this.floats[i]! + arg[i]!;
    }
  }

  /**
   * Adds the given value to one specific entry.
   * @java FVector.addToEntry(int, float)
   */
  public addToEntry(entry: number, value: number): void {
    this.floats[entry] = this.floats[entry]! + value;
  }

  /**
   * Adds the given other vector, scaled by the given scalar, to this one.
   * @java FVector.addScaled(FVector, float)
   */
  public addScaled(other: FVector, scalar: number): void {
    const d = this.floats.length;
    const otherFloats = other.floats;
    for (let i = 0; i < d; ++i) {
      this.floats[i] = this.floats[i]! + otherFloats[i]! * scalar;
    }
  }

  /**
   * Divides the vector by the given scalar.
   * @java FVector.div(float)
   */
  public div(scalar: number): void {
    const d = this.floats.length;
    const mult = 1.0 / scalar;
    for (let i = 0; i < d; ++i) {
      this.floats[i] = this.floats[i]! * mult;
    }
  }

  /**
   * Performs element-wise division by the other vector.
   * @java FVector.elementwiseDivision(FVector)
   */
  public elementwiseDivision(other: FVector): void {
    const d = this.floats.length;
    const otherFloats = other.floats;
    for (let i = 0; i < d; ++i) {
      this.floats[i] = this.floats[i]! / otherFloats[i]!;
    }
  }

  /**
   * Computes the hadamard (element-wise) product with other vector.
   * @java FVector.hadamardProduct(FVector)
   */
  public hadamardProduct(other: FVector): void {
    const d = this.floats.length;
    const otherFloats = other.floats;
    for (let i = 0; i < d; ++i) {
      this.floats[i] = this.floats[i]! * otherFloats[i]!;
    }
  }

  /**
   * Takes the natural logarithm of every entry.
   * @java FVector.log()
   */
  public log(): void {
    const d = this.floats.length;
    for (let i = 0; i < d; ++i) {
      this.floats[i] = Math.log(this.floats[i]!);
    }
  }

  /**
   * Multiplies the vector with the given scalar.
   * @java FVector.mult(float)
   */
  public mult(scalar: number): void {
    const d = this.floats.length;
    for (let i = 0; i < d; ++i) {
      this.floats[i] = this.floats[i]! * scalar;
    }
  }

  /**
   * Raises all entries in the vector to the given power.
   * @java FVector.raiseToPower(double)
   */
  public raiseToPower(power: number): void {
    const d = this.floats.length;
    for (let i = 0; i < d; ++i) {
      this.floats[i] = Math.pow(this.floats[i]!, power);
    }
  }

  /**
   * Normalises this vector such that it sums up to 1.
   * @java FVector.normalise()
   */
  public normalise(): void {
    const d = this.floats.length;

    let sum = 0.0;
    for (let i = 0; i < d; ++i) {
      sum += this.floats[i]!;
    }

    if (sum === 0.0) {
      // Probably a single-element vector with a 0.f entry; just make it uniform
      this.floats.fill(1.0 / this.floats.length);
    } else {
      const scalar = 1.0 / sum;
      for (let i = 0; i < d; ++i) {
        this.floats[i] = this.floats[i]! * scalar;
      }
    }
  }

  /**
   * Replaces every entry in the vector with the sign of that entry (-1, 0, or +1).
   * @java FVector.sign()
   */
  public sign(): void {
    const d = this.floats.length;
    for (let i = 0; i < d; ++i) {
      this.floats[i] = this.floats[i]! > 0.0 ? +1.0 : (this.floats[i]! < 0.0 ? -1.0 : 0.0);
    }
  }

  /**
   * Computes the softmax of this vector.
   * @java FVector.softmax()
   */
  public softmax(): void;
  /**
   * Computes the softmax of this vector with a temperature parameter.
   * @java FVector.softmax(double)
   */
  public softmax(temperature: number): void;
  public softmax(temperature?: number): void {
    const d = this.floats.length;
    const maxVal = this.max();
    let sumExponents = 0.0;

    if (temperature === undefined) {
      for (let i = 0; i < d; ++i) {
        const exp = Math.exp(this.floats[i]! - maxVal);
        sumExponents += exp;
        this.floats[i] = exp;
      }
    } else {
      for (let i = 0; i < d; ++i) {
        const exp = Math.exp((this.floats[i]! - maxVal) / temperature);
        sumExponents += exp;
        this.floats[i] = exp;
      }
    }

    this.div(sumExponents);
  }

  /**
   * Incrementally updates the softmax vector to account for the new information
   * that the entry at the given index is invalid.
   * @java FVector.updateSoftmaxInvalidate(int)
   */
  public updateSoftmaxInvalidate(invalidEntry: number): void {
    const invalidProb = this.floats[invalidEntry]!;
    this.floats[invalidEntry] = 0.0;

    if (invalidProb < 1.0) {
      const scalar = 1.0 / (1.0 - invalidProb);
      const d = this.floats.length;
      for (let i = 0; i < d; ++i) {
        this.floats[i] = this.floats[i]! * scalar;
      }
    }
  }

  /**
   * Takes the square root of every element in the vector
   * @java FVector.sqrt()
   */
  public sqrt(): void {
    const d = this.floats.length;
    for (let i = 0; i < d; ++i) {
      this.floats[i] = Math.sqrt(this.floats[i]!);
    }
  }

  /**
   * Subtracts the given value from all entries.
   * @java FVector.subtract(float)
   */
  public subtract(value: number): void;
  /**
   * Subtracts the entries in the given array from the corresponding entries.
   * @java FVector.subtract(float[])
   */
  public subtract(toSubtract: Float32Array): void;
  /**
   * Subtracts the given other vector from this one.
   * @java FVector.subtract(FVector)
   */
  public subtract(other: FVector): void;
  public subtract(arg: number | Float32Array | FVector): void {
    if (typeof arg === "number") {
      const d = this.floats.length;
      for (let i = 0; i < d; ++i) this.floats[i] = this.floats[i]! - arg;
    } else if (arg instanceof FVector) {
      this.subtract(arg.floats);
    } else {
      const d = this.floats.length;
      for (let i = 0; i < d; ++i) this.floats[i] = this.floats[i]! - arg[i]!;
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Samples an index from the discrete distribution encoded by this vector.
   * @java FVector.sampleFromDistribution()
   */
  public sampleFromDistribution(): number {
    const rand = Math.random();
    const d = this.floats.length;

    let accum = 0.0;
    for (let i = 0; i < d; ++i) {
      accum += this.floats[i]!;
      if (rand < accum) {
        return i;
      }
    }

    // floating point inaccuracies fallback
    for (let i = d - 1; i > 0; --i) {
      if (this.floats[i]! > 0.0)
        return i;
    }

    return 0;
  }

  /**
   * Samples an index proportional to the values in this vector.
   * @java FVector.sampleProportionally()
   */
  public sampleProportionally(): number {
    const sum = this.sum();

    if (sum === 0.0) {
      return Math.floor(Math.random() * this.floats.length);
    }

    const rand = Math.random();
    const d = this.floats.length;

    let accum = 0.0;
    for (let i = 0; i < d; ++i) {
      accum += this.floats[i]! / sum;
      if (rand < accum) {
        return i;
      }
    }

    return d - 1;
  }

  // -------------------------------------------------------------------------

  /**
   * @param other
   * @return Computes the dot product with the other vector
   * @java FVector.dot(FVector)
   */
  public dot(other: FVector): number {
    let sum = 0.0;
    const otherFloats = other.floats;
    const d = this.floats.length;
    for (let i = 0; i < d; ++i) {
      sum += this.floats[i]! * otherFloats[i]!;
    }
    return sum;
  }

  /**
   * @param sparseBinary Sparse binary vector (array of indices)
   * @return Dot product between this vector and a sparse binary vector
   * @java FVector.dotSparse(TIntArrayList)
   */
  public dotSparse(sparseBinary: number[]): number;
  /**
   * @param sparseBinary Sparse binary vector (array of indices)
   * @param offset We'll add this offset to every index
   * @java FVector.dotSparse(TIntArrayList, int)
   */
  public dotSparse(sparseBinary: number[], offset: number): number;
  public dotSparse(sparseBinary: number[], offset = 0): number {
    let sum = 0.0;
    const numOnes = sparseBinary.length;
    for (let i = 0; i < numOnes; ++i) {
      sum += this.floats[sparseBinary[i]! + offset]!;
    }
    return sum;
  }

  /**
   * @return Normalised entropy of the vector (assumed to be a distribution)
   * @java FVector.normalisedEntropy()
   */
  public normalisedEntropy(): number {
    const dim = this.dim();

    if (dim <= 1)
      return 0.0;

    let entropy = 0.0;

    for (let i = 0; i < dim; ++i) {
      const prob = this.floats[i]!;
      if (prob > 0.0)
        entropy -= prob * Math.log(prob);
    }

    return (entropy / Math.log(dim));
  }

  /**
   * @return True if this vector contains at least one NaN entry.
   * @java FVector.containsNaN()
   */
  public containsNaN(): boolean {
    for (let i = 0; i < this.floats.length; ++i) {
      if (isNaN(this.floats[i]!))
        return true;
    }
    return false;
  }

  // -------------------------------------------------------------------------

  /**
   * Fills a block of this vector with the given value
   * @java FVector.fill(int, int, float)
   */
  public fill(startInclusive: number, endExclusive: number, val: number): void {
    this.floats.fill(val, startInclusive, endExclusive);
  }

  /**
   * Copies floats from given vector into this vector
   * @java FVector.copyFrom(FVector, int, int, int)
   */
  public copyFrom(src: FVector, srcPos: number, destPos: number, length: number): void {
    for (let i = 0; i < length; i++)
      this.floats[destPos + i] = src.floats[srcPos + i]!;
  }

  /**
   * @param fromInclusive
   * @param toExclusive
   * @return New vector containing only the part in the given range of indices
   * @java FVector.range(int, int)
   */
  public range(fromInclusive: number, toExclusive: number): FVector {
    const newArr = this.floats.slice(fromInclusive, toExclusive);
    return FVector.wrap(newArr);
  }

  // -------------------------------------------------------------------------

  /**
   * @param newValue
   * @return A new vector with the given value appended as extra entry
   * @java FVector.append(float)
   */
  public append(newValue: number): FVector {
    const newVector = new FVector(this.floats.length + 1);
    for (let i = 0; i < this.floats.length; i++) newVector.floats[i] = this.floats[i]!;
    newVector.floats[this.floats.length] = newValue;
    return newVector;
  }

  /**
   * @param entry
   * @return A new vector where the given entry is cut out
   * @java FVector.cut(int)
   */
  public cut(entry: number): FVector;
  /**
   * @param startEntryInclusive
   * @param endEntryExclusive
   * @return A new vector where all entries between startEntryInclusive and endEntryExclusive are cut out
   * @java FVector.cut(int, int)
   */
  public cut(startEntryInclusive: number, endEntryExclusive: number): FVector;
  public cut(startEntryInclusive: number, endEntryExclusive?: number): FVector {
    if (endEntryExclusive === undefined)
      endEntryExclusive = startEntryInclusive + 1;
    const newD = this.floats.length - (endEntryExclusive - startEntryInclusive);
    const newVector = new FVector(newD);
    for (let i = 0; i < startEntryInclusive; i++) newVector.floats[i] = this.floats[i]!;
    for (let i = endEntryExclusive; i < this.floats.length; i++)
      newVector.floats[startEntryInclusive + (i - endEntryExclusive)] = this.floats[i]!;
    return newVector;
  }

  /**
   * @param index
   * @param value
   * @return A new vector where the given extra value is inserted at the given index
   * @java FVector.insert(int, float)
   */
  public insert(index: number, value: number): FVector;
  /**
   * @param index
   * @param values
   * @return A new vector with the given block of values inserted at the given index
   * @java FVector.insert(int, float[])
   */
  public insert(index: number, values: Float32Array): FVector;
  public insert(index: number, valueOrValues: number | Float32Array): FVector {
    if (typeof valueOrValues === "number") {
      const newVector = new FVector(this.floats.length + 1);
      for (let i = 0; i < index; i++) newVector.floats[i] = this.floats[i]!;
      newVector.floats[index] = valueOrValues;
      for (let i = index; i < this.floats.length; i++) newVector.floats[i + 1] = this.floats[i]!;
      return newVector;
    } else {
      const values = valueOrValues;
      const newVector = new FVector(this.floats.length + values.length);
      for (let i = 0; i < index; i++) newVector.floats[i] = this.floats[i]!;
      for (let i = 0; i < values.length; i++) newVector.floats[index + i] = values[i]!;
      for (let i = index; i < this.floats.length; i++) newVector.floats[i + values.length] = this.floats[i]!;
      return newVector;
    }
  }

  /**
   * @param a
   * @param b
   * @return The concatenation of two vectors a and b (new object)
   * @java FVector.concat(FVector, FVector)
   */
  public static concat(a: FVector, b: FVector): FVector {
    const concat = new FVector(a.dim() + b.dim());
    for (let i = 0; i < a.dim(); i++) concat.floats[i] = a.floats[i]!;
    for (let i = 0; i < b.dim(); i++) concat.floats[a.dim() + i] = b.floats[i]!;
    return concat;
  }

  // -------------------------------------------------------------------------

  /**
   * @param trueDist
   * @param estDist
   * @return Cross-entropy between a "true" and an "estimated" distribution
   * @java FVector.crossEntropy(FVector, FVector)
   */
  public static crossEntropy(trueDist: FVector, estDist: FVector): number {
    const d = trueDist.dim();
    const trueFloats = trueDist.floats;
    const estFloats = estDist.floats;
    let result = 0.0;

    for (let i = 0; i < d; ++i) {
      result -= trueFloats[i]! * Math.log(estFloats[i]!);
    }

    return result;
  }

  /**
   * @param a
   * @param b
   * @return A new vector containing the element-wise maximum value of the two given vectors.
   * @java FVector.elementwiseMax(FVector, FVector)
   */
  public static elementwiseMax(a: FVector, b: FVector): FVector {
    const d = a.dim();
    const aFloats = a.floats;
    const bFloats = b.floats;
    const result = new Float32Array(d);

    for (let i = 0; i < d; ++i) {
      result[i] = Math.max(aFloats[i]!, bFloats[i]!);
    }

    return FVector.wrap(result);
  }

  /**
   * @param trueDist
   * @param estDist
   * @return KL Divergence = D_{KL} (trueDist || estDist)
   * @java FVector.klDivergence(FVector, FVector)
   */
  public static klDivergence(trueDist: FVector, estDist: FVector): number {
    const d = trueDist.dim();
    const trueFloats = trueDist.floats;
    const estFloats = estDist.floats;
    let result = 0.0;

    for (let i = 0; i < d; ++i) {
      if (trueFloats[i]! !== 0.0) {
        result -= trueFloats[i]! * Math.log(estFloats[i]! / trueFloats[i]!);
      }
    }

    return result;
  }

  /**
   * @param vectors
   * @return The mean vector from the given array of vectors
   * @java FVector.mean(FVector[])
   */
  public static mean(vectors: FVector[]): FVector {
    const d = vectors[0]!.dim();
    const means = new Float32Array(d);

    for (const vector of vectors) {
      const vals = vector.floats;
      for (let i = 0; i < d; ++i) {
        means[i] = means[i]! + vals[i]!;
      }
    }

    const meanVector = FVector.wrap(means);
    meanVector.mult(1.0 / vectors.length);
    return meanVector;
  }

  // -------------------------------------------------------------------------

  /**
   * Similar to numpy's linspace function. Creates a vector with evenly-spaced numbers.
   * @java FVector.linspace(float, float, int, boolean)
   */
  public static linspace(start: number, stop: number, num: number, endInclusive: boolean): FVector {
    const result = new FVector(num);

    const step = endInclusive ? (stop - start) / (num - 1) : (stop - start) / num;

    for (let i = 0; i < num; ++i) {
      result.set(i, start + i * step);
    }

    return result;
  }

  // -------------------------------------------------------------------------

  /**
   * @return A string representation of this vector containing only numbers and commas.
   * @java FVector.toLine()
   */
  public toLine(): string {
    let result = "";
    for (let i = 0; i < this.floats.length; ++i) {
      result += this.floats[i]!;
      if (i < this.floats.length - 1) {
        result += ",";
      }
    }
    return result;
  }

  /** @java FVector.toString() */
  public toString(): string {
    return "[" + this.toLine() + "]";
  }

  // -------------------------------------------------------------------------

  /** @java FVector.hashCode() */
  public hashCode(): number {
    const prime = 31;
    let result = 1;
    for (let i = 0; i < this.floats.length; i++) {
      result = prime * result + (this.floats[i]! * 1000 | 0);
    }
    return result;
  }

  /** @java FVector.equals(Object) */
  public equals(obj: unknown): boolean {
    if (this === obj)
      return true;

    if (obj === null || !(obj instanceof FVector))
      return false;

    const other = obj as FVector;
    if (this.floats.length !== other.floats.length)
      return false;

    for (let i = 0; i < this.floats.length; i++) {
      if (this.floats[i]! !== other.floats[i]!)
        return false;
    }

    return true;
  }

  // -------------------------------------------------------------------------
}
