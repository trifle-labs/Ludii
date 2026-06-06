// @java Common/src/main/math/statistics/Sampling.java

/**
 * Some utilities for sampling.
 *
 * @java main/math/statistics/Sampling.java
 * @author Dennis Soemers
 */
export class Sampling {

  //-------------------------------------------------------------------------

  /**
   * Private constructor — static utility class.
   * @java Sampling()
   */
  private constructor() {
    // Don't need constructor
  }

  //-------------------------------------------------------------------------

  /**
   * @param sampleSize Number of samples to take
   * @param list List to sample from
   * @return New list of samples, sampled from given list with replacement
   * @java Sampling.sampleWithReplacement(int, TDoubleArrayList)
   */
  public static sampleWithReplacement(sampleSize: number, list: number[]): number[] {
    const samples: number[] = new Array<number>(sampleSize);

    for (let i = 0; i < sampleSize; ++i) {
      samples[i] = list[Math.floor(Math.random() * list.length)] as number;
    }

    return samples;
  }

  //-------------------------------------------------------------------------
}
