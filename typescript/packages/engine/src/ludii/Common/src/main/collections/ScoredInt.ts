// @java Common/src/main/collections/ScoredInt.java

/**
 * A pair of a score (double) and an object (of type int).
 *
 * The ASCENDING or DESCENDING comparator objects from this class can be used for sorting based on scores.
 *
 * @java main.collections.ScoredInt
 * @author Dennis Soemers
 */
export class ScoredInt {
  private readonly _object: number;
  private readonly _score: number;

  /**
   * Constructor
   * @java ScoredInt(int, double)
   */
  public constructor(object: number, score: number) {
    this._object = object;
    this._score = score;
  }

  /**
   * @return The object
   * @java ScoredInt.object()
   */
  public object(): number {
    return this._object;
  }

  /**
   * @return The score
   * @java ScoredInt.score()
   */
  public score(): number {
    return this._score;
  }

  /**
   * Can be used for sorting in ascending order (with respect to scores)
   * @java ScoredInt.ASCENDING
   */
  public static ASCENDING: (a: ScoredInt, b: ScoredInt) => number =
    (o1: ScoredInt, o2: ScoredInt): number => {
      if (o1._score < o2._score)
        return -1;
      if (o1._score > o2._score)
        return 1;
      return 0;
    };

  /**
   * Can be used for sorting in descending order (with respect to scores)
   * @java ScoredInt.DESCENDING
   */
  public static DESCENDING: (a: ScoredInt, b: ScoredInt) => number =
    (o1: ScoredInt, o2: ScoredInt): number => {
      if (o1._score < o2._score)
        return 1;
      if (o1._score > o2._score)
        return -1;
      return 0;
    };
}
