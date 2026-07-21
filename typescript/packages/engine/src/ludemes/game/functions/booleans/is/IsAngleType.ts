// @java Core/src/game/functions/booleans/is/IsAngleType.java

/**
 * Defines the types of Is for a connected or blocked test.
 *
 * @author Eric.Piette
 */
export enum IsAngleType {
  /** To check if a site and two other sites checking conditions form an acute angle (< 90 degrees). */
  Acute = 0,

  /** To check if a site and two other sites checking conditions form a right angle (= 90 degrees). */
  Right = 1,

  /** To check if a site and two other sites checking conditions form an obtuse angle (> 90 degrees). */
  Obtuse = 2,

  /** To check if a site and two other sites checking conditions form a reflex angle (> 180 degrees). */
  Reflex = 3,
}
