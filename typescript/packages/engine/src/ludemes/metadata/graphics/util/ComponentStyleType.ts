/**
 * ComponentStyleType.ts
 *
 * @java metadata/graphics/util/ComponentStyleType.java
 *
 * Supported style types for rendering particular components.
 */

/** @java metadata.graphics.util.ComponentStyleType */
export const COMPONENT_STYLE_TYPES = [
  /** Style for pieces. */
  "Piece",

  /** Style for text/numbers (e.g. N Puzzles). */
  "Text",

  /** Style for tiles (components that fill a cell and may have marked paths). */
  "Tile",

  /** Style for playing cards. */
  "Card",

  /** Style for die components used as playing pieces. */
  "Die",

  /** Style for dominoes. */
  "Domino",

  /** Style for large pieces that straddle more than one site, e.g. the L Game. */
  "LargePiece",

  /** Extended style for Shogi pieces. */
  "ExtendedShogi",

  /** Extended style for Xiangqi pieces. */
  "ExtendedXiangqi",

  /** Style for native american dice. */
  "NativeAmericanDice",
] as const;

/** @java metadata.graphics.util.ComponentStyleType */
export type ComponentStyleType = (typeof COMPONENT_STYLE_TYPES)[number];

/** True iff the given string is a valid ComponentStyleType value. */
export function isComponentStyleType(value: string): value is ComponentStyleType {
  return (COMPONENT_STYLE_TYPES as readonly string[]).includes(value);
}

/**
 * Returns the ComponentStyleType for a name, defaulting to "Piece".
 * @java ComponentStyleType.fromName(String)
 */
export function componentStyleTypeFromName(name: string): ComponentStyleType {
  return isComponentStyleType(name) ? name : "Piece";
}
