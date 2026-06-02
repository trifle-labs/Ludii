/**
 * ShowComponentDataType.ts
 *
 * @java metadata/graphics/show/ShowComponentDataType.java
 *
 * Defines the types of data to show for a component in the super metadata Show ludeme.
 */

/** @java metadata.graphics.show.ShowComponentDataType */
export const SHOW_COMPONENT_DATA_TYPES = [
  /** Whether the state of a piece should be displayed. */
  "State",

  /** Whether the value of a piece should be displayed. */
  "Value",
] as const;

/** @java metadata.graphics.show.ShowComponentDataType */
export type ShowComponentDataType = (typeof SHOW_COMPONENT_DATA_TYPES)[number];

/** True iff the given string is a valid ShowComponentDataType value. */
export function isShowComponentDataType(value: string): value is ShowComponentDataType {
  return (SHOW_COMPONENT_DATA_TYPES as readonly string[]).includes(value);
}
