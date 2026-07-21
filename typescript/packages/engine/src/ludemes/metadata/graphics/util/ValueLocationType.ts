/**
 * ValueLocationType.ts
 *
 * @java metadata/graphics/util/ValueLocationType.java
 *
 * Specifies where to draw state of an item in the interface,
 * relative to its position.
 */

/** @java metadata.graphics.util.ValueLocationType */
export const VALUE_LOCATION_TYPES = [
  /** No location. */
  "None",

  /** At the top left corner of the item's location. */
  "CornerLeft",

  /** At the top right corner of the item's location. */
  "CornerRight",

  /** At the top of the item's location. */
  "Top",

  /** Centred on the item's location. */
  "Middle",
] as const;

/** @java metadata.graphics.util.ValueLocationType */
export type ValueLocationType = (typeof VALUE_LOCATION_TYPES)[number];

/** True iff the given string is a valid ValueLocationType value. */
export function isValueLocationType(value: string): value is ValueLocationType {
  return (VALUE_LOCATION_TYPES as readonly string[]).includes(value);
}
