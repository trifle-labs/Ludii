// @java Core/src/metadata/graphics/no/NoBooleanType.java NoBooleanType
/**
 * Java parity:
 * - Core/src/metadata/graphics/no/NoBooleanType.java — faithful enum port.
 *   Defines the types of No/Hide metadata depending only on a boolean.
 */

export const NO_BOOLEAN_TYPES = [
  /** To indicate whether the board should be hidden. */
  "Board",
  /** To indicate whether the animations should be hidden. */
  "Animation",
  /** To indicate whether the sunken outline should be drawn. */
  "Sunken",
  /** To indicate whether pieces drawn in the hand should be scaled or not. */
  "HandScale",
  /** To indicate if the lines that make up the board's rings should be drawn as straight lines. */
  "Curves",
  /** To indicate if the colour of the masked players should not be the colour of the player. */
  "MaskedColour",
  /** To indicate if pips on the dice should be always drawn as a single number. */
  "DicePips",
] as const;

export type NoBooleanType = (typeof NO_BOOLEAN_TYPES)[number];

export function isNoBooleanType(value: string): value is NoBooleanType {
  return (NO_BOOLEAN_TYPES as readonly string[]).includes(value);
}
