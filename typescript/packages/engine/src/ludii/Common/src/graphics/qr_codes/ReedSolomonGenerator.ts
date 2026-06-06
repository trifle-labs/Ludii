// @java Common/src/graphics/qr_codes/ReedSolomonGenerator.java

/*
 * Fast QR Code generator library
 *
 * Copyright (c) Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/fast-qr-code-generator-library
 */

import { Memoizer } from "./Memoizer.js";

/**
 * Computes Reed-Solomon error correction codewords for given data codewords.
 *
 * @java graphics/qr_codes/ReedSolomonGenerator.java
 */
export class ReedSolomonGenerator {
  /** Use this memoizer to get instances of this class. @java ReedSolomonGenerator.MEMOIZER */
  public static readonly MEMOIZER: Memoizer<number, ReedSolomonGenerator>
    = new Memoizer<number, ReedSolomonGenerator>((degree) => new ReedSolomonGenerator(degree));

  /**
   * A table of size 256 * degree, where polynomialMultiply[i][j] = multiply(i, coefficients[j]).
   * @java ReedSolomonGenerator.polynomialMultiply
   */
  private readonly polynomialMultiply: Int8Array[];

  /**
   * Creates a Reed-Solomon ECC generator polynomial for the given degree.
   * @java ReedSolomonGenerator(int)
   */
  private constructor(degree: number) {
    if (degree < 1 || degree > 255) {
      throw new Error("Degree out of range");
    }

    // The divisor polynomial, coefficients stored from highest to lowest power.
    const coefficients = new Int8Array(degree);
    coefficients[degree - 1] = 1;  // Start off with the monomial x^0

    // Compute the product polynomial (x - r^0) * (x - r^1) * ... * (x - r^{degree-1})
    let root = 1;
    for (let i = 0; i < degree; i++) {
      for (let j = 0; j < coefficients.length; j++) {
        const cj = coefficients[j];
        if (cj === undefined) throw new Error("coefficients access out of range");
        coefficients[j] = ReedSolomonGenerator.multiply(cj & 0xFF, root) as number as unknown as number & 0;
        // Java: (byte)multiply(...) - store low 8 bits signed
        coefficients[j] = (ReedSolomonGenerator.multiply(cj & 0xFF, root) & 0xFF) << 24 >> 24;
        if (j + 1 < coefficients.length) {
          const next = coefficients[j + 1];
          if (next !== undefined) {
            coefficients[j] = (coefficients[j]! ^ next);
          }
        }
      }
      root = ReedSolomonGenerator.multiply(root, 0x02);
    }

    this.polynomialMultiply = [];
    for (let i = 0; i < 256; i++) {
      const row = new Int8Array(degree);
      for (let j = 0; j < degree; j++) {
        const cj = coefficients[j];
        if (cj === undefined) throw new Error("coefficients access out of range");
        row[j] = ((ReedSolomonGenerator.multiply(i, cj & 0xFF) & 0xFF) << 24 >> 24);
      }
      this.polynomialMultiply.push(row);
    }
  }

  /**
   * Returns the error correction codeword for the given data polynomial and this divisor polynomial.
   * @java ReedSolomonGenerator.getRemainder(byte[], int, int, byte[])
   */
  public getRemainder(data: Uint8Array, dataOff: number, dataLen: number, result: Int8Array): void {
    const degree = this.polynomialMultiply[0]!.length;

    result.fill(0);
    for (let i = dataOff, dataEnd = dataOff + dataLen; i < dataEnd; i++) {
      const dataByte = data[i];
      if (dataByte === undefined) throw new Error("data array access out of range");
      const r0 = result[0];
      if (r0 === undefined) throw new Error("result array access out of range");
      const table = this.polynomialMultiply[((dataByte ^ r0) & 0xFF)];
      if (!table) throw new Error("polynomialMultiply table access out of range");
      for (let j = 0; j < degree - 1; j++) {
        const r1 = result[j + 1];
        if (r1 === undefined) throw new Error("result access out of range");
        const t = table[j];
        if (t === undefined) throw new Error("table access out of range");
        result[j] = ((r1 ^ t) & 0xFF) << 24 >> 24;
      }
      const tLast = table[degree - 1];
      if (tLast === undefined) throw new Error("table access out of range");
      result[degree - 1] = (tLast & 0xFF) << 24 >> 24;
    }
  }

  /**
   * Returns the product of the two given field elements modulo GF(2^8/0x11D).
   * @java ReedSolomonGenerator.multiply(int, int)
   */
  private static multiply(x: number, y: number): number {
    // Russian peasant multiplication
    let z = 0;
    for (let i = 7; i >= 0; i--) {
      z = (z << 1) ^ (((z >>> 7) & 1) * 0x11D);
      z ^= (((y >>> i) & 1) * x);
    }
    return z & 0xFF;
  }
}
