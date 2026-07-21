// @java Common/src/main/math/statistics/KolmogorovSmirnov.java

/**
 * Code to compute Kolmogorov-Smirnov statistics for pairs of
 * empirical distributions.
 *
 * @java main/math/statistics/KolmogorovSmirnov.java
 * @author Dennis Soemers
 */
export class KolmogorovSmirnov {

  //-------------------------------------------------------------------------

  /**
   * Private constructor — static utility class.
   * @java KolmogorovSmirnov()
   */
  private constructor() {
    // Don't need constructor
  }

  //-------------------------------------------------------------------------

  /**
   * @param distA
   * @param distB
   * @return Kolmogorov-Smirnov statistic (or "distance") for two given empirical distributions
   * @java KolmogorovSmirnov.kolmogorovSmirnovStatistic(TDoubleArrayList, TDoubleArrayList)
   */
  public static kolmogorovSmirnovStatistic(distA: number[], distB: number[]): number {
    // Sort both distributions
    const sortedA = [...distA].sort((a, b) => a - b);
    const sortedB = [...distB].sort((a, b) => a - b);

    // Loop through both distributions simultaneously and find point of maximum deviation
    const sampleSizeA = sortedA.length;
    const sampleSizeB = sortedB.length;

    let currIdxA = 0;
    let currIdxB = 0;
    let cumulProbA = 0.0;
    let cumulProbB = 0.0;

    let maxDeviation = 0.0;

    while (currIdxA < sampleSizeA || currIdxB < sampleSizeB) {
      const valA = (currIdxA === sampleSizeA) ? Infinity : (sortedA[currIdxA] as number);
      const valB = (currIdxB === sampleSizeB) ? Infinity : (sortedB[currIdxB] as number);

      const currVal = Math.min(valA, valB);
      if (!isFinite(currVal)) {
        // Should never happen
        console.error("ERROR: currVal is infinite!");
        break;
      }

      let nextValA = (currIdxA === sampleSizeA) ? Infinity : (sortedA[currIdxA] as number);
      while (nextValA <= currVal) {
        cumulProbA += 1.0 / sampleSizeA;
        ++currIdxA;
        nextValA = (currIdxA === sampleSizeA) ? Infinity : (sortedA[currIdxA] as number);
      }

      let nextValB = (currIdxB === sampleSizeB) ? Infinity : (sortedB[currIdxB] as number);
      while (nextValB <= currVal) {
        cumulProbB += 1.0 / sampleSizeB;
        ++currIdxB;
        nextValB = (currIdxB === sampleSizeB) ? Infinity : (sortedB[currIdxB] as number);
      }

      const deviation = Math.abs(cumulProbA - cumulProbB);
      if (deviation > maxDeviation)
        maxDeviation = deviation;
    }

    return maxDeviation;
  }

  //-------------------------------------------------------------------------
}
