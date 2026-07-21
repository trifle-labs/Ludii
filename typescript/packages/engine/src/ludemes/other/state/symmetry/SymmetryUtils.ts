// @java Core/src/other/state/symmetry/SymmetryUtils.java

/**
 * Utilities to support symmetry processing.
 * Faithful 1:1 port of SymmetryUtils.java.
 *
 * @author mrraow (Java), ported to TS
 */
export class SymmetryUtils {
  /**
   * Provides all permutations of { 1 ... n }, keeping 0 at the bottom index.
   * Java: public static final int[][] playerPermutations(int numPlayers)
   */
  static playerPermutations(numPlayers: number): number[][] {
    // Special case: > 4 players — return identity only
    if (numPlayers > 4) {
      const perm = new Array(numPlayers + 1).fill(0);
      for (let who = 1; who <= numPlayers; who++) perm[who] = who;
      return [perm];
    }
    // Degenerate case
    if (numPlayers === 1) return [[0, 1]];

    const permutations: number[][] = new Array(SymmetryUtils.factorial(numPlayers));
    permutations[0] = new Array(numPlayers + 1).fill(0);
    for (let who = 1; who <= numPlayers; who++) permutations[0]![who] = who;

    for (let p = 1; p < permutations.length; p++) {
      permutations[p] = SymmetryUtils.nextPermutation(permutations[p - 1]!);
    }
    return permutations;
  }

  private static factorial(n: number): number {
    let product = 1;
    for (let i = 1; i <= n; i++) product *= i;
    return product;
  }

  private static nextPermutation(previous: number[]): number[] {
    const next = [...previous];

    // Find last j: next[j] < next[j+1]
    let j = previous.length - 2;
    while (j >= 1 && next[j]! > next[j + 1]!) j--;

    // Find last l: next[j] <= next[l]
    let l = previous.length - 1;
    while (next[j]! > next[l]!) l--;

    // Swap
    SymmetryUtils.swap(next, j, l);

    // Reverse elements j+1 ... end
    let lo = j + 1;
    let hi = previous.length - 1;
    while (lo < hi) SymmetryUtils.swap(next, lo++, hi--);

    return next;
  }

  private static swap(arr: number[], i: number, j: number): void {
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }

  /**
   * Returns the result when op1 then op2 are applied in order.
   * Java: public static int[] combine(int[] op1, int[] op2)
   */
  static combine(op1: number[], op2: number[]): number[] {
    const result = new Array(op1.length);
    for (let idx = 0; idx < op1.length; idx++) result[idx] = op2[op1[idx]!]!;
    return result;
  }

  /**
   * Point rotated around origin by the specified fraction of a circle.
   * Java: public static Point2D rotateAroundPoint(...)
   */
  static rotateAroundPoint(
    originX: number, originY: number,
    srcX: number, srcY: number,
    steps: number, numSymmetries: number,
  ): [number, number] {
    const angle = Math.PI * 2.0 * steps / numSymmetries;
    const nx = srcX - originX;
    const ny = srcY - originY;
    const rx = nx * Math.cos(angle) - ny * Math.sin(angle);
    const ry = ny * Math.cos(angle) + nx * Math.sin(angle);
    return [originX + rx, originY + ry];
  }

  /**
   * Point reflected around a line through origin with the specified angle.
   * Java: public static Point2D reflectAroundLine(...)
   */
  static reflectAroundLine(
    originX: number, originY: number,
    srcX: number, srcY: number,
    steps: number, numSymmetries: number,
  ): [number, number] {
    // Special case: tan(PI/2) is asymptotic
    if (2 * steps === numSymmetries) {
      return [originX * 2 - srcX, srcY];
    }
    const angle = Math.PI * steps / numSymmetries;
    const m = Math.tan(angle);
    const c = originY - m * originX;
    const d = (srcX + (srcY - c) * m) / (1 + m * m);
    return [2 * d - srcX, 2 * d * m - srcY + 2 * c];
  }

  /**
   * True if two points are close enough to be considered the same.
   * Java: public static boolean closeEnough(Point2D p1, Point2D p2, double allowedError)
   */
  static closeEnough(x1: number, y1: number, x2: number, y2: number, allowedError: number): boolean {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy) <= allowedError;
  }

  /**
   * Returns true if the mapping maps every entry uniquely to a number in the range 0..length-1.
   * Java: public static boolean isBijective(final int[] mapping)
   */
  static isBijective(mapping: number[]): boolean {
    const set = new Set<number>();
    for (const cell of mapping) {
      if (cell < 0 || cell >= mapping.length) return false;
      set.add(cell);
    }
    return set.size === mapping.length;
  }
}
