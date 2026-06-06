// @java Common/src/main/collections/ListUtils.java

/**
 * Utility methods for lists
 *
 * @java main.collections.ListUtils
 * @author Dennis Soemers
 */
export class ListUtils {
  // -------------------------------------------------------------------------

  /**
   * Constructor
   * @java ListUtils()
   */
  private constructor() {
    // Should not be used
  }

  // -------------------------------------------------------------------------

  /**
   * @param list A single list
   * @return A list containing all possible permutations of the given list
   * @java ListUtils.generatePermutations(TIntArrayList)
   */
  public static generatePermutations(list: number[]): number[][] {
    if (list.length === 0) {
      const perms: number[][] = [];
      perms.push([]);
      return perms;
    }

    const listCopy = list.slice();
    const lastElement = listCopy.splice(listCopy.length - 1, 1)[0]!;
    const perms: number[][] = [];

    const smallPerms = ListUtils.generatePermutations(listCopy);
    for (const smallPerm of smallPerms) {
      for (let i = smallPerm.length; i >= 0; --i) {
        const newPerm = smallPerm.slice();
        newPerm.splice(i, 0, lastElement);
        perms.push(newPerm);
      }
    }

    return perms;
  }

  /**
   * NOTE: it's theoretically possible that we generate duplicate permutations.
   * @param list A single list
   * @param numPermutations Number of permutations we want to generate
   * @return A list containing a sample of all possible permutations
   * @java ListUtils.samplePermutations(TIntArrayList, int)
   */
  public static samplePermutations(list: number[], numPermutations: number): number[][] {
    const perms: number[][] = new Array(numPermutations);

    for (let i = 0; i < numPermutations; ++i) {
      const randomPerm = list.slice();
      // Fisher-Yates shuffle
      for (let j = randomPerm.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [randomPerm[j], randomPerm[k]] = [randomPerm[k]!, randomPerm[j]!];
      }
      perms[i] = randomPerm;
    }

    return perms;
  }

  /**
   * @param optionsLists List of n lists of options.
   * @return List containing all possible n-tuples (Cartesian Product).
   * @java ListUtils.generateTuples(List<List<E>>)
   */
  public static generateTuples<E>(optionsLists: E[][]): E[][] {
    const allTuples: E[][] = [];

    if (optionsLists.length > 0) {
      const firstEntryOptions = optionsLists[0]!;
      const remainingOptionsLists: E[][] = [];

      for (let i = 1; i < optionsLists.length; ++i) {
        remainingOptionsLists.push(optionsLists[i]!);
      }

      const nMinOneTuples = ListUtils.generateTuples(remainingOptionsLists);

      for (let i = 0; i < firstEntryOptions.length; ++i) {
        for (const nMinOneTuple of nMinOneTuples) {
          const newTuple = nMinOneTuple.slice();
          newTuple.unshift(firstEntryOptions[i]!);
          allTuples.push(newTuple);
        }
      }
    } else {
      allTuples.push([]);
    }

    return allTuples;
  }

  // -------------------------------------------------------------------------

  /**
   * @param maxExclusive
   * @return Exactly like python's range() function, generates a list from 0 to maxExclusive
   * @java ListUtils.range(int)
   */
  public static range(maxExclusive: number): number[];
  /**
   * @param minInclusive
   * @param maxExclusive
   * @return Exactly like python's range() function, generates a list from minInclusive to maxExclusive
   * @java ListUtils.range(int, int)
   */
  public static range(minInclusive: number, maxExclusive: number): number[];
  public static range(minOrMax: number, maxExclusive?: number): number[] {
    if (maxExclusive === undefined) {
      const list: number[] = new Array(minOrMax);
      for (let i = 0; i < minOrMax; ++i)
        list[i] = i;
      return list;
    }
    // Note: Java implementation has a bug: it does (maxExclusive - minInclusive) instead of maxExclusive
    const minInclusive = minOrMax;
    const list: number[] = [];
    for (let i = minInclusive; i < maxExclusive - minInclusive; ++i)
      list.push(i);
    return list;
  }

  /**
   * Splits the given list into numLists different sublists (TIntArrayList overload).
   * @java ListUtils.split(TIntArrayList, int)
   */
  public static splitIntArray(list: number[], numLists: number): number[][] {
    const sublists: number[][] = new Array(numLists);
    const sublistSize = Math.ceil(list.length / numLists);

    for (let i = 0; i < numLists; ++i) {
      const sublist: number[] = [];

      for (let j = 0; j < sublistSize; ++j) {
        sublist.push(list[i * sublistSize + j]!);
        if (i * sublistSize + j + 1 >= list.length)
          break;
      }

      sublists[i] = sublist;
    }

    return sublists;
  }

  /**
   * Splits the given list into numLists different sublists.
   * @java ListUtils.split(List<E>, int)
   */
  public static split<E>(list: E[], numLists: number): E[][] {
    const sublists: E[][] = new Array(numLists);
    const sublistSize = Math.ceil(list.length / numLists);

    for (let i = 0; i < numLists; ++i) {
      const sublist: E[] = [];

      for (let j = 0; j < sublistSize; ++j) {
        sublist.push(list[i * sublistSize + j]!);
        if (i * sublistSize + j + 1 >= list.length)
          break;
      }

      sublists[i] = sublist;
    }

    return sublists;
  }

  // -------------------------------------------------------------------------

  /**
   * @param list
   * @return Index of maximum entry in the list (breaks ties by taking the lowest index).
   * @java ListUtils.argMax(TFloatArrayList)
   */
  public static argMax(list: number[]): number {
    let argMax = 0;
    let maxVal = list[0]!;

    for (let i = 1; i < list.length; ++i) {
      const val = list[i]!;
      if (val > maxVal) {
        maxVal = val;
        argMax = i;
      }
    }

    return argMax;
  }

  // -------------------------------------------------------------------------

  /**
   * Removes element at given index using remove-swap.
   * @java ListUtils.removeSwap(List<E>, int)
   */
  public static removeSwap<E>(list: E[], idx: number): void {
    const lastIdx = list.length - 1;
    list[idx] = list[lastIdx]!;
    list.splice(lastIdx, 1);
  }

  /**
   * Removes element at given index using remove-swap (number[] overload).
   * @java ListUtils.removeSwap(TIntArrayList, int)
   */
  public static removeSwapIntArray(list: number[], idx: number): void {
    const lastIdx = list.length - 1;
    list[idx] = list[lastIdx]!;
    list.splice(lastIdx, 1);
  }

  /**
   * Removes all elements from the given list that satisfy the given predicate, using remove-swap.
   * @java ListUtils.removeSwapIf(List<E>, Predicate<E>)
   */
  public static removeSwapIf<E>(list: E[], predicate: (e: E) => boolean): void {
    for (let i = list.length - 1; i >= 0; --i) {
      if (predicate(list[i]!))
        ListUtils.removeSwap(list, i);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Generates all combinations of given target combination-length from the given list of candidates.
   * @java ListUtils.generateAllCombinations(TIntArrayList, int, int, int[], List<TIntArrayList>)
   */
  public static generateAllCombinations(
    candidates: number[],
    combinationLength: number,
    startIdx: number,
    currentCombination: number[],
    combinations: number[][]
  ): void {
    if (combinationLength === 0) {
      combinations.push(currentCombination.slice());
    } else {
      for (let i = startIdx; i <= candidates.length - combinationLength; ++i) {
        currentCombination[currentCombination.length - combinationLength] = candidates[i]!;
        ListUtils.generateAllCombinations(candidates, combinationLength - 1, i + 1, currentCombination, combinations);
      }
    }
  }

  /**
   * @param numItems Number of items from which we can pick
   * @param combinationLength How many items should we pick per combination
   * @return How many combinations of N items are there, if we sample with replacement (order does not matter)?
   * @java ListUtils.numCombinationsWithReplacement(int, int)
   */
  public static numCombinationsWithReplacement(numItems: number, combinationLength: number): number {
    // (n + r - 1)! / (r! * (n - 1)!)
    // Where n = numItems, r = combinationLength
    let numerator = 1;
    let denominator = 1;

    if (combinationLength >= (numItems - 1)) {
      // Retain (n - 1)! as denominator
      // Retain (r + 1) * (r + 2) * ... * (n + r - 1) as numerator
      for (let i = combinationLength + 1; i <= (numItems + combinationLength - 1); ++i) {
        numerator *= i;
      }
      for (let i = 1; i <= (numItems - 1); ++i) {
        denominator *= i;
      }
    } else {
      // Retain r! as denominator
      // Retain n * (n + 1) * ... * (n + r - 1) as numerator
      for (let i = numItems; i <= (numItems + combinationLength - 1); ++i) {
        numerator *= i;
      }
      for (let i = 1; i <= combinationLength; ++i) {
        denominator *= i;
      }
    }

    return Math.floor(numerator / denominator);
  }

  /**
   * @param items
   * @param combinationLength
   * @return All possible combinations of n selections of given array of items, sampled with replacement.
   * @java ListUtils.generateCombinationsWithReplacement(Object[], int)
   */
  public static generateCombinationsWithReplacement(
    items: unknown[],
    combinationLength: number
  ): unknown[][] {
    if (combinationLength === 0)
      return [];

    const numCombinations = ListUtils.numCombinationsWithReplacement(items.length, combinationLength);
    const combinations: unknown[][] = new Array(numCombinations);

    let nextCombIdx = 0;
    const indices: number[] = new Array(combinationLength).fill(0);
    let idxToIncrement = indices.length - 1;
    while (true) {
      const arr: unknown[] = new Array(combinationLength);
      for (let i = 0; i < indices.length; ++i) {
        arr[i] = items[indices[i]!];
      }
      combinations[nextCombIdx++] = arr;

      while (idxToIncrement >= 0) {
        indices[idxToIncrement] = indices[idxToIncrement]! + 1;
        if (indices[idxToIncrement]! === items.length) {
          indices[idxToIncrement--] = 0;
        } else {
          break;
        }
      }

      if (idxToIncrement < 0)
        break;

      // Order does not matter
      for (let i = idxToIncrement + 1; i < indices.length; ++i) {
        indices[i] = indices[idxToIncrement]!;
      }

      idxToIncrement = indices.length - 1;
    }

    if (nextCombIdx !== numCombinations)
      process.stderr.write("ERROR: Expected to generate " + numCombinations + " combinations, but only generated " + nextCombIdx + "\n");

    return combinations;
  }

  // -------------------------------------------------------------------------
}
