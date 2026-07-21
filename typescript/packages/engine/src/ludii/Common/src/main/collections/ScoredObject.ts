// @java Common/src/main/collections/ScoredObject.java

/**
 * A pair of a score (double) and an object (of any type E).
 *
 * The ASCENDING or DESCENDING comparator objects from this class can be used for sorting based on scores.
 *
 * @java main/collections/ScoredObject.java
 * @author Dennis Soemers
 * @param E Type of object for which we have a score
 */
export class ScoredObject<E> {

  /** @java ScoredObject#object */
  private readonly _object: E;

  /** @java ScoredObject#score */
  private readonly _score: number;

  /**
   * Constructor.
   * @param object
   * @param score
   * @java ScoredObject(E, double)
   */
  public constructor(object: E, score: number) {
    this._object = object;
    this._score = score;
  }

  /**
   * @return The object
   * @java ScoredObject.object()
   */
  public object(): E {
    return this._object;
  }

  /**
   * @return The score
   * @java ScoredObject.score()
   */
  public score(): number {
    return this._score;
  }

  //-------------------------------------------------------------------------

  /**
   * Can be used for sorting in ascending order (with respect to scores).
   * @java ScoredObject.ASCENDING
   */
  public static readonly ASCENDING: (o1: ScoredObject<unknown>, o2: ScoredObject<unknown>) => number =
    (o1: ScoredObject<unknown>, o2: ScoredObject<unknown>): number => {
      if (o1.score() < o2.score()) return -1;
      if (o1.score() > o2.score()) return 1;
      return 0;
    };

  /**
   * Can be used for sorting in descending order (with respect to scores).
   * @java ScoredObject.DESCENDING
   */
  public static readonly DESCENDING: (o1: ScoredObject<unknown>, o2: ScoredObject<unknown>) => number =
    (o1: ScoredObject<unknown>, o2: ScoredObject<unknown>): number => {
      if (o1.score() < o2.score()) return 1;
      if (o1.score() > o2.score()) return -1;
      return 0;
    };
}
