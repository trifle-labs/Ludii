/**
 * Defines regions which can change during play.
 *
 * @java game/types/board/RegionTypeDynamic.java
 */
export const REGION_TYPE_DYNAMIC_VALUES = [
  /** All the empty sites of the current state. */
  "Empty",
  /** All the occupied sites of the current state. */
  "NotEmpty",
  /** All the sites occupied by a piece of the mover. */
  "Own",
  /** All the sites not occupied by a piece of the mover. */
  "NotOwn",
  /** All the sites occupied by a piece of an enemy of the mover. */
  "Enemy",
  /** All the sites empty or occupied by a Neutral piece. */
  "NotEnemy",
] as const;

/** @java game/types/board/RegionTypeDynamic.java — enum RegionTypeDynamic */
export type RegionTypeDynamic = (typeof REGION_TYPE_DYNAMIC_VALUES)[number];

/** True iff the given string is a valid RegionTypeDynamic value. */
export function isRegionTypeDynamic(value: string): value is RegionTypeDynamic {
  return (REGION_TYPE_DYNAMIC_VALUES as readonly string[]).includes(value);
}
