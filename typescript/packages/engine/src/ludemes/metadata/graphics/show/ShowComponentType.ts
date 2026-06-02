/**
 * ShowComponentType.ts
 *
 * @java metadata/graphics/show/ShowComponentType.java
 *
 * Defines the types of Show metadata for a type of components.
 */

/** @java metadata.graphics.show.ShowComponentType */
export const SHOW_COMPONENT_TYPES = [
  /** The component to apply the type is a piece. */
  "Piece",
] as const;

/** @java metadata.graphics.show.ShowComponentType */
export type ShowComponentType = (typeof SHOW_COMPONENT_TYPES)[number];

/** True iff the given string is a valid ShowComponentType value. */
export function isShowComponentType(value: string): value is ShowComponentType {
  return (SHOW_COMPONENT_TYPES as readonly string[]).includes(value);
}
