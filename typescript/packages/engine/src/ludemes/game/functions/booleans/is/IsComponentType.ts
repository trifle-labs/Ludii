// @java Core/src/game/functions/booleans/is/IsComponentType.java

/**
 * Defines the types of Is test according to a component and a site/region.
 *
 * @author Eric.Piette
 */
export enum IsComponentType {
  /** To check if a location is under threat. */
  Threatened = 0,

  /** To check if a specific piece is on the designed region. */
  Within = 1,
}
