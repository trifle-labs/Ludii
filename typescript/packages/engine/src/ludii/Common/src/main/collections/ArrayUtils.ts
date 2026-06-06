// @java Common/src/main/collections/ArrayUtils.java

/**
 * Some utility methods for arrays.
 *
 * @java main/collections/ArrayUtils.java
 * @author Dennis Soemers
 */
export class ArrayUtils {

  /**
   * Private constructor — should not be used.
   * @java ArrayUtils()
   */
  private constructor() {
    // Should not be used
  }

  //-------------------------------------------------------------------------

  /**
   * @param arr
   * @param val
   * @return True if given array contains given value, false otherwise
   * @java ArrayUtils.contains(boolean[], boolean)
   */
  public static containsBoolean(arr: boolean[], val: boolean): boolean {
    for (let i = 0; i < arr.length; ++i) {
      if (arr[i] === val) return true;
    }
    return false;
  }

  /**
   * @param arr
   * @param val
   * @return True if given array contains given value, false otherwise
   * @java ArrayUtils.contains(int[], int)
   */
  public static containsInt(arr: number[], val: number): boolean {
    for (let i = 0; i < arr.length; ++i) {
      if (arr[i] === val) return true;
    }
    return false;
  }

  /**
   * @param arr
   * @param val
   * @return True if given array contains given value, false otherwise
   * @java ArrayUtils.contains(double[], double)
   */
  public static containsDouble(arr: number[], val: number): boolean {
    for (let i = 0; i < arr.length; ++i) {
      if (arr[i] === val) return true;
    }
    return false;
  }

  /**
   * @param arr
   * @param val
   * @return True if given array contains given object, false otherwise
   * @java ArrayUtils.contains(Object[], Object)
   */
  public static contains(arr: unknown[], val: unknown): boolean {
    for (let i = 0; i < arr.length; ++i) {
      if (arr[i] === null && val === null) return true;
      else if (arr[i] !== null && arr[i] !== undefined) {
        // Java: arr[i].equals(val)
        if (arr[i] === val) return true;
        // For objects with an equals method
        const maybeEquals = (arr[i] as { equals?: (v: unknown) => boolean }).equals;
        if (typeof maybeEquals === "function" && maybeEquals.call(arr[i], val)) return true;
      }
    }
    return false;
  }

  /**
   * @param val
   * @param arr
   * @return (First) index of given val in given array. -1 if not found
   * @java ArrayUtils.indexOf(int, int[])
   */
  public static indexOfInt(val: number, arr: number[]): number {
    for (let i = 0; i < arr.length; ++i) {
      if (arr[i] === val) return i;
    }
    return -1;
  }

  /**
   * @param val
   * @param arr
   * @return (First) index of given val in given array. -1 if not found
   * @java ArrayUtils.indexOf(Object, Object[])
   */
  public static indexOf(val: unknown, arr: unknown[]): number {
    for (let i = 0; i < arr.length; ++i) {
      const maybeEquals = (arr[i] as { equals?: (v: unknown) => boolean }).equals;
      if (typeof maybeEquals === "function") {
        if (maybeEquals.call(arr[i], val)) return i;
      } else if (arr[i] === val) {
        return i;
      }
    }
    return -1;
  }

  /**
   * @param arr
   * @return Maximum value in given array
   * @java ArrayUtils.max(int[])
   */
  public static maxInt(arr: number[]): number {
    let max = Number.MIN_SAFE_INTEGER;
    for (const val of arr) {
      if (val > max) max = val;
    }
    return max;
  }

  /**
   * @param arr
   * @return Maximum value in given array (float)
   * @java ArrayUtils.max(float[])
   */
  public static maxFloat(arr: number[]): number {
    let max = Number.NEGATIVE_INFINITY;
    for (const val of arr) {
      if (val > max) max = val;
    }
    return max;
  }

  /**
   * @param arr
   * @return Minimum value in given array
   * @java ArrayUtils.min(float[])
   */
  public static minFloat(arr: number[]): number {
    let min = Number.POSITIVE_INFINITY;
    for (const val of arr) {
      if (val < min) min = val;
    }
    return min;
  }

  /**
   * @param arr
   * @param val
   * @return Number of occurrences of given value in given array
   * @java ArrayUtils.numOccurrences(double[], double)
   */
  public static numOccurrences(arr: number[], val: number): number {
    let num = 0;
    for (let i = 0; i < arr.length; ++i) {
      if (arr[i] === val) ++num;
    }
    return num;
  }

  /**
   * Replaces all occurrences of oldVal with newVal in the given array.
   * @param arr
   * @param oldVal
   * @param newVal
   * @java ArrayUtils.replaceAll(int[], int, int)
   */
  public static replaceAll(arr: number[], oldVal: number, newVal: number): void {
    for (let i = 0; i < arr.length; ++i) {
      if (arr[i] === oldVal) arr[i] = newVal;
    }
  }

  //-------------------------------------------------------------------------

  /**
   * Note: probably kind of slow. Not intended for use in
   * performance-sensitive situations.
   *
   * @param matrix
   * @param numDecimals
   * @return A nicely-formatted String describing the given matrix
   * @java ArrayUtils.matrixToString(float[][], int)
   */
  public static matrixToString(matrix: number[][], numDecimals: number): string {
    let maxStrLength = 0;
    for (const arr of matrix) {
      for (const element of arr) {
        const length = String(Math.trunc(element)).length;
        if (length > maxStrLength) maxStrLength = length;
      }
    }

    let digitsFormat = 1;
    for (let i = 1; i < maxStrLength; ++i) {
      digitsFormat *= 10;
    }

    let sb = "";
    for (let i = 0; i < matrix.length; ++i) {
      const row = matrix[i]!;
      for (let j = 0; j < row.length; ++j) {
        // Java: String.format(Locale.ROOT, "%" + digitsFormat + "." + numDecimals + "f", matrix[i][j])
        sb += row[j]!.toFixed(numDecimals).padStart(
          String(digitsFormat).length + numDecimals + (numDecimals > 0 ? 1 : 0),
        );
        if (j < row.length - 1) sb += ",";
      }
      sb += "\n";
    }

    return sb;
  }

  //-------------------------------------------------------------------------

  /**
   * @param numEntries
   * @param comp
   * @return A list of indices (ranging from 0 up to numEntries exclusive), sorted
   *         using the given comparator.
   * @java ArrayUtils.sortedIndices(int, Comparator)
   */
  public static sortedIndices(
    numEntries: number,
    comp: (a: number, b: number) => number,
  ): number[] {
    const list: number[] = [];
    for (let i = 0; i < numEntries; ++i) {
      list.push(i);
    }
    list.sort(comp);
    return list;
  }

  //-------------------------------------------------------------------------
}
