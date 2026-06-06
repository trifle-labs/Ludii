// @java Common/src/graphics/qr_codes/Memoizer.java

/*
 * Fast QR Code generator library
 *
 * Copyright (c) Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/fast-qr-code-generator-library
 */

/**
 * A cache based on strong references (JavaScript has no SoftReference concept).
 * Thread-safety is not applicable in a single-threaded JS environment.
 *
 * @java graphics/qr_codes/Memoizer.java
 */
export class Memoizer<T, R> {
  /** @java Memoizer.function */
  private readonly func: (arg: T) => R;

  /** @java Memoizer.cache (ConcurrentHashMap with SoftReference values → plain Map in TS) */
  private readonly cache: Map<T, R> = new Map();

  /** Creates a memoizer based on the given function. @java Memoizer(Function) */
  public constructor(func: (arg: T) => R) {
    this.func = func;
  }

  /**
   * Computes function.apply(arg) or returns a cached copy of a previous call.
   * @java Memoizer.get(T)
   */
  public get(arg: T): R {
    const cached = this.cache.get(arg);
    if (cached !== undefined) return cached;
    const result = this.func(arg);
    this.cache.set(arg, result);
    return result;
  }
}
