/**
 * ShowSymbolType.ts
 *
 * @java metadata/graphics/show/ShowSymbolType.java
 *
 * Defines the types of Draw metadata related to symbol.
 */

/** @java metadata.graphics.show.ShowSymbolType */
export const SHOW_SYMBOL_TYPES = [
  /** Draws a specified image on the board. */
  "Symbol",
] as const;

/** @java metadata.graphics.show.ShowSymbolType */
export type ShowSymbolType = (typeof SHOW_SYMBOL_TYPES)[number];

/** True iff the given string is a valid ShowSymbolType value. */
export function isShowSymbolType(value: string): value is ShowSymbolType {
  return (SHOW_SYMBOL_TYPES as readonly string[]).includes(value);
}
